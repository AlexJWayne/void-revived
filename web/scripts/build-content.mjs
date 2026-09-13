import { createHash } from 'node:crypto';
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readPlist } from './lib/plist.mjs';
import { buildAudio } from './lib/audio.mjs';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(scriptDirectory, '..');
const repositoryRoot = path.resolve(webRoot, '..');
const outputRoot = path.join(webRoot, 'public', 'content');

const DATA_FILES = {
  achievements: 'Achievements.plist',
  enemies: 'Enemies.plist',
  equipment: 'Equipment.plist',
  lootTables: 'LootTables.plist',
  newPlayer: 'NewPlayer.plist',
  shipTypes: 'ShipTypes.plist',
  stages: 'Stages.plist',
  weapons: 'Weapons.plist',
};

const TEXTURE_OVERRIDES = new Map([
  ['Projectiles.png', 'Assets/Images/Content/Weapons/Projectiles/Projectiles.png'],
]);

function sorted(value) {
  if (Array.isArray(value)) return value.map(sorted);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sorted(value[key])]));
  }
  return value;
}

function stableJson(value) {
  return `${JSON.stringify(sorted(value), null, 2)}\n`;
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

async function filesBelow(directory, predicate) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await filesBelow(absolute, predicate));
    else if (predicate(absolute)) result.push(absolute);
  }
  return result.sort();
}

function compileStage(source) {
  const position = ([x, y]) => ({ x, y });
  return {
    tier: Number(source.tier),
    zone: Number(source.zone),
    connections: source.connections,
    description: source.description ?? '',
    galaxyPosition: position(source.galaxyLocation),
    hypergatePosition: position(source.hypergate.location),
    music: source.music,
    planets: (source.planets ?? []).map((planet) => ({
      image: `Planet.${planet.name}.png`,
      size: Math.trunc(Number(planet.radius)) * 2,
      position: position(planet.location),
    })),
    backgroundColor: { r: 0, g: 0, b: 0 },
    nebulas: (source.nebulas ?? []).map((nebula) => ({
      texture: nebula.texture,
      position: position(nebula.location),
      size: Math.trunc(Number(nebula.radius)) * 2,
      opacity: nebula.opacity,
      drag: nebula.drag,
      energyRegen: nebula.energyRegen,
      shieldRegen: nebula.shieldRegen,
      armorRegen: nebula.armorRegen,
    })),
    enemies: source.enemies.map((enemy) => {
      const compiled = { loadout: enemy.name, optional: Boolean(enemy.optional) };
      if (enemy.mode === 'pos') {
        const [x, y] = enemy.location;
        if (Math.hypot(x, y) > 80) throw new Error(`Enemy ${enemy.name} is outside the play area at (${x}, ${y})`);
        return { ...compiled, position: { x, y }, firstTimeOnly: Boolean(enemy.firstOnly), chance: enemy.chance };
      }
      if (enemy.mode === 'qty') return { ...compiled, qty: `${enemy.qty[0]}-${enemy.qty[1]}` };
      throw new Error(`Unknown enemy placement mode: ${enemy.mode}`);
    }),
  };
}

async function compileStages() {
  const directory = path.join(repositoryRoot, 'Assets', 'Stages');
  const names = (await readdir(directory)).filter((name) => name.endsWith('.json')).sort();
  const stages = {};
  for (const filename of names) {
    const source = JSON.parse(await readFile(path.join(directory, filename), 'utf8'));
    stages[path.basename(filename, '.json')] = compileStage(source);
  }
  return stages;
}

function validateModel(contents, name) {
  const lines = contents.trim().split(/\r?\n/);
  if (lines.length !== 4) throw new Error(`${name}: expected four VMdl lines`);
  const faces = Number.parseInt(lines[0], 10);
  const counts = lines.slice(1).map((line) => line.split(',').length);
  if (!Number.isInteger(faces) || faces < 0 || counts[0] !== faces * 9 || counts[1] !== faces * 9 || counts[2] !== faces * 6) {
    throw new Error(`${name}: VMdl face and component counts disagree`);
  }
  for (const line of lines.slice(1)) {
    if (line.split(',').some((component) => !Number.isFinite(Number(component)))) throw new Error(`${name}: non-numeric VMdl component`);
  }
  return faces;
}

