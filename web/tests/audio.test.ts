import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { afterEach, test } from 'node:test';
import { SoundEffect, effectVolumeAtDistance } from '../src/audio/sound-effect.ts';
import { BackgroundMusic, type MusicOutput } from '../src/audio/background-music.ts';
import { effectsForGame } from '../src/audio/content.ts';
import { Game } from '../src/combat/game.ts';
import { createPlayerState } from '../src/player/model.ts';
import type { CombatContent } from '../src/combat/content.ts';

class Source {
  buffer: AudioBuffer | null = null;
  loop = false;
  onended: (() => void) | null = null;
  offset = 0;
  stopped = false;
  connect(target: unknown) { return target; }
  disconnect() {}
  start(_time: number, offset: number) { this.offset = offset; }
  stop() { this.stopped = true; }
}

function output() {
  const sources: Source[] = [];
  const gains: { gain: { value: number }; connect: () => void; disconnect: () => void }[] = [];
  const context = {
    currentTime: 0, destination: {},
    createBufferSource() { const source = new Source(); sources.push(source); return source; },
    createGain() { const gain = { gain: { value: 1 }, connect() {}, disconnect() {} }; gains.push(gain); return gain; },
  };
  const buffers = new Map([['Select', { duration: 2 } as AudioBuffer]]);
  SoundEffect.configure(context as unknown as AudioContext, buffers);
  SoundEffect.enabled = true;
  return { context, sources, gains, buffers };
}

afterEach(() => { SoundEffect.configure(); BackgroundMusic.globalMusic?.stop(); BackgroundMusic.configure(); });

test('shares named players but allows independent overlapping players for the same recording', () => {
  const { sources } = output();
  const cached = SoundEffect.effectNamed('Select');
  assert.equal(cached, SoundEffect.effectNamed('Select'));
  cached.play(); cached.play();
  new SoundEffect('Select').play();
  assert.equal(sources.length, 2, 'replaying an active AVAudioPlayer does not layer another copy');
  sources[0]!.onended!();
  assert.equal(cached.playing, false);
  cached.play();
  assert.equal(sources.length, 3);
});

test('stops a loop immediately and resumes it from its saved position', () => {
  const { sources, context } = output();
  const sound = new SoundEffect('Select', true);
  sound.play();
  context.currentTime = 0.75;
  sound.stopAndDecay();
  assert.equal(sources[0]!.stopped, true);
  assert.equal(sound.playing, false);
  context.currentTime = 10;
  sound.play();
  assert.equal(sources[1]!.offset, 0.75);
  assert.equal(sources[1]!.loop, true);
  SoundEffect.stopAll();
  assert.equal(sound.playing, false);
});

test('allows navigation cues to finish but stops loops when draining scene cache', () => {
  const { sources } = output();
  SoundEffect.effectNamed('Select').play();
  new SoundEffect('Select', true).play();
  SoundEffect.drainCache();
  assert.equal(sources[0]!.stopped, false);
  assert.equal(sources[1]!.stopped, true);
  SoundEffect.stopAll();
  assert.equal(sources[0]!.stopped, true);
});

test('does not queue unloaded effects or playback while interrupted', () => {
  const { sources, buffers } = output();
  const sound = new SoundEffect('Later');
  sound.play();
  buffers.set('Later', { duration: 1 } as AudioBuffer);
  assert.equal(sources.length, 0);
  SoundEffect.enabled = false;
  sound.play();
  assert.equal(sources.length, 0);
  SoundEffect.enabled = true;
  sound.play();
  assert.equal(sources.length, 1);
});

test('preserves the native distance curve and updates the live player volume', () => {
  const { gains } = output();
  assert.deepEqual([0, 7, 8, 14, 20, 21].map(effectVolumeAtDistance), [1, 1, 0, 0.5, 1, 0]);
  SoundEffect.setListenerPos({ x: 10, y: 2, z: 0 });
  const sound = new SoundEffect('Select');
  sound.setPosition({ x: 24, y: 2, z: 100 });
  sound.play();
  assert.equal(gains[0]!.gain.value, 0.5, 'distance is two-dimensional');
  sound.setVolume(0.2);
  assert.equal(gains[0]!.gain.value, 0.2);
});

test('music ownership prevents an outgoing screen from stopping or changing the new track', () => {
  const calls: unknown[] = [];
  const output: MusicOutput = {
    play: (name, volume) => calls.push([name, volume]),
    stop: () => calls.push('stop'), setVolume: (volume) => calls.push(volume),
  };
  BackgroundMusic.configure(output);
  const title = new BackgroundMusic('MusicTheme', 0.25);
  const hyperspace = new BackgroundMusic('MusicHyperspace', 0.25);
  title.play(); hyperspace.play(); title.stop(); title.setVolume(0);
  hyperspace.setVolume(0.1);
  assert.equal(BackgroundMusic.globalMusic, hyperspace);
  assert.deepEqual(calls, [['MusicTheme', 0.25], ['MusicHyperspace', 0.25], 0.1]);
});

test('prepares only the selected stage effects and resolves every audible reference', () => {
  const data = (name: string) => JSON.parse(readFileSync(new URL(`../public/content/data/${name}.json`, import.meta.url), 'utf8'));
  const content: CombatContent = { stages: data('stages'), shipTypes: data('shipTypes'), weapons: data('weapons'),
    equipment: data('equipment'), enemies: data('enemies'), lootTables: data('lootTables') };
  const player = createPlayerState({ ...data('newPlayer'), ownedShips: ['Cyber Shuttle'],
    ship: { type: 'Cyber Shuttle', guns: ['Genjuro Blaster'], equipment: ['<Empty>'], weaponGroups: [[0], [], []] } });
  const manifest = JSON.parse(readFileSync(new URL('../public/content/manifest.json', import.meta.url), 'utf8'));
  const names = effectsForGame(new Game(content, player, () => 0.4));
  assert.ok(names.includes('Thruster.Cyber'));
  assert.ok(names.includes('Weapon.VulcanCannon'));
  assert.ok(!names.some((name) => name.startsWith('Music')));
  assert.ok(names.length < 30, 'does not preload the complete effects catalogue');
  for (const name of names) assert.equal(manifest.audio[name]?.kind, 'effect', name);
});
