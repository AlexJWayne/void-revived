import { angleDifference, Vector3 } from './math.ts';
import { SpaceObject, type SpaceObjectSnapshot } from './space-object.ts';
import { EMPTY_SLOT, type PlayerShip } from '../player/model.ts';
import { requireDefinition, type CombatContent } from './content.ts';
import type { Game } from './game.ts';
import { Weapon } from './weapon.ts';
import { SoundEffect } from '../audio/sound-effect.ts';

const BANK_MAX = 30;
const BANK_FILTER = 0.05;
const SHIELD_VISIBLE_TICKS = 15;

export interface ShipDefinition {
  readonly shields: number;
  readonly shieldRecharge: number;
  readonly shieldRechargeDelay: number;
  readonly armor: number;
  readonly maxSpeed: number;
  readonly thrusterForce: number;
  readonly brakeForce: number;
  readonly turnSpeed: number;
  readonly size: number;
  readonly mass: number;
  readonly energy: number;
  readonly energyRecharge: number;
  readonly armorRecharge?: number;
}

export interface ShipControls {
  readonly thrusting: boolean;
  readonly reversing: boolean;
  readonly braking: boolean;
  readonly firing: boolean;
}

export interface ShipSnapshot extends SpaceObjectSnapshot {
  readonly id: number;
  readonly type: string;
  readonly definition: ShipDefinition;
  readonly weaponMass: number;
  readonly desiredAngle: number;
  readonly bankAngle: number;
  readonly currentShields: number;
  readonly currentArmor: number;
  readonly currentEnergy: number;
  readonly shieldRechargeDelayElapsed: number;
  readonly shieldBubbleAlpha: number;
  readonly controls: ShipControls;
  readonly loadout?: PlayerShip;
  readonly gunCooldowns?: readonly number[];
  readonly gunOrder?: readonly number[];
  readonly thrusterAlpha?: number;
  readonly pulsePhase?: number;
}

export interface ShipDamageResult {
  readonly destroyed: boolean;
  readonly shieldDamage: number;
  readonly armorDamage: number;
}

export class Ship extends SpaceObject {
  readonly id: number;
  readonly type: string;
  readonly definition: ShipDefinition;
  readonly mass: number;
  readonly controls: { thrusting: boolean; reversing: boolean; braking: boolean; firing: boolean };
  desiredAngle: number;
  bankAngle: number;
  previousBankAngle: number;
  currentShields: number;
  currentArmor: number;
  currentEnergy: number;
  shieldRechargeDelayElapsed: number;
  shieldBubbleAlpha: number;
  readonly loadout: PlayerShip | undefined;
  readonly guns: (Weapon | null)[] = [];
  readonly gunOrder: number[] = [];
  thrusterAlpha = 0;
  pulsePhase = 0;
  private readonly thrusterSound: SoundEffect | undefined;
  private readonly reverseSound: SoundEffect | undefined;
  private reverseSoundDecay = 0;
  protected readonly game: Game | undefined;

  constructor(snapshot: ShipSnapshot, game?: Game) {
    super(snapshot);
    this.id = snapshot.id;
    this.type = snapshot.type;
    this.definition = { ...snapshot.definition };
    this.mass = snapshot.definition.mass + snapshot.weaponMass;
    this.desiredAngle = snapshot.desiredAngle;
    this.bankAngle = snapshot.bankAngle;
    this.previousBankAngle = snapshot.bankAngle;
    this.currentShields = snapshot.currentShields;
    this.currentArmor = snapshot.currentArmor;
    this.currentEnergy = snapshot.currentEnergy;
    this.shieldRechargeDelayElapsed = snapshot.shieldRechargeDelayElapsed;
    this.shieldBubbleAlpha = snapshot.shieldBubbleAlpha;
    this.controls = { ...snapshot.controls };
    this.game = game;
    this.loadout = snapshot.loadout;
    this.thrusterAlpha = snapshot.thrusterAlpha ?? 0;
    this.pulsePhase = snapshot.pulsePhase ?? game?.random() ?? 0;
    if (game && this.loadout) {
      const template = requireDefinition(game.content.shipTypes, this.type);
      if (template.thrusterSound) {
        this.thrusterSound = new SoundEffect(`Thruster.${template.thrusterSound}`, true);
        if (this.id === 0) this.reverseSound = new SoundEffect(`Thruster.${template.thrusterSound}.Reverse`, true);
      }
      const bonuses = equipmentBonuses(this.loadout, game.content);
      this.loadout.guns.forEach((name, index) => {
        const hardpoint = template.gunHardpoints[index];
        if (!hardpoint) throw new Error(`Weapon hardpoint mismatch: ${this.type}, hardpoint ${index}`);
        const gun = name === EMPTY_SLOT ? null
          : new Weapon(name, Vector3.from(hardpoint).scale(this.definition.size), this, bonuses, game);
        if (gun) gun.coolDownCounter = snapshot.gunCooldowns?.[index] ?? 0;
        this.guns.push(gun);
        this.gunOrder.push(index);
      });
      if (snapshot.gunOrder) this.gunOrder.splice(0, this.gunOrder.length, ...snapshot.gunOrder);
    }
  }

