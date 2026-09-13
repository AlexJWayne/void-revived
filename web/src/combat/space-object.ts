import { Vector3, type Vector3Value } from './math.ts';

export const STAGE_RADIUS = 80;
export const STAGE_EDGE = 79.95;

export interface SpaceObjectSnapshot {
  readonly position: Vector3Value;
  readonly velocity: Vector3Value;
  readonly acceleration: Vector3Value;
  readonly angle: number;
}

export class SpaceObject {
  readonly position: Vector3;
  readonly previousPosition: Vector3;
  readonly velocity: Vector3;
  readonly acceleration: Vector3;
  angle: number;
  previousAngle: number;

  constructor(snapshot: SpaceObjectSnapshot = EMPTY_SPACE_OBJECT) {
    this.position = Vector3.from(snapshot.position);
    this.previousPosition = Vector3.from(snapshot.position);
    this.velocity = Vector3.from(snapshot.velocity);
    this.acceleration = Vector3.from(snapshot.acceleration);
    this.angle = snapshot.angle;
    this.previousAngle = snapshot.angle;
  }

  update(): void {
    this.previousPosition.set(this.position);
    this.previousAngle = this.angle;
    this.updateAngle();
    this.updateAcceleration();
    this.updateVelocity();
    this.updatePosition();
  }

  protected updateAngle(): void {
    this.angle = normalizeOriginalAngle(this.angle);
  }

  protected updateAcceleration(): void {}

  protected updateVelocity(): void {
    this.velocity.add(this.acceleration);
  }

  protected updatePosition(): void {
    this.position.add(this.velocity);
    reflectAtStageEdge(this.position, this.velocity);
  }

  toSnapshot(): SpaceObjectSnapshot {
    return {
      position: this.position.toJSON(),
      velocity: this.velocity.toJSON(),
      acceleration: this.acceleration.toJSON(),
      angle: this.angle,
    };
  }
}

const EMPTY_SPACE_OBJECT: SpaceObjectSnapshot = {
  position: { x: 0, y: 0, z: 0 },
  velocity: { x: 0, y: 0, z: 0 },
  acceleration: { x: 0, y: 0, z: 0 },
  angle: 0,
};

function normalizeOriginalAngle(angle: number): number {
  let normalized = angle;
  while (normalized < 0) normalized += 360;
  while (normalized > 360) normalized -= 360;
  return normalized;
}

function reflectAtStageEdge(position: Vector3, velocity: Vector3): void {
  if (position.length() <= STAGE_RADIUS) return;

  position.normalize().scale(STAGE_EDGE);
  const positionAngle = position.angle2D();
  velocity.rotateZ(-positionAngle);
  if (velocity.y > 0) velocity.y *= -1;
  velocity.rotateZ(positionAngle);
}
