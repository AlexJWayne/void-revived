import { Particle } from './particle.ts';
import { SpaceObject, type SpaceObjectSnapshot } from './space-object.ts';
import type { Vector3Value } from './math.ts';
import { SoundEffect } from '../audio/sound-effect.ts';

export interface ExplosionSnapshot extends SpaceObjectSnapshot {
  readonly size: number;
  readonly imageName: string;
  readonly animationFrames: number;
  readonly lifetime: number;
  readonly age: number;
}

export class Explosion extends SpaceObject {
  readonly size: number;
  readonly imageName: string;
  readonly animationFrames: number;
  readonly lifetime: number;
  readonly particles: Particle[] = [];
  age = 0;

  constructor(position: Vector3Value, velocity: Vector3Value | null, size: number,
    imageName: string, animationFrames: number, duration: number, random: () => number) {
    super();
    this.position.set(position);
    if (velocity) this.velocity.set(velocity);
    this.size = size;
    this.imageName = imageName;
    this.animationFrames = animationFrames;
    this.lifetime = duration;
    this.angle = Math.floor(random() * 360);
    this.previousPosition.set(position);
    this.previousAngle = this.angle;

    if (size >= 1) {
      for (let i = 0; i < Math.round(size * 15); i += 1) {
        const particle = new Particle(position, duration, size / 7, random);
        if (velocity) particle.velocity.add(velocity);
        this.particles.push(particle);
      }
    }
  }

  override update(): void {
    super.update();
    this.age += 1;
    for (const particle of this.particles) particle.update();
  }

  get expired(): boolean { return this.age >= this.lifetime; }

  playSound(name: string): void {
    const sound = SoundEffect.effectNamed(name);
    sound.setPosition(this.position);
    sound.play();
  }

  override toSnapshot(): ExplosionSnapshot {
    return { ...super.toSnapshot(), size: this.size, imageName: this.imageName,
      animationFrames: this.animationFrames, lifetime: this.lifetime, age: this.age };
  }
}
