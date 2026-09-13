import { completeStage, createPlayerState, type PlayerState } from '../player/model.ts';
import { DEFAULT_GAME_SETTINGS, type GameSettings } from '../application/settings.ts';
import { requireDefinition, type CombatContent, type PickupType, type StageTemplate } from './content.ts';
import { Vector3, type Vector3Value } from './math.ts';
import { Ship } from './ship.ts';
import { Enemy } from './enemy.ts';
import { Projectile } from './projectile.ts';
import { Beam } from './beam.ts';
import { Planet } from './planet.ts';
import { Nebula } from './nebula.ts';
import { Hypergate } from './hypergate.ts';
import { Pickup } from './pickup.ts';
import { Explosion } from './explosion.ts';
import { FlightUI } from './flight-ui.ts';

export interface TouchPosition { readonly x: number; readonly y: number }
export interface StageStats {
  readonly stageName: string;
  kills: number;
  credits: number;
  weapons: string[];
  equipment: string[];
}

/** Owns one stage, in the same update order as Game.mm. All tuning is per 40 Hz tick. */
export class Game {
  readonly content: CombatContent;
  readonly stage: StageTemplate;
  readonly stageName: string;
  readonly random: () => number;
  readonly settings: GameSettings;
  readonly originalPlayer: PlayerState;
  player: PlayerState;
  ship: Ship;
  readonly enemies: Enemy[] = [];
  readonly projectiles: Projectile[] = [];
  readonly beams: Beam[] = [];
  readonly pickups: Pickup[] = [];
  readonly explosions: Explosion[] = [];
  readonly planets: Planet[];
  readonly nebulas: Nebula[];
  readonly hypergate: Hypergate;
  readonly activeTouches = new Map<number, TouchPosition>();
  readonly cameraPosition = new Vector3(0, 0, 40);
  readonly previousAngles = [0, 0, 0, 0];
  readonly stats: StageStats;
  readonly flightUI: FlightUI;
  nextIdentifier = 0;
  tick = 0;
  angle = 0;
  turnAmount = 0;
  lastTilt = 0;
  hasAccelerometer = false;
  previousPinchDistance = 0;
  weaponGroupId = 0;
  stageIsEnding = false;
  stageEndFrame = 0;
  completionFlash = 0;
  finished = false;
  onPause: (() => void) | undefined;

  constructor(content: CombatContent, player: PlayerState, random = Math.random, settings = DEFAULT_GAME_SETTINGS) {
    this.content = content;
    this.originalPlayer = createPlayerState(player);
    this.player = createPlayerState(player);
    this.stageName = player.currentStage;
    this.stage = requireDefinition(content.stages, this.stageName);
    this.random = random;
    this.settings = settings;
    this.planets = this.stage.planets.map((template) => new Planet(template));
    this.nebulas = this.stage.nebulas.map((template) => new Nebula(template, random));
    this.ship = new Ship(Ship.snapshotForLoadout(content, this.nextIdentifier++, player.ship), this);
    this.ship.position.set({ ...this.stage.hypergatePosition, z: 0 });
    this.hypergate = new Hypergate(this.ship.position, random);
    this.createEnemies();
    this.stats = { stageName: this.stageName, kills: 0, credits: 0, weapons: [], equipment: [] };
    this.flightUI = new FlightUI(this);
    this.flightUI.update();
  }

  private createEnemies(): void {
    for (const template of this.stage.enemies) {
      if (template.firstTimeOnly && this.player.completedStages.includes(this.stageName)) continue;
      let quantity;
      if (template.qty) {
        const [minimum = 0, maximum = 0] = template.qty.split('-').map(Number);
        quantity = Math.floor(this.random() * (maximum - minimum + 1)) + minimum;
      } else {
        quantity = template.chance === undefined || this.random() < template.chance ? 1 : 0;
      }
      for (let index = 0; index < quantity; index += 1) {
        const enemy = new Enemy(template.loadout, this);
        if (quantity > 1 || !template.position) {
          do {
            enemy.position.x = this.random() * 120 - 60;
            enemy.position.y = this.random() * 120 - 60;
          } while (enemy.position.length() === 0 || enemy.position.distance2D(this.hypergate.position) < 12 || enemy.position.length() > 60);
        } else {
          enemy.position.set({ ...template.position, z: 0 });
        }
        enemy.angle = this.random() * 360;
        enemy.desiredAngle = enemy.angle;
        enemy.optional = template.optional;
        this.enemies.push(enemy);
      }
    }
  }