  static snapshotForLoadout(content: CombatContent, id: number, loadout: PlayerShip): ShipSnapshot {
    const template = requireDefinition(content.shipTypes, loadout.type);
    const bonuses = equipmentBonuses(loadout, content);
    let mass = template.mass;
    let armorRecharge = 0;
    let accumulatedArmorRecharge = 0;
    for (const name of loadout.equipment) {
      if (name === EMPTY_SLOT) continue;
      const item = requireDefinition(content.equipment, name);
      mass += item.mass;
      for (const effect of item.effects) {
        if (effect.stat === 'armorRecharge') {
          accumulatedArmorRecharge += effect.amount;
          armorRecharge += accumulatedArmorRecharge;
        }
      }
    }
    const adjusted = (stat: keyof ShipDefinition, value: number): number => value * (1 + (bonuses[stat] ?? 0));
    const definition: ShipDefinition = {
      shields: adjusted('shields', template.shields),
      shieldRecharge: adjusted('shieldRecharge', template.shieldRecharge),
      shieldRechargeDelay: adjusted('shieldRechargeDelay', template.shieldRechargeDelay),
      armor: adjusted('armor', template.armor),
      armorRecharge,
      maxSpeed: adjusted('maxSpeed', template.maxSpeed),
      thrusterForce: adjusted('thrusterForce', template.thrusterForce),
      brakeForce: adjusted('brakeForce', template.brakeForce),
      turnSpeed: adjusted('turnSpeed', template.turnSpeed),
      size: template.size,
      mass: adjusted('mass', mass),
      energy: adjusted('energy', template.energy),
      energyRecharge: adjusted('energyRecharge', template.energyRecharge),
    };
    const weaponMass = loadout.guns.reduce((sum, name) =>
      sum + (name === EMPTY_SLOT ? 0 : requireDefinition(content.weapons, name).mass), 0);
    const snapshot = Ship.create(id, loadout.type, definition, weaponMass).toSnapshot();
    // Ship._commonInit fills energy before applying equipment bonuses.
    return { ...snapshot, currentEnergy: template.energy, loadout };
  }

  static create(id: number, type: string, definition: ShipDefinition, weaponMass = 0): Ship {
    return new Ship({
      id,
      type,
      definition,
      weaponMass,
      position: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      acceleration: { x: 0, y: 0, z: 0 },
      angle: 0,
      desiredAngle: 0,
      bankAngle: 0,
      currentShields: definition.shields,
      currentArmor: definition.armor,
      currentEnergy: definition.energy,
      shieldRechargeDelayElapsed: 0,
      shieldBubbleAlpha: 0,
      controls: { thrusting: false, reversing: false, braking: false, firing: false },
    });
  }

  override update(): void {
    this.previousBankAngle = this.bankAngle;
    super.update();
    if (this.controls.thrusting || this.thrusterAlpha > 0) this.thrusterSound?.setPosition(this.position);
    if (this.reverseSound?.playing) this.reverseSound.setPosition(this.position);
    this.updateEnergy();
    this.updateShields();
    this.updateGuns();
  }

