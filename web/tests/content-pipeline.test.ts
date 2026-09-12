import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { parseVmdl } from '../src/assets/vmdl.ts';

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
