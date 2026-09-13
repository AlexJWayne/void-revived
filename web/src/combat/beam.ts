import type { WeaponTemplate } from './content.ts';
import type { Game } from './game.ts';
import { Vector3, type Vector3Value } from './math.ts';
import { SpaceObject, type SpaceObjectSnapshot } from './space-object.ts';

export interface BeamSnapshot extends SpaceObjectSnapshot {
  readonly template: WeaponTemplate;
  readonly ownerId: number;
  readonly length: number;
  readonly age: number;
  readonly expired: boolean;
}

export class Beam extends SpaceObject {
  readonly template: WeaponTemplate;
  readonly ownerId: number;
  length: number;
  age = 0;
  expired = false;

  constructor(template: WeaponTemplate, ownerId: number, position: Vector3Value, velocity: Vector3Value,
    angle: number, game?: Game) {
    super();
    this.template = template;
    this.ownerId = ownerId;
    this.length = template.beamRange;
    this.position.set(position);
    this.velocity.set(velocity);
    this.angle = angle;
    this.previousPosition.set(position);
    this.previousAngle = angle;
    if (game) this.checkCollision(game);
  }

  private checkCollision(game: Game): void {
    let nearestDistance = 1000;
    let nearestTarget;
    for (const target of game.targetsFor(this.ownerId)) {
      const distance = this.position.distance2D(target.position);
      if (target.currentArmor <= 0 || distance >= target.definition.size + this.length) continue;
      const circleCenter = target.position.clone().subtract(this.position).rotateZ(-this.angle);
      const nearestPoint = new Vector3(
        Math.max(-this.template.projectileCollisionSize / 2, Math.min(this.template.projectileCollisionSize / 2, circleCenter.x)),
        Math.max(0, Math.min(this.length, circleCenter.y)),
      );
      if (circleCenter.distance2D(nearestPoint) < target.definition.size && distance - target.definition.size < nearestDistance) {
        nearestDistance = distance - target.definition.size;
        nearestTarget = target;
      }
    }
    if (!nearestTarget) return;
    nearestTarget.damage(this.template.shieldDmg, this.template.armorDmg);
    this.length = this.position.distance2D(nearestTarget.position) - nearestTarget.definition.size / 2;
    // Beam.m applies forceHit both to the direction and to the mass scaling.
    const knockback = new Vector3(0, this.template.forceHit).rotateZ(this.angle)
      .scale(this.template.forceHit / nearestTarget.mass);
    nearestTarget.velocity.add(knockback);
    const endPoint = new Vector3(0, this.length).rotateZ(this.angle).add(this.position);
    game.addExplosion(endPoint, null, this.template.projectileSize / 2, 'Hit.png', 4, 15);
  }

  override update(): void {
    super.update();
    if (this.age >= Math.trunc(this.template.lifetime)) this.expired = true;
    this.age += 1;
  }

  override toSnapshot(): BeamSnapshot {
    return { ...super.toSnapshot(), template: this.template, ownerId: this.ownerId,
      length: this.length, age: this.age, expired: this.expired };
  }
}