  damage(shieldAmount: number, armorAmount: number): ShipDamageResult {
    if (this.currentArmor <= 0) return { destroyed: false, shieldDamage: 0, armorDamage: 0 };

    const originalShields = this.currentShields;
    const originalArmor = this.currentArmor;
    this.shieldRechargeDelayElapsed = 0;

    if (this.currentShields > 0) {
      this.currentShields -= shieldAmount;
      if (this.currentShields < 0) {
        const overflowPortion = shieldAmount === 0 ? 0 : -this.currentShields / shieldAmount;
        this.currentArmor -= overflowPortion * armorAmount;
        this.currentShields = 0;
      }
      this.shieldBubbleAlpha = 1;
    } else {
      this.currentArmor -= armorAmount;
    }

    const destroyed = this.currentArmor <= 0;
    if (destroyed) {
      this.currentArmor = 0;
      this.stopSounds();
      this.game?.shipDestroyed(this);
    }
    return {
      destroyed,
      shieldDamage: originalShields - this.currentShields,
      armorDamage: originalArmor - this.currentArmor,
    };
  }

  override toSnapshot(): ShipSnapshot {
    return {
      ...super.toSnapshot(),
      id: this.id,
      type: this.type,
      definition: { ...this.definition },
      weaponMass: this.mass - this.definition.mass,
      desiredAngle: this.desiredAngle,
      bankAngle: this.bankAngle,
      currentShields: this.currentShields,
      currentArmor: this.currentArmor,
      currentEnergy: this.currentEnergy,
      shieldRechargeDelayElapsed: this.shieldRechargeDelayElapsed,
      shieldBubbleAlpha: this.shieldBubbleAlpha,
      controls: { ...this.controls },
      ...(this.loadout ? {
        loadout: this.loadout,
        gunCooldowns: this.guns.map((gun) => gun?.coolDownCounter ?? 0),
        gunOrder: [...this.gunOrder],
        thrusterAlpha: this.thrusterAlpha,
        pulsePhase: this.pulsePhase,
      } : {}),
    };
  }

  protected override updateAngle(): void {
    super.updateAngle();
    const turnAmount = Math.max(
      -this.definition.turnSpeed,
      Math.min(this.definition.turnSpeed, angleDifference(this.angle, this.desiredAngle)),
    );
    this.angle += turnAmount;
    if (this.definition.turnSpeed > 0) {
      this.bankAngle = this.bankAngle * (1 - BANK_FILTER)
        + (-turnAmount / this.definition.turnSpeed) * BANK_FILTER * BANK_MAX;
    }
  }

  protected override updateAcceleration(): void {
    this.acceleration.x = -Math.sin(this.angle * Math.PI / 180);
    this.acceleration.y = Math.cos(this.angle * Math.PI / 180);
    this.acceleration.z = 0;
    const force = this.controls.thrusting
      ? this.definition.thrusterForce
      : this.controls.reversing ? -this.definition.brakeForce : 0;
    this.acceleration.scale(force / this.mass);
    this.thrusterAlpha = this.controls.thrusting ? 1 : Math.max(0, this.thrusterAlpha - 0.1);
    if (this.controls.thrusting && this.currentArmor > 0) {
      this.thrusterSound?.setVolume(this.thrusterAlpha);
      this.thrusterSound?.play();
    } else if (this.thrusterSound?.playing) {
      this.thrusterSound.setVolume(this.thrusterAlpha);
      if (this.thrusterAlpha < 0.05) this.thrusterSound.stop();
    }
    if (this.controls.reversing && !this.controls.thrusting && this.currentArmor > 0) {
      this.reverseSoundDecay = 1;
      this.reverseSound?.setVolume(this.reverseSoundDecay);
      this.reverseSound?.play();
    } else {
      this.reverseSoundDecay = Math.max(0, this.reverseSoundDecay - 0.1);
      if (this.reverseSound?.playing) {
        this.reverseSound.setVolume(this.reverseSoundDecay);
        if (this.reverseSoundDecay < 0.05) this.reverseSound.stop();
      }
    }
  }

