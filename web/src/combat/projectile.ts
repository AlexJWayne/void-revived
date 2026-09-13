import { angleDifference, Vector3, type Vector3Value } from './math.ts';
import { SpaceObject, type SpaceObjectSnapshot } from './space-object.ts';

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

  constructor(snapshot: ProjectileSnapshot) {
    super(snapshot);
    this.id = snapshot.id;
    this.ownerId = snapshot.ownerId;
    this.definition = { ...snapshot.definition };
    this.potentialTargetIds = [...snapshot.potentialTargetIds];
    this.seekTargetId = snapshot.seekTargetId;
    this.age = snapshot.age;
    this.expired = snapshot.expired;
  }

  updateWithTargets(targets: ReadonlyMap<number, ProjectileTarget>): void {
    if (this.expired) return;
    this.age += 1;
    if (this.age >= this.definition.lifetime) {
      this.expired = true;
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
    let priority = Number.POSITIVE_INFINITY;
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
    };
  }

  private refreshSeekTarget(targets: ReadonlyMap<number, ProjectileTarget>): void {
    if (this.seekTargetId === null) {
      this.findSeekTarget(targets);
      return;
    }
    if ((targets.get(this.seekTargetId)?.currentArmor ?? 0) <= 0) {
      this.seekTargetId = null;
      this.findSeekTarget(targets);
    }
  }
}
