import { Particle } from './particle.ts';
import { SpaceObject } from './space-object.ts';
import type { Vector3Value } from './math.ts';

export class Hypergate extends SpaceObject {
  angle2 = 0;
  previousAngle2 = 0;
  birthProgress = 0;
  readonly particles: Particle[];
  readonly random: () => number;

  constructor(position: Vector3Value, random: () => number) {
    super();
    this.position.set(position);
    this.random = random;
    this.particles = Array.from({ length: 100 }, () => new Particle(position, 60, 0.3, random));
  }

  updateWithCompletion(canBeCompleted: boolean): void {
    this.previousAngle = this.angle;
    this.previousAngle2 = this.angle2;
    this.angle -= 0.75;
    this.angle2 += 2;
    if (this.birthProgress <= 3) this.birthProgress += 1;
    for (const particle of this.particles) {
      particle.update();
      if (particle.lifetimeElapsed > particle.lifetime) {
        particle.reset(this.position, 60, canBeCompleted ? 0.25 : 0.15, this.random);
      }
    }
  }

  layerSizes(canBeCompleted: boolean): [number, number] {
    if (this.birthProgress >= 3) return [6, canBeCompleted ? 6 : 3];
    const progress = this.birthProgress / 3;
    const size1 = 6 * (1 - (progress - 1) ** 2);
    const size2 = progress < 0.5
      ? 9 * (1 - (2 * progress - 1) ** 2)
      : 6 * (1 - Math.sin(2 * Math.PI * progress + Math.PI / 2) / 2);
    return [size1, size2];
  }
}