  protected override updateVelocity(): void {
    if (this.controls.braking && !this.controls.thrusting) {
      const oldSpeed = this.velocity.length();
      const drag = this.definition.brakeForce / this.mass;
      if (drag > oldSpeed) this.velocity.scale(0);
      else this.velocity.normalize().scale(oldSpeed - drag);
    }
    super.updateVelocity();
    for (const planet of this.game?.planets ?? []) {
      if (planet.gravity <= 0) continue;
      const distanceToPlanet = planet.position.clone().subtract(this.position);
      const distance = distanceToPlanet.length();
      if (distance < planet.size * 5) {
        const gravity = distance < planet.size / 2
          ? planet.gravity / (planet.size / 2) ** 2 * (distance / (planet.size / 2))
          : planet.gravity / distance ** 2;
        this.velocity.add(distanceToPlanet.normalize().scale(gravity));
      }
    }
    this.velocity.limit(this.definition.maxSpeed);
  }

  protected updateEnergy(): void {
    this.currentEnergy = Math.min(
      this.definition.energy,
      this.currentEnergy + this.definition.energyRecharge,
    );
  }

  protected updateShields(): void {
    this.shieldRechargeDelayElapsed += 1;
    for (const nebula of this.game?.nebulas ?? []) {
      const distance = this.position.clone().subtract(nebula.position);
      if (distance.length() >= nebula.size / 2) continue;
      const { drag, energyRegen, armorRegen, shieldRegen } = nebula.template;
      const resistance = this.velocity.clone().normalize()
        .scale(drag * this.velocity.length() ** 2 * this.definition.size ** 1.5 / this.mass);
      this.velocity.subtract(resistance);
      this.currentEnergy = Math.min(this.definition.energy, this.currentEnergy + energyRegen);
      if (this.currentArmor > 0 && (armorRegen > 0 || shieldRegen > 0)) {
        if (this.shieldRechargeDelayElapsed > this.definition.shieldRechargeDelay) {
          this.currentArmor = Math.min(this.definition.armor, this.currentArmor + armorRegen);
          this.currentShields = Math.min(this.definition.shields, this.currentShields + shieldRegen);
        }
      } else {
        this.damage(-shieldRegen, -armorRegen);
      }
    }
    if (this.shieldRechargeDelayElapsed > this.definition.shieldRechargeDelay) {
      this.currentShields = Math.min(
        this.definition.shields,
        this.currentShields + this.definition.shieldRecharge,
      );
      if (this.currentArmor > 0 && (this.definition.armorRecharge ?? 0) > 0) {
        const baseArmorRecharge = this.definition.armor / 200;
        this.currentArmor = Math.min(this.definition.armor,
          this.currentArmor + baseArmorRecharge * this.definition.armorRecharge!);
      }
    }
    this.shieldBubbleAlpha = Math.max(0, this.shieldBubbleAlpha - 1 / SHIELD_VISIBLE_TICKS);
  }

  protected updateGuns(): void {
    if (!this.game || this.currentArmor <= 0) return;
    const recoil = new Vector3();
    let shuffle = false;
    for (const index of this.gunOrder) {
      const gun = this.guns[index];
      if (!gun) continue;
      gun.updateWithShip();
      const inGroup = this !== this.game.ship || this.loadout?.weaponGroups[this.game.weaponGroupId]?.includes(index);
      if (this.controls.firing && inGroup && this.currentEnergy < gun.template.energy) gun.stopFiringSoundAndDecay();
      if (this.controls.firing && inGroup && this.currentEnergy >= gun.template.energy && gun.fire()) {
        recoil.add(recoilVector(gun.template.forceFire, this.mass, this.angle));
        this.currentEnergy -= gun.template.energy;
        shuffle = this.gunOrder.length > 1;
      }
      if (!this.controls.firing || !inGroup) gun.stopFiringSound();
    }
    if (shuffle) this.gunOrder.push(this.gunOrder.shift()!);
    this.velocity.add(recoil);
  }

  stopSounds(): void {
    this.thrusterSound?.stop();
    this.reverseSound?.stop();
    for (const gun of this.guns) gun?.stopSounds();
  }
}

function equipmentBonuses(loadout: PlayerShip, content: CombatContent): Record<string, number> {
  const bonuses: Record<string, number> = {};
  for (const name of loadout.equipment) {
    if (name === EMPTY_SLOT) continue;
    for (const effect of requireDefinition(content.equipment, name).effects) {
      bonuses[effect.stat] = (bonuses[effect.stat] ?? 0) + effect.amount;
    }
  }
  return bonuses;
}

export function recoilVector(force: number, mass: number, angle: number): Vector3 {
  return new Vector3(0, -(force / mass), 0).rotateZ(angle);
}
