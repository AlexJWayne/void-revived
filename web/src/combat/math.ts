export interface Vector3Value {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export class Vector3 implements Vector3Value {
  x: number;
  y: number;
  z: number;

  constructor(
    x = 0,
    y = 0,
    z = 0,
  ) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  static from(value: Vector3Value): Vector3 {
    return new Vector3(value.x, value.y, value.z);
  }

  clone(): Vector3 {
    return Vector3.from(this);
  }

  set(value: Vector3Value): this {
    this.x = value.x;
    this.y = value.y;
    this.z = value.z;
    return this;
  }

  add(value: Vector3Value): this {
    this.x += value.x;
    this.y += value.y;
    this.z += value.z;
    return this;
  }

  subtract(value: Vector3Value): this {
    this.x -= value.x;
    this.y -= value.y;
    this.z -= value.z;
    return this;
  }

  scale(factor: number): this {
    this.x *= factor;
    this.y *= factor;
    this.z *= factor;
    return this;
  }

  length(): number {
    return Math.hypot(this.x, this.y, this.z);
  }

  normalize(): this {
    const length = this.length();
    return this.scale(length === 0 ? 0 : 1 / length);
  }

  limit(maxLength: number): this {
    if (this.length() > maxLength) this.normalize().scale(maxLength);
    return this;
  }

  rotateZ(angleDegrees: number): this {
    const angle = radians(angleDegrees);
    const originalX = this.x;
    const originalY = this.y;
    this.x = Math.cos(angle) * originalX - Math.sin(angle) * originalY;
    this.y = Math.cos(angle) * originalY + Math.sin(angle) * originalX;
    return this;
  }

  rotateY(angleDegrees: number): this {
    const angle = radians(angleDegrees);
    const originalX = this.x;
    const originalZ = this.z;
    this.x = Math.cos(angle) * originalX - Math.sin(angle) * originalZ;
    this.z = Math.cos(angle) * originalZ + Math.sin(angle) * originalX;
    return this;
  }

  distance2D(value: Vector3Value): number {
    return Math.hypot(this.x - value.x, this.y - value.y);
  }

  dot(value: Vector3Value): number {
    return this.x * value.x + this.y * value.y + this.z * value.z;
  }

  angle2D(): number {
    return Math.atan2(this.y, this.x) * 180 / Math.PI - 90;
  }

  toJSON(): Vector3Value {
    return {
      x: this.x === 0 ? 0 : this.x,
      y: this.y === 0 ? 0 : this.y,
      z: this.z === 0 ? 0 : this.z,
    };
  }
}

export function radians(degrees: number): number {
  return degrees * Math.PI / 180;
}

export function wrapAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

export function angleDifference(from: number, to: number): number {
  return ((to - from + 540) % 360 + 360) % 360 - 180;
}

export function segmentDistance2D(start: Vector3Value, end: Vector3Value, point: Vector3Value): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const squareLength = dx * dx + dy * dy;
  const projection = squareLength === 0
    ? 0
    : Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / squareLength));
  return Math.hypot(start.x + projection * dx - point.x, start.y + projection * dy - point.y);
}
