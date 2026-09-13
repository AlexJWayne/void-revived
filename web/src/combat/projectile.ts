import { angleDifference, Vector3, type Vector3Value } from './math.ts';
import { SpaceObject, type SpaceObjectSnapshot } from './space-object.ts';
import type { WeaponTemplate } from './content.ts';
import type { Game } from './game.ts';

export interface ProjectileDefinition {
  readonly lifetime: number;
  readonly shieldDamage: number;
  readonly armorDamage: number;
  readonly hitForce: number;
  readonly size: number;
  readonly collisionSize: number;
  readonly explosionSize: number;
  readonly seekLockAngle: number;
  readonly seekTurnSpeed: number;
}

export interface ProjectileSnapshot extends SpaceObjectSnapshot {
  readonly id: number;
  readonly ownerId: number;
  readonly definition: ProjectileDefinition;
  readonly potentialTargetIds: readonly number[];
  readonly seekTargetId: number | null;
  readonly age: number;
  readonly expired: boolean;
  readonly template?: WeaponTemplate;
  readonly hitSprite?: string;
}

export interface ProjectileTarget {
  readonly id: number;
  readonly position: Vector3Value;
  readonly currentArmor: number;
}

export class Projectile extends SpaceObject {
  readonly id: number;
  readonly ownerId: number;
  readonly definition: ProjectileDefinition;
  readonly potentialTargetIds: readonly number[];
  seekTargetId: number | null;
  age: number;
  expired: boolean;
  readonly template: WeaponTemplate | undefined;
  readonly game: Game | undefined;
  readonly hitSprite: string | undefined;

  constructor(snapshot: ProjectileSnapshot, game?: Game) {
    super(snapshot);
    this.id = snapshot.id;
    this.ownerId = snapshot.ownerId;
    this.definition = { ...snapshot.definition };
    this.potentialTargetIds = [...snapshot.potentialTargetIds];
    this.seekTargetId = snapshot.seekTargetId;
    this.age = snapshot.age;
    this.expired = snapshot.expired;
    this.template = snapshot.template;
    this.game = game;
    this.hitSprite = snapshot.hitSprite;
  }

  static fromWeapon(template: WeaponTemplate, ownerId: number, position: Vector3, velocity: Vector3,
    angle: number, game: Game): Projectile {
    const acceleration = new Vector3(0, template.accel ?? 0).rotateZ(angle);
    const lifetime = Math.trunc(template.lifetime);
    const potentialDistance = velocity.length() * lifetime + game.ship.velocity.length() * lifetime
      + acceleration.length() * lifetime * lifetime + template.projectileCollisionSize;
    const targets = game.targetsFor(ownerId).filter((target) => ownerId !== game.ship.id
      || target.position.distance2D(position) < potentialDistance + target.definition.maxSpeed * lifetime + target.definition.size);
    const projectile = new Projectile({
      id: game.nextIdentifier++, ownerId, template,
      position: position.toJSON(), velocity: velocity.toJSON(), acceleration: acceleration.toJSON(), angle,
      definition: {
        lifetime, shieldDamage: template.shieldDmg, armorDamage: template.armorDmg,
        hitForce: template.forceHit, size: template.projectileSize,
        collisionSize: template.projectileCollisionSize, explosionSize: template.explosionSize,
        seekLockAngle: template.seekLockAngle, seekTurnSpeed: template.seekTurnSpeed,
      },
      potentialTargetIds: targets.map((target) => target.id), seekTargetId: null, age: 0, expired: false,
    }, game);
    projectile.findSeekTarget(new Map(targets.map((target) => [target.id, target])));
    return projectile;
  }

  updateWithTargets(targets: ReadonlyMap<number, ProjectileTarget>): void {
    if (this.expired) return;
    this.age += 1;
    if (this.age >= this.definition.lifetime) {
      this.expired = true;
      if (this.definition.explosionSize > 0) this.explode();
      return;
    }

    this.refreshSeekTarget(targets);
    super.update();
    const target = this.seekTargetId === null ? undefined : targets.get(this.seekTargetId);
    if (!target) return;

    const distance = Vector3.from(target.position).subtract(this.position);
    const difference = angleDifference(distance.angle2D(), this.velocity.angle2D());
    const turn = Math.max(
      -this.definition.seekTurnSpeed,
      Math.min(this.definition.seekTurnSpeed, difference),
    );
    this.angle -= turn;
    this.velocity.rotateZ(-turn);
    this.acceleration.rotateZ(-turn);
    if (this.acceleration.length() > 0) this.velocity.scale(0.98);
  }

  findSeekTarget(targets: ReadonlyMap<number, ProjectileTarget>): void {
    if (this.definition.seekLockAngle <= 0) return;
    let priority = 1000;
    let targetId: number | null = null;

    for (const id of this.potentialTargetIds) {
      const target = targets.get(id);
      if (!target || target.currentArmor <= 0) continue;
      const distance = Vector3.from(target.position).subtract(this.position);
      const difference = angleDifference(this.velocity.angle2D(), distance.angle2D());
      const candidatePriority = distance.length() * (1 + Math.abs(difference) / 180) ** 4;
      if (Math.abs(difference) <= this.definition.seekLockAngle / 2 && candidatePriority < priority) {
        priority = candidatePriority;
        targetId = id;
      }
    }
    this.seekTargetId = targetId;
  }

  override toSnapshot(): ProjectileSnapshot {
    return {
      ...super.toSnapshot(),
      id: this.id,
      ownerId: this.ownerId,
      definition: { ...this.definition },
      potentialTargetIds: [...this.potentialTargetIds],
      seekTargetId: this.seekTargetId,
      age: this.age,
      expired: this.expired,
      ...(this.template ? { template: this.template } : {}),
      ...(this.hitSprite ? { hitSprite: this.hitSprite } : {}),
    };
  }

  private refreshSeekTarget(targets: ReadonlyMap<number, ProjectileTarget>): void {
    if (this.seekTargetId === null) {
      return;
    }
    if ((targets.get(this.seekTargetId)?.currentArmor ?? 0) <= 0) {
      this.seekTargetId = null;
      this.findSeekTarget(targets);
    }
  }

  explode(): void {
    if (!this.game) return;
    const { explosionSize, shieldDamage, armorDamage, hitForce } = this.definition;
    for (const ship of this.game.targets) {
      if (ship.id === this.ownerId || ship.position.distance2D(this.position) >= explosionSize + ship.definition.size) continue;
      ship.damage(shieldDamage, armorDamage);
      const knockback = ship.position.clone().subtract(this.position);
      knockback.z = 0;
      const portion = 1 - knockback.length() / (explosionSize + ship.definition.size);
      ship.velocity.add(knockback.normalize().scale(hitForce * portion));
    }
    const image = this.hitSprite ?? this.template?.hitSprite ?? 'Explosion.png';
    this.game.addExplosion(this.position, null, explosionSize * 1.5, image, 16, 60);
  }
}