function chooseTexture(name, candidates) {
  const override = TEXTURE_OVERRIDES.get(name);
  if (override) {
    const selected = candidates.find((candidate) => candidate.source === override);
    if (!selected) throw new Error(`Missing authoritative texture override: ${override}`);
    return selected.absolute;
  }
  const hashes = new Set(candidates.map((candidate) => candidate.hash));
  if (hashes.size > 1) throw new Error(`Ambiguous runtime texture ${name}: ${candidates.map((candidate) => candidate.source).join(', ')}`);
  return candidates[0].absolute;
}

function assert(condition, message, errors) {
  if (!condition) errors.push(message);
}

function validateGraph(data, textureNames, modelNames) {
  const errors = [];
  const missingModelReferences = [];
  const stageNames = new Set(Object.keys(data.stages));
  const enemyNames = new Set(Object.keys(data.enemies));
  const shipNames = new Set(Object.keys(data.shipTypes));
  const weaponNames = new Set(Object.keys(data.weapons));
  const equipmentNames = new Set(Object.keys(data.equipment));
  const lootNames = new Set(Object.keys(data.lootTables));
  const textureExists = (name) => textureNames.has(name.trim()) || textureNames.has(`${name.trim()}.png`);

  for (const [stageName, stage] of Object.entries(data.stages)) {
    for (const connection of stage.connections) assert(stageNames.has(connection), `${stageName}: missing connected stage ${connection}`, errors);
    for (const enemy of stage.enemies) assert(enemyNames.has(enemy.loadout), `${stageName}: missing enemy loadout ${enemy.loadout}`, errors);
    for (const planet of stage.planets) assert(textureExists(planet.image), `${stageName}: missing planet texture ${planet.image}`, errors);
    for (const nebula of stage.nebulas) assert(textureExists(nebula.texture), `${stageName}: missing nebula texture ${nebula.texture}`, errors);
  }
  for (const [enemyName, enemy] of Object.entries(data.enemies)) {
    assert(shipNames.has(enemy.type), `${enemyName}: missing ship type ${enemy.type}`, errors);
    for (const weapon of enemy.guns) assert(weaponNames.has(weapon), `${enemyName}: missing weapon ${weapon}`, errors);
    for (const equipment of enemy.equipment) assert(equipmentNames.has(equipment), `${enemyName}: missing equipment ${equipment}`, errors);
    for (const loot of Object.keys(enemy.loot)) if (loot !== 'credits') assert(lootNames.has(loot), `${enemyName}: missing loot table ${loot}`, errors);
  }
  for (const [tableName, entries] of Object.entries(data.lootTables)) {
    for (const entry of entries) {
      const collection = entry.type === 'Weapon' ? weaponNames : entry.type === 'Equipment' ? equipmentNames : null;
      assert(collection?.has(entry.name), `${tableName}: missing ${entry.type} ${entry.name}`, errors);
    }
  }
  for (const [shipName, ship] of Object.entries(data.shipTypes)) {
    for (const part of ship.model) {
      if (!modelNames.has(`${part.modelName}.vmdl`)) missingModelReferences.push(`${shipName}: ${part.modelName}`);
      assert(textureExists(part.texture), `${shipName}: missing texture ${JSON.stringify(part.texture)}`, errors);
    }
    if (ship.thrusterModelName && !modelNames.has(`${ship.thrusterModelName}.vmdl`)) missingModelReferences.push(`${shipName}: ${ship.thrusterModelName}`);
    assert(textureExists(ship.thrusterTexture), `${shipName}: missing thruster texture ${ship.thrusterTexture}`, errors);
  }
  for (const [name, item] of [...Object.entries(data.weapons), ...Object.entries(data.equipment)]) {
    assert(textureExists(`ItemIcon.${item.icon}.png`), `${name}: missing item icon ItemIcon.${item.icon}.png`, errors);
  }
  assert(stageNames.has(data.newPlayer.currentStage), `NewPlayer: missing current stage ${data.newPlayer.currentStage}`, errors);
  if (errors.length) throw new Error(`Content graph validation failed:\n- ${errors.join('\n- ')}`);
  return missingModelReferences.sort();
}

