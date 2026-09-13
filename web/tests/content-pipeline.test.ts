import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { parseVmdl } from '../src/assets/vmdl.ts';
// The converter runs before TypeScript compilation, like the plist build tool.
// @ts-expect-error The build-only JavaScript module has no declaration file.
import { loopingEffectNames } from '../scripts/lib/audio.mjs';

const manifestUrl = new URL('../public/content/manifest.json', import.meta.url);

test('generates the complete initial content graph', async () => {
  const manifest = JSON.parse(await readFile(manifestUrl, 'utf8'));
  assert.equal(manifest.version, 1);
  assert.equal(manifest.validation.stages, 81);
  assert.equal(manifest.validation.enemyLoadouts, 112);
  assert.equal(manifest.validation.shipTypes, 107);
  assert.equal(manifest.validation.weapons, 53);
  assert.equal(manifest.validation.equipment, 95);
  assert.equal(manifest.validation.models, 121);
  assert.deepEqual(manifest.validation.missingModelReferences, ['Crystal Freighter: CrystalFreighter.Thruster']);
  assert.equal(manifest.textures['Projectiles.png'].oneX.source, 'Assets/Images/Content/Weapons/Projectiles/Projectiles.png');
});

test('parses the production VMdl representation', () => {
  const mesh = parseVmdl('1\n0,1,2,3,4,5,6,7,8\n0,0,1,0,0,1,0,0,1\n0,0,1,0,1,1');
  assert.equal(mesh.faceCount, 1);
  assert.deepEqual([...mesh.positions], [0, 1, 2, 3, 4, 5, 6, 7, 8]);
});

test('converts audio to the two agreed formats and preserves every referenced loop losslessly', async () => {
  const manifest = JSON.parse(await readFile(manifestUrl, 'utf8'));
  const data = async (name: string) => JSON.parse(await readFile(new URL(`../public/content/data/${name}.json`, import.meta.url), 'utf8'));
  const loops = loopingEffectNames(await data('weapons'), await data('shipTypes'));
  assert.equal(Object.keys(manifest.audio).length, 121);
  assert.deepEqual(manifest.validation.missingAudioReferences, ['Thruster.Neutral', 'Thruster.Neutral.Reverse']);
  let totalBytes = 0;
  for (const [name, entry] of Object.entries(manifest.audio) as [string, { url: string; bytes: number; format: string; kind: string }][]) {
    assert.equal(entry.format, loops.has(name) ? 'wav' : 'm4a');
    const bytes = await readFile(new URL(`../public/content/${entry.url}`, import.meta.url));
    assert.equal(bytes.length, entry.bytes);
    totalBytes += bytes.length;
    if (entry.format === 'wav') assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
    else {
      assert.equal(bytes.toString('ascii', 4, 8), 'ftyp');
      assert.ok(bytes.indexOf('moov') < bytes.indexOf('mdat'), `${name}: metadata precedes audio for progressive playback`);
    }
  }
  assert.ok(totalBytes < 22 * 1024 * 1024, 'browser audio is substantially smaller than the 56 MiB CAF originals');
});
