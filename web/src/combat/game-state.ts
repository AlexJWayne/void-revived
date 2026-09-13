import { createPlayerState, type PlayerState } from '../player/model.ts';
import { DEFAULT_GAME_SETTINGS, type GameSettings } from '../application/settings.ts';
import type { CombatContent } from './content.ts';
import { Game, type StageStats } from './game.ts';
import { Ship, type ShipSnapshot } from './ship.ts';
import { Enemy, type EnemySnapshot } from './enemy.ts';
import { Projectile, type ProjectileSnapshot } from './projectile.ts';
import { Beam, type BeamSnapshot } from './beam.ts';
import { Pickup, type PickupSnapshot } from './pickup.ts';
import { Explosion, type ExplosionSnapshot } from './explosion.ts';
import type { Vector3Value } from './math.ts';

export interface GameSnapshot {
  readonly version: 1;
  readonly stageName: string;
  readonly originalPlayer: PlayerState;
  readonly player: PlayerState;
  readonly ship: ShipSnapshot;
  readonly enemies: readonly EnemySnapshot[];
  readonly projectiles: readonly ProjectileSnapshot[];
  readonly beams: readonly BeamSnapshot[];
  readonly pickups: readonly PickupSnapshot[];
  readonly explosions: readonly ExplosionSnapshot[];
  readonly stats: StageStats;
  readonly tick: number;
  readonly nextIdentifier: number;
  readonly angle: number;
  readonly cameraPosition: Vector3Value;
  readonly previousAngles: readonly number[];
  readonly weaponGroupId: number;
  readonly stageIsEnding: boolean;
  readonly stageEndFrame: number;
  readonly completionFlash: number;
  readonly hypergate: { readonly angle: number; readonly angle2: number; readonly birthProgress: number };
  readonly nebulaAngles: readonly number[];
}

/** The one-shot combat archive is separate from committed campaign progress. */
export function captureGame(game: Game): GameSnapshot {
  return {
    version: 1, stageName: game.stageName,
    originalPlayer: createPlayerState(game.originalPlayer), player: createPlayerState(game.player),
    ship: game.ship.toSnapshot(), enemies: game.enemies.map((enemy) => enemy.toSnapshot()),
    projectiles: game.projectiles.map((projectile) => projectile.toSnapshot()),
    beams: game.beams.map((beam) => beam.toSnapshot()), pickups: game.pickups.map((pickup) => pickup.toSnapshot()),
    explosions: game.explosions.map((explosion) => explosion.toSnapshot()),
    stats: { ...game.stats, weapons: [...game.stats.weapons], equipment: [...game.stats.equipment] },
    tick: game.tick, nextIdentifier: game.nextIdentifier, angle: game.angle,
    cameraPosition: game.cameraPosition.toJSON(), previousAngles: [...game.previousAngles],
    weaponGroupId: game.weaponGroupId, stageIsEnding: game.stageIsEnding, stageEndFrame: game.stageEndFrame,
    completionFlash: game.completionFlash,
    hypergate: { angle: game.hypergate.angle, angle2: game.hypergate.angle2, birthProgress: game.hypergate.birthProgress },
    nebulaAngles: game.nebulas.map((nebula) => nebula.angle),
  };
}