  get targets(): readonly Ship[] { return [...this.enemies, this.ship]; }
  targetsFor(ownerId: number): readonly Ship[] { return ownerId === this.ship.id ? this.enemies : [this.ship]; }
  get canBeCompleted(): boolean { return this.enemies.every((enemy) => enemy.optional); }
  get alpha(): number { return this.stageIsEnding ? Math.max(0, 1 - this.stageEndFrame / 60) : 1; }

  update(): void {
    if (this.finished) return;
    this.tick += 1;
    this.updateTouches();
    this.updateAngle();
    this.updateProjectiles();
    this.updateBeams();
    this.ship.update();
    this.cameraPosition.x = this.ship.position.x;
    this.cameraPosition.y = this.ship.position.y;
    this.updateEnemies();
    this.updatePickups();
    this.updateNebulas();
    this.flightUI.update();
    this.updateCollision();
    this.updateExplosions();
    this.hypergate.updateWithCompletion(this.canBeCompleted);
    this.checkForCompletion();
    if (this.canBeCompleted && this.completionFlash < 60) this.completionFlash += 1;
  }

  private updateTouches(): void {
    const controls = this.ship.controls;
    controls.thrusting = controls.reversing = controls.braking = controls.firing = false;
    for (const point of this.activeTouches.values()) {
      if (!this.stageIsEnding) {
        if (inside(point, 0, 176, 56, 81)) controls.thrusting = true;
        else if (inside(point, 0, 264, 56, 56)) controls.reversing = true;
        else if (inside(point, 56, 264, 81, 56)) controls.braking = true;
      }
      if (inside(point, 424, 152, 56, 56)) { controls.firing = true; this.weaponGroupId = 0; }
      else if (inside(point, 424, 208, 56, 56)) { controls.firing = true; this.weaponGroupId = 1; }
      else if (inside(point, 424, 264, 81, 56)) { controls.firing = true; this.weaponGroupId = 2; }
      if (inside(point, 347, 0, 75, 75) && this.activeTouches.size === 1) this.onPause?.();
    }
    const points = [...this.activeTouches.values()];
    const first = points[0];
    const second = points[1];
    if (points.length === 2 && first && second && first.x > 69 && first.x < 411 && second.x > 69 && second.x < 411) {
      const distance = Math.hypot(first.x - second.x, first.y - second.y);
      if (this.previousPinchDistance !== 0) this.cameraPosition.z += (this.previousPinchDistance - distance) / 20;
      this.previousPinchDistance = distance;
    } else {
      this.previousPinchDistance = 0;
    }
    this.cameraPosition.z = Math.max(8, Math.min(40, this.cameraPosition.z));
    // This is the Original Game's simulator fallback, useful when no sensor is present.
    if (!this.hasAccelerometer) {
      this.turnAmount = 0;
      if (points.length === 1 && first && first.x > 69 && first.x < 411) this.turnAmount = first.x < 240 ? -1 : 1;
    }
  }

  private updateAngle(): void {
    this.angle -= this.turnAmount;
    if (this.angle < 0) this.angle += 360;
    if (this.angle > 360) this.angle -= 360;
    this.previousAngles.shift();
    this.previousAngles.push(this.angle);
    this.ship.desiredAngle = this.previousAngles[0]!;
  }

  private updateProjectiles(): void {
    const targets = new Map(this.targets.map((ship) => [ship.id, ship]));
    for (const projectile of this.projectiles) projectile.updateWithTargets(targets);
    removeWhere(this.projectiles, (projectile) => projectile.expired);
  }

  private updateBeams(): void {
    for (const beam of this.beams) beam.update();
    removeWhere(this.beams, (beam) => beam.expired);
  }

  private updateEnemies(): void {
    const destroyed = new Set<Enemy>();
    for (const enemy of this.enemies) {
      if (enemy.currentArmor <= 0) {
        enemy.spawnLoot();
        destroyed.add(enemy);
      } else enemy.update();
    }
    removeWhere(this.enemies, (enemy) => destroyed.has(enemy));
  }

  private updatePickups(): void {
    for (const pickup of this.pickups) pickup.updateWithGame(this);
    removeWhere(this.pickups, (pickup) => pickup.expired);
  }

  private updateNebulas(): void { for (const nebula of this.nebulas) nebula.update(); }

