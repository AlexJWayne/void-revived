import { angleDifference, Vector3 } from './math.ts';
import { SpaceObject, type SpaceObjectSnapshot } from './space-object.ts';

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
  currentShields: number;
  currentArmor: number;
  currentEnergy: number;
  shieldRechargeDelayElapsed: number;
  shieldBubbleAlpha: number;

  constructor(snapshot: ShipSnapshot) {
    super(snapshot);
    this.id = snapshot.id;
    this.type = snapshot.type;
    this.definition = { ...snapshot.definition };
    this.mass = snapshot.definition.mass + snapshot.weaponMass;
    this.desiredAngle = snapshot.desiredAngle;
    this.bankAngle = snapshot.bankAngle;
    this.currentShields = snapshot.currentShields;
    this.currentArmor = snapshot.currentArmor;
    this.currentEnergy = snapshot.currentEnergy;
    this.shieldRechargeDelayElapsed = snapshot.shieldRechargeDelayElapsed;
    this.shieldBubbleAlpha = snapshot.shieldBubbleAlpha;
    this.controls = { ...snapshot.controls };
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
    super.update();
    this.updateEnergy();
    this.updateShields();
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
    if (destroyed) this.currentArmor = 0;
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
  }

  protected override updateVelocity(): void {
    if (this.controls.braking && !this.controls.thrusting) {
      const oldSpeed = this.velocity.length();
      const drag = this.definition.brakeForce / this.mass;
      if (drag > oldSpeed) this.velocity.scale(0);
      else this.velocity.normalize().scale(oldSpeed - drag);
    }
    super.updateVelocity();
    this.velocity.limit(this.definition.maxSpeed);
  }

  private updateEnergy(): void {
    this.currentEnergy = Math.min(
      this.definition.energy,
      this.currentEnergy + this.definition.energyRecharge,
    );
  }

  private updateShields(): void {
    this.shieldRechargeDelayElapsed += 1;
    if (this.shieldRechargeDelayElapsed > this.definition.shieldRechargeDelay) {
      this.currentShields = Math.min(
        this.definition.shields,
        this.currentShields + this.definition.shieldRecharge,
      );
    }
    this.shieldBubbleAlpha = Math.max(0, this.shieldBubbleAlpha - 1 / SHIELD_VISIBLE_TICKS);
  }
}

export function recoilVector(force: number, mass: number, angle: number): Vector3 {
  return new Vector3(0, -(force / mass), 0).rotateZ(angle);
}
