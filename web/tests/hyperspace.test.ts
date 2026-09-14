import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

import { musicForRoute } from '../src/application/routes.ts';
import {
  preflightFailure,
  raceName,
  stageState,
  tierName,
  visibleConnections,
  type StageCatalog,
} from '../src/hyperspace/model.ts';
import { completeStage, createPlayerState } from '../src/player/model.ts';

const content = (name: string) => new URL(`../public/content/data/${name}.json`, import.meta.url);

describe('hyperspace map', () => {
  it('derives the Original Game campaign state from authoritative stage data', async () => {
    const player = createPlayerState(JSON.parse(await readFile(content('newPlayer'), 'utf8')));
    const stages = JSON.parse(await readFile(content('stages'), 'utf8')) as StageCatalog;

    assert.equal(stageState(player, 'Discipulus Minor', stages), 'current');
    assert.equal(stageState(player, 'Discipulus Medius', stages), 'locked');

    const advanced = completeStage(player, 'Discipulus Minor');
    assert.equal(stageState(advanced, 'Discipulus Minor', stages), 'current');
    assert.equal(stageState(advanced, 'Discipulus Medius', stages), 'reachable');
    assert(visibleConnections(advanced, stages).some(([from, to]) =>
      from === 'Discipulus Minor' && to === 'Discipulus Medius'));
  });

  it('maps the original race, tier, and preflight copy', () => {
    assert.equal(raceName(1), 'Cykan');
    assert.equal(raceName(4), 'Lanaar');
    assert.equal(tierName({ tier: 5, zone: 4, connections: [], description: '', galaxyPosition: { x: 0, y: 0 } }), 'Homeworld');
    assert.equal(preflightFailure({ kind: 'no-ship' })?.title, 'No Ship');
    assert.match(preflightFailure({ kind: 'no-weapon-group' })?.message ?? '', /A, B and C/);
  });
});

describe('route music boundary', () => {
  it('owns hyperspace music only while the hyperspace shell is active', () => {
    assert.equal(musicForRoute({ name: 'title' }), 'MusicTheme');
    assert.equal(musicForRoute({ name: 'hyperspace' }), 'MusicHyperspace');
    assert.equal(musicForRoute({ name: 'combat', stage: 'Discipulus Minor' }), null);
  });
});

describe('hyperspace help overlay', () => {
  it('preserves the alpha channel of the Original Game help artwork', async () => {
    const css = await readFile(new URL('../src/styles/app.css', import.meta.url), 'utf8');
    const overlayRule = css.match(/\.hyperspace-help \{[^}]+\}/s)?.[0];

    assert(overlayRule);
    assert.match(overlayRule, /background:\s*transparent/);
  });
});