  private updateCollision(): void {
    const targets = new Map(this.targets.map((ship) => [ship.id, ship]));
    for (const projectile of this.projectiles) {
      for (const identifier of projectile.potentialTargetIds) {
        const target = targets.get(identifier);
        if (!target || target.currentArmor <= 0 || projectile.position.distance2D(target.position) >= target.definition.size + projectile.definition.collisionSize) continue;
        projectile.expired = true;
        if (projectile.definition.explosionSize > 0) projectile.explode();
        else {
          target.damage(projectile.definition.shieldDamage, projectile.definition.armorDamage);
          const knockback = projectile.velocity.clone().normalize().scale(projectile.definition.hitForce / target.mass);
          target.velocity.add(knockback);
          this.addExplosion(projectile.position, null, projectile.definition.collisionSize / 3, 'Hit.png', 4, 15);
        }
      }
    }
  }

  private updateExplosions(): void {
    for (const explosion of this.explosions) explosion.update();
    removeWhere(this.explosions, (explosion) => explosion.expired);
  }

  private checkForCompletion(): void {
    if (this.stageIsEnding) {
      this.stageEndFrame += 1;
      if (this.ship.currentArmor > 0) {
        this.ship.velocity.scale(0.95 * this.alpha);
        const gateDistance = this.hypergate.position.clone().subtract(this.ship.position).scale(this.alpha * 0.15);
        this.ship.velocity.add(gateDistance);
        this.cameraPosition.z = 24 + 16 * (1 - Math.cos(Math.PI * this.alpha / 2));
      }
      if (this.stageEndFrame > 60) this.finished = true;
    } else if (this.ship.currentArmor <= 0 || (this.canBeCompleted && this.ship.position.distance2D(this.hypergate.position) - this.ship.definition.size < 3)) {
      this.stageIsEnding = true;
    }
  }

  shipDestroyed(ship: Ship): void {
    const template = requireDefinition(this.content.shipTypes, ship.type);
    this.addExplosion(ship.position, ship.velocity, ship.definition.size * 3, template.explosionSprite, 16, 60);
    if (ship !== this.ship) this.stats.kills += 1;
  }

  addExplosion(position: Vector3Value, velocity: Vector3Value | null, size: number, image: string, frames: number, duration: number): void {
    this.explosions.push(new Explosion(position, velocity, size, image, frames, duration, this.random));
  }

  addCredits(credits: number): void {
    this.stats.credits += credits;
    this.player = { ...this.player, credits: this.player.credits + credits };
  }

  pickupItem(name: string, type: Exclude<PickupType, 'Money'>): void {
    if (type === 'Weapon') {
      this.stats.weapons.push(name);
      this.player = { ...this.player, newWeaponCount: this.player.newWeaponCount + 1 };
    } else {
      this.stats.equipment.push(name);
      this.player = { ...this.player, newEquipmentCount: this.player.newEquipmentCount + 1 };
    }
  }

  completedPlayer(): PlayerState {
    if (!this.finished || this.ship.currentArmor <= 0) return this.originalPlayer;
    return completeStage(createPlayerState({ ...this.player, inventory: {
      weapons: [...this.player.inventory.weapons, ...this.stats.weapons],
      equipment: [...this.player.inventory.equipment, ...this.stats.equipment],
    } }), this.stageName);
  }

  abortStage(): void { this.ship.damage(1_000_000, 1_000_000); }

  accelerometer(accelerationY: number): void {
    this.hasAccelerometer = true;
    let currentTilt = Math.max(-1, Math.min(1, accelerationY * this.settings.turnSensitivity));
    if (this.settings.invertSteering) currentTilt = -currentTilt;
    if (currentTilt > -0.2 && currentTilt < 0.2) currentTilt = 0;
    else currentTilt = (currentTilt - Math.sign(currentTilt) * 0.2) / 0.8;
    currentTilt *= -3;
    this.turnAmount = (currentTilt + this.lastTilt) / 2;
    this.lastTilt = currentTilt;
  }

  touchesBegan(identifier: number, position: TouchPosition): void { this.activeTouches.set(identifier, position); }
  touchesMoved(identifier: number, position: TouchPosition): void {
    if (this.activeTouches.has(identifier)) this.activeTouches.set(identifier, position);
  }
  touchesEnded(identifier: number): void { this.activeTouches.delete(identifier); }
  clearTouches(): void {
    this.activeTouches.clear();
    this.previousPinchDistance = 0;
    this.turnAmount = this.lastTilt = 0;
    this.ship.controls.thrusting = this.ship.controls.reversing = this.ship.controls.braking = this.ship.controls.firing = false;
  }
}

function inside(point: TouchPosition, x: number, y: number, width: number, height: number): boolean {
  return point.x > x && point.x < x + width && point.y > y && point.y < y + height;
}

function removeWhere<T>(values: T[], predicate: (value: T) => boolean): void {
  let destination = 0;
  for (const value of values) if (!predicate(value)) values[destination++] = value;
  values.length = destination;
}