async function main() {
  const data = {};
  for (const [key, filename] of Object.entries(DATA_FILES)) data[key] = await readPlist(path.join(repositoryRoot, filename));
  const editableStages = await compileStages();
  if (stableJson(editableStages) !== stableJson(data.stages)) throw new Error('Assets/Stages JSON does not compile to the authoritative Stages.plist');
  data.stages = editableStages;

  const imageRoots = [path.join(repositoryRoot, 'Assets', 'Images'), path.join(repositoryRoot, 'Assets', 'Models', 'Ships')];
  const imagePaths = (await Promise.all(imageRoots.map((root) => filesBelow(root, (file) => file.endsWith('.png'))))).flat();
  const textureCandidates = new Map();
  for (const absolute of imagePaths) {
    const name = path.basename(absolute);
    const source = path.relative(repositoryRoot, absolute);
    const buffer = await readFile(absolute);
    const candidate = { absolute, source, hash: sha256(buffer) };
    textureCandidates.set(name, [...(textureCandidates.get(name) ?? []), candidate]);
  }

  const requiredShipTextures = new Set(Object.values(data.shipTypes).flatMap((ship) => [ship.thrusterTexture, ...ship.model.map((part) => part.texture)].map((name) => name.trim())));
  const imageTextureNames = new Set((await filesBelow(imageRoots[0], (file) => file.endsWith('.png'))).map((file) => path.basename(file)));
  const includedTextureNames = new Set([...imageTextureNames, ...requiredShipTextures]);
  const selectedTextures = new Map();
  for (const name of [...includedTextureNames].sort()) {
    const candidates = textureCandidates.get(name);
    if (!candidates?.length) throw new Error(`No source file for runtime texture ${name}`);
    const absolute = chooseTexture(name, candidates);
    selectedTextures.set(name, { absolute, source: path.relative(repositoryRoot, absolute) });
  }

  const modelDirectory = path.join(repositoryRoot, 'Assets', 'Models', 'Ships', 'vmdl');
  const modelPaths = await filesBelow(modelDirectory, (file) => file.endsWith('.vmdl'));
  const modelNames = new Set(modelPaths.map((file) => path.basename(file)));
  const missingModelReferences = validateGraph(data, includedTextureNames, modelNames);

  await rm(outputRoot, { force: true, recursive: true });
  await Promise.all(['data', 'models', 'textures'].map((name) => mkdir(path.join(outputRoot, name), { recursive: true })));

  const manifest = { version: 1, data: {}, models: {}, textures: {}, audio: {}, validation: {} };
  manifest.audio = await buildAudio(repositoryRoot, outputRoot, data);
  for (const [key, value] of Object.entries(data)) {
    const filename = `${key}.json`;
    const contents = Buffer.from(stableJson(value));
    await writeFile(path.join(outputRoot, 'data', filename), contents);
    manifest.data[key] = { url: `data/${filename}`, bytes: contents.length, sha256: sha256(contents) };
  }
  for (const absolute of modelPaths) {
    const name = path.basename(absolute);
    const contents = await readFile(absolute);
    const faces = validateModel(contents.toString('utf8'), name);
    await cp(absolute, path.join(outputRoot, 'models', name));
    manifest.models[path.basename(name, '.vmdl')] = { url: `models/${name}`, source: path.relative(repositoryRoot, absolute), bytes: contents.length, sha256: sha256(contents), faces };
  }
  for (const [name, selected] of selectedTextures) {
    const contents = await readFile(selected.absolute);
    await cp(selected.absolute, path.join(outputRoot, 'textures', name));
    const match = name.match(/^(.*)@2x(\.png)$/);
    const logicalName = match ? `${match[1]}${match[2]}` : name;
    const variant = match ? 'twoX' : 'oneX';
    manifest.textures[logicalName] ??= {};
    manifest.textures[logicalName][variant] = { url: `textures/${name}`, source: selected.source, bytes: contents.length, sha256: sha256(contents) };
  }
  manifest.validation = {
    stageSource: 'Assets/Stages/*.json',
    stages: Object.keys(data.stages).length,
    enemyLoadouts: Object.keys(data.enemies).length,
    shipTypes: Object.keys(data.shipTypes).length,
    weapons: Object.keys(data.weapons).length,
    equipment: Object.keys(data.equipment).length,
    models: Object.keys(manifest.models).length,
    textureFamilies: Object.keys(manifest.textures).length,
    audioFiles: Object.keys(manifest.audio).length,
    missingAudioReferences: ['Thruster.Neutral', 'Thruster.Neutral.Reverse'],
    missingModelReferences,
  };
  await writeFile(path.join(outputRoot, 'manifest.json'), stableJson(manifest));
  console.log(`Built ${manifest.validation.stages} stages, ${manifest.validation.models} models, and ${manifest.validation.textureFamilies} texture families.`);
}

await main();