export function restoreGame(content: CombatContent, value: unknown, random = Math.random,
  settings: GameSettings = DEFAULT_GAME_SETTINGS): Game {
  const snapshot = validateSnapshot(value, content);
  const game = new Game(content, snapshot.originalPlayer, random, settings);
  game.player = createPlayerState(snapshot.player);
  game.ship = new Ship(snapshot.ship, game);
  game.enemies.splice(0, game.enemies.length, ...snapshot.enemies.map((enemy) => new Enemy(enemy.loadoutName, game, enemy)));
  game.projectiles.push(...snapshot.projectiles.map((projectile) => new Projectile(projectile, game)));
  for (const saved of snapshot.beams) {
    const beam = new Beam(saved.template, saved.ownerId, saved.position, saved.velocity, saved.angle);
    beam.length = saved.length;
    beam.age = saved.age;
    beam.expired = saved.expired;
    beam.acceleration.set(saved.acceleration);
    game.beams.push(beam);
  }
  for (const saved of snapshot.pickups) {
    const pickup = new Pickup(saved.type, saved.itemName, game);
    pickup.position.set(saved.position);
    pickup.velocity.set(saved.velocity);
    pickup.acceleration.set(saved.acceleration);
    pickup.angle = saved.angle;
    pickup.previousPosition.set(saved.position);
    pickup.previousAngle = saved.angle;
    pickup.size = saved.size;
    pickup.creditValue = saved.creditValue;
    pickup.pickedUp = saved.pickedUp;
    pickup.animationCounter = saved.animationCounter;
    game.pickups.push(pickup);
  }
  for (const saved of snapshot.explosions) {
    const explosion = new Explosion(saved.position, saved.velocity, saved.size, saved.imageName, saved.animationFrames, saved.lifetime, random);
    explosion.age = saved.age;
    explosion.angle = saved.angle;
    explosion.previousAngle = saved.angle;
    explosion.acceleration.set(saved.acceleration);
    game.explosions.push(explosion);
  }
  Object.assign(game.stats, snapshot.stats, { weapons: [...snapshot.stats.weapons], equipment: [...snapshot.stats.equipment] });
  game.tick = snapshot.tick;
  game.nextIdentifier = snapshot.nextIdentifier;
  game.angle = snapshot.angle;
  game.cameraPosition.set(snapshot.cameraPosition);
  game.previousCameraAngle = snapshot.angle;
  game.previousCameraHeight = snapshot.cameraPosition.z;
  game.previousAngles.splice(0, 4, ...snapshot.previousAngles);
  game.weaponGroupId = snapshot.weaponGroupId;
  game.stageIsEnding = snapshot.stageIsEnding;
  game.stageEndFrame = snapshot.stageEndFrame;
  game.completionFlash = snapshot.completionFlash;
  Object.assign(game.hypergate, snapshot.hypergate);
  game.hypergate.previousAngle = snapshot.hypergate.angle;
  game.hypergate.previousAngle2 = snapshot.hypergate.angle2;
  game.nebulas.forEach((nebula, index) => {
    nebula.angle = snapshot.nebulaAngles[index]!;
    nebula.previousAngle = nebula.angle;
  });
  // Physical touches cannot survive a page reload. The flight interface resumes paused.
  game.clearTouches();
  game.flightUI.update();
  return game;
}

function validateSnapshot(value: unknown, content: CombatContent): GameSnapshot {
  const input = record(value);
  if (input.version !== 1) throw new Error('Unsupported combat archive version');
  const player = createPlayerState(input.player);
  const originalPlayer = createPlayerState(input.originalPlayer);
  if (typeof input.stageName !== 'string' || !content.stages[input.stageName]
    || player.currentStage !== input.stageName || originalPlayer.currentStage !== input.stageName) throw new Error('Invalid saved combat stage');
  for (const key of ['tick', 'nextIdentifier', 'angle', 'weaponGroupId', 'stageEndFrame', 'completionFlash']) finite(input[key]);
  if (![0, 1, 2].includes(input.weaponGroupId as number) || typeof input.stageIsEnding !== 'boolean') throw new Error('Invalid combat controls');
  vector(input.cameraPosition);
  const angles = array(input.previousAngles);
  if (angles.length !== 4) throw new Error('Invalid saved camera history');
  angles.forEach(finite);
  const gate = record(input.hypergate);
  ['angle', 'angle2', 'birthProgress'].forEach((key) => finite(gate[key]));
  const nebulaAngles = array(input.nebulaAngles);
  if (nebulaAngles.length !== content.stages[input.stageName]!.nebulas.length) throw new Error('Invalid saved nebulas');
  nebulaAngles.forEach(finite);
  validateShip(input.ship, content);
  const identifiers = new Set([record(input.ship).id]);
  for (const enemy of array(input.enemies)) {
    validateShip(enemy, content);
    const saved = record(enemy);
    if (typeof saved.loadoutName !== 'string' || !content.enemies[saved.loadoutName]
      || typeof saved.optional !== 'boolean' || identifiers.has(saved.id)) throw new Error('Invalid saved enemy');
    identifiers.add(saved.id);
    const ai = record(saved.ai);
    if (typeof ai.noticedPlayer !== 'boolean') throw new Error('Invalid saved AI');
    finite(ai.tendency); finite(ai.zBobPhase);
  }
  for (const projectile of array(input.projectiles)) {
    const saved = spaceObject(projectile);
    finite(saved.id); finite(saved.ownerId); finite(saved.age);
    if (identifiers.has(saved.id) || typeof saved.expired !== 'boolean') throw new Error('Invalid saved projectile');
    identifiers.add(saved.id);
    const definition = record(saved.definition);
    for (const key of ['lifetime', 'shieldDamage', 'armorDamage', 'hitForce', 'size', 'collisionSize', 'explosionSize', 'seekLockAngle', 'seekTurnSpeed']) finite(definition[key]);
    array(saved.potentialTargetIds).forEach(finite);
    if (saved.seekTargetId !== null) finite(saved.seekTargetId);
    if (saved.template) validateWeapon(saved.template);
  }
  for (const beam of array(input.beams)) {
    const saved = spaceObject(beam);
    finite(saved.ownerId); finite(saved.length); finite(saved.age);
    if (typeof saved.expired !== 'boolean') throw new Error('Invalid saved beam');
    validateWeapon(saved.template);
  }
  for (const pickup of array(input.pickups)) {
    const saved = spaceObject(pickup);
    if (!['Money', 'Weapon', 'Equipment'].includes(String(saved.type)) || typeof saved.pickedUp !== 'boolean') throw new Error('Invalid saved pickup');
    finite(saved.size); finite(saved.creditValue); finite(saved.animationCounter);
    if (saved.type !== 'Money') {
      const catalog = saved.type === 'Weapon' ? content.weapons : content.equipment;
      if (typeof saved.itemName !== 'string' || !catalog[saved.itemName]) throw new Error('Invalid saved item');
    }
  }
  for (const explosion of array(input.explosions)) {
    const saved = spaceObject(explosion);
    ['size', 'lifetime', 'age'].forEach((key) => finite(saved[key]));
    if (typeof saved.imageName !== 'string' || ![4, 16].includes(saved.animationFrames as number)) throw new Error('Invalid saved explosion');
  }
  const stats = record(input.stats);
  finite(stats.kills); finite(stats.credits);
  if (stats.stageName !== input.stageName) throw new Error('Invalid saved stage statistics');
  for (const key of ['weapons', 'equipment'] as const) {
    for (const name of array(stats[key])) if (typeof name !== 'string' || !content[key][name]) throw new Error('Invalid saved stage reward');
  }
  return input as unknown as GameSnapshot;
}

