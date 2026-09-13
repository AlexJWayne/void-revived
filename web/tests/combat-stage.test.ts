import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { it } from 'node:test';
import { createPlayerState } from '../src/player/model.ts';
import type { CombatContent } from '../src/combat/content.ts';
import { Game } from '../src/combat/game.ts';
import { captureGame, restoreGame } from '../src/combat/game-state.ts';

function data(name: string) {
  return JSON.parse(readFileSync(new URL(`../public/content/data/${name}.json`, import.meta.url), 'utf8'));
}

const content: CombatContent = {
  stages: data('stages'), shipTypes: data('shipTypes'), weapons: data('weapons'),
  equipment: data('equipment'), enemies: data('enemies'), lootTables: data('lootTables'),
};

function player() {
  return createPlayerState({ ...data('newPlayer'), ownedShips: ['Cyber Shuttle'],
    ship: { type: 'Cyber Shuttle', guns: ['Genjuro Blaster'], equipment: ['<Empty>'], weaponGroups: [[0], [], []] } });
}

it('plays the Original Game first stage through weapons, pickups, and surviving gate exit', () => {
  const game = new Game(content, player(), () => 0.4);
  assert.equal(game.enemies.length, 4);
  assert.equal(game.canBeCompleted, false);
  game.ship.position.y = 7;
  game.touchesBegan(1, { x: 452, y: 180 });
  game.touchesBegan(2, { x: 84, y: 292 });
  for (let tick = 0; tick < 1000 && !game.canBeCompleted; tick += 1) game.update();
  assert.equal(game.canBeCompleted, true);
  assert.equal(game.stats.kills, 1);
  assert.equal(game.enemies.length, 3, 'optional asteroids remain');
  game.touchesEnded(1);
  game.touchesEnded(2);
  assert.ok(game.pickups.length > 0);
  const pickup = game.pickups[0]!;
  game.ship.position.set(pickup.position);
  game.ship.velocity.scale(0);
  game.update();
  assert.ok(game.stats.credits > 0);
  game.ship.position.set(game.hypergate.position);
  game.ship.velocity.scale(0);
  game.update();
  assert.equal(game.stageIsEnding, true);
  for (let tick = 0; tick < 61; tick += 1) game.update();
  assert.equal(game.finished, true);
  assert.ok(game.completedPlayer().completedStages.includes('Discipulus Minor'));
  assert.ok(game.completedPlayer().credits > player().credits);
});

it('restores live combat without losing damage, collected rewards, or weapon cooldowns', () => {
  const game = new Game(content, player(), () => 0.4);
  game.ship.position.y = 7;
  game.ship.damage(70, 20);
  game.addCredits(23);
  game.pickupItem('Genjuro Blaster', 'Weapon');
  game.touchesBegan(1, { x: 452, y: 180 });
  game.update();
  game.clearTouches();
  const snapshot = JSON.parse(JSON.stringify(captureGame(game)));
  const restored = restoreGame(content, snapshot, () => 0.4);
  assert.deepEqual(captureGame(restored), snapshot);
  assert.equal(restored.projectiles.length, 1);
  restored.abortStage();
  for (let tick = 0; tick < 62; tick += 1) restored.update();
  assert.deepEqual(restored.completedPlayer(), player(), 'defeat discards uncommitted rewards');
  assert.throws(() => restoreGame(content, { ...snapshot, version: 99 }));
  assert.throws(() => restoreGame(content, { ...snapshot, ship: { ...snapshot.ship, position: { x: null, y: 0, z: 0 } } }));
});

it('keeps independent movement and weapon touches and resets pinch history on release', () => {
  const game = new Game(content, player(), () => 0.4);
  game.touchesBegan(1, { x: 28, y: 200 });
  game.touchesBegan(2, { x: 452, y: 180 });
  game.update();
  assert.equal(game.ship.controls.thrusting, true);
  assert.equal(game.ship.controls.firing, true);
  assert.equal(game.projectiles.length, 1);
  assert.equal(game.projectiles[0]!.age, 0, 'a weapon fires after the projectile update phase');
  game.touchesEnded(2);
  game.update();
  assert.equal(game.projectiles[0]!.age, 1);
  assert.equal(game.ship.controls.thrusting, true);
  assert.equal(game.ship.controls.firing, false);
  game.clearTouches();
  game.touchesBegan(3, { x: 180, y: 150 });
  game.touchesBegan(4, { x: 280, y: 150 });
  game.update();
  game.touchesMoved(4, { x: 320, y: 150 });
  game.update();
  assert.equal(game.cameraPosition.z, 38);
  game.clearTouches();
  game.touchesBegan(5, { x: 100, y: 150 });
  game.touchesBegan(6, { x: 380, y: 150 });
  game.update();
  assert.equal(game.cameraPosition.z, 38, 'a new pinch starts at the current zoom');
});

it('uses the native accelerometer dead zone, two-sample smoothing, and four-frame camera history', () => {
  const game = new Game(content, player(), () => 0.4);
  game.accelerometer(0.05);
  game.update();
  assert.equal(game.angle, 0);
  game.accelerometer(1 / 3);
  game.update();
  assert.equal(game.angle, 1.5);
  assert.equal(game.ship.desiredAngle, 0);
  game.accelerometer(1 / 3);
  game.update();
  assert.equal(game.angle, 4.5);
  game.update();
  game.update();
  assert.equal(game.ship.desiredAngle, 1.5);
});

it('tracks consecutive render transforms for stationary crate and mine AI', () => {
  const game = new Game(content, player(), () => 0.4);
  const crate = game.enemies.find((enemy) => enemy.loadoutName === 'Cyber Crate')!;
  game.update();
  const first = { angle: crate.angle, bankAngle: crate.bankAngle, z: crate.position.z };
  game.update();
  assert.equal(crate.previousAngle, first.angle);
  assert.equal(crate.previousBankAngle, first.bankAngle);
  assert.equal(crate.previousPosition.z, first.z);
});
