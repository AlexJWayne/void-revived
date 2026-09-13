import { SpaceObject } from './space-object.ts';
import type { Vector3Value } from './math.ts';

/** The point particles shared by Hypergate and Explosion in Particle.mm. */
export class Particle extends SpaceObject {
  lifetime = 0;
  lifetimeElapsed = 0;
  size = 0;
  damping = 1;
  color: [number, number, number] = [1, 1, 1];

  constructor(position: Vector3Value, lifetime: number, maxSpeed: number, random: () => number) {
    super();
    this.reset(position, lifetime, maxSpeed, random);
  }

  reset(position: Vector3Value, lifetime: number, maxSpeed: number, random: () => number): void {
    this.position.set(position);
    this.lifetime = Math.floor(lifetime - random() * lifetime * 0.6);
    this.lifetimeElapsed = 0;
    this.size = Math.floor(random() * 4) + 1.5;
    this.damping = random() * 0.06 + 0.94;
    this.color = [random() * 0.3 + 0.7, random() * 0.4 + 0.6, random() * 0.6 + 0.4];
    this.velocity.z = random() * maxSpeed;
    this.velocity.rotateY(random() * 360).rotateZ(random() * 360);
  }

  override update(): void {
    super.update();
    this.lifetimeElapsed += 1;
  }

  protected override updateVelocity(): void {
    this.velocity.scale(this.damping);
    super.updateVelocity();
  }

  get alpha(): number {
    return Math.max(0, 1 - this.lifetimeElapsed / this.lifetime) * 0.75;
  }
}