function validateShip(value: unknown, content: CombatContent): void {
  const ship = spaceObject(value);
  for (const key of ['id', 'weaponMass', 'desiredAngle', 'bankAngle', 'currentShields', 'currentArmor', 'currentEnergy', 'shieldRechargeDelayElapsed', 'shieldBubbleAlpha']) finite(ship[key]);
  if (typeof ship.type !== 'string' || !content.shipTypes[ship.type]) throw new Error('Invalid saved ship type');
  const definition = record(ship.definition);
  for (const key of ['shields', 'shieldRecharge', 'shieldRechargeDelay', 'armor', 'maxSpeed', 'thrusterForce', 'brakeForce', 'turnSpeed', 'size', 'mass', 'energy', 'energyRecharge']) finite(definition[key]);
  if ((definition.mass as number) + (ship.weaponMass as number) <= 0) throw new Error('Invalid saved ship mass');
  const loadout = record(ship.loadout);
  if (loadout.type !== ship.type) throw new Error('Invalid saved loadout');
  const guns = array(loadout.guns);
  if (guns.length > content.shipTypes[ship.type]!.gunHardpoints.length) throw new Error('Invalid saved hardpoints');
  for (const key of ['guns', 'equipment'] as const) {
    const catalog = key === 'guns' ? content.weapons : content.equipment;
    for (const name of array(loadout[key])) if (name !== '<Empty>' && (typeof name !== 'string' || !catalog[name])) throw new Error('Invalid saved equipment');
  }
  const groups = array(loadout.weaponGroups);
  if (groups.length !== 3) throw new Error('Invalid saved weapon groups');
  for (const group of groups) for (const index of array(group)) {
    finite(index);
    if (!Number.isInteger(index) || (index as number) < 0 || (index as number) >= guns.length) throw new Error('Invalid saved weapon group');
  }
  const controls = record(ship.controls);
  for (const key of ['thrusting', 'reversing', 'braking', 'firing']) if (typeof controls[key] !== 'boolean') throw new Error('Invalid saved ship controls');
  array(ship.gunCooldowns).forEach(finite);
  const order = array(ship.gunOrder);
  if (order.length !== guns.length || new Set(order).size !== guns.length
    || order.some((index) => !Number.isInteger(index) || (index as number) < 0 || (index as number) >= guns.length)) throw new Error('Invalid saved gun order');
  finite(ship.thrusterAlpha); finite(ship.pulsePhase);
}

function validateWeapon(value: unknown): void {
  const weapon = record(value);
  for (const key of ['lifetime', 'shieldDmg', 'armorDmg', 'forceHit', 'projectileSize', 'projectileCollisionSize', 'beamRange']) finite(weapon[key]);
  if (typeof weapon.projectileImage !== 'string') throw new Error('Invalid saved projectile image');
}

function spaceObject(value: unknown): Record<string, unknown> {
  const object = record(value);
  vector(object.position); vector(object.velocity); vector(object.acceleration); finite(object.angle);
  return object;
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid combat archive object');
  return value as Record<string, unknown>;
}

function array(value: unknown): unknown[] {
  if (!Array.isArray(value)) throw new Error('Invalid combat archive list');
  return value;
}

function finite(value: unknown): void {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error('Invalid combat archive number');
}

function vector(value: unknown): void {
  const position = record(value);
  finite(position.x); finite(position.y); finite(position.z);
}
