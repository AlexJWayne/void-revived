import { requireDefinition, type WeaponTemplate } from './content.ts';
import { angleDifference, Vector3 } from './math.ts';
import type { Ship } from './ship.ts';
import type { Game } from './game.ts';
import { Projectile } from './projectile.ts';
import { Beam } from './beam.ts';
import { SoundEffect } from '../audio/sound-effect.ts';

export class Weapon {
  readonly name: string;
  readonly template: WeaponTemplate;
  readonly hardpointPosition: Vector3;
  readonly ship: Ship;
  readonly game: Game;
  readonly position = new Vector3();
  coolDownCounter = 0;
  readonly soundsFire: readonly SoundEffect[];

  constructor(name: string, hardpointPosition: Vector3, ship: Ship, bonuses: Readonly<Record<string, number>>, game: Game) {
    this.name = name;
    this.hardpointPosition = hardpointPosition;
    this.ship = ship;
    this.game = game;
    const source = requireDefinition(game.content.weapons, name);
    const adjusted = (value: number, stat: string): number => value * (1 + (bonuses[stat] ?? 0));
    this.template = {
      ...source,
      shieldDmg: adjusted(source.shieldDmg, 'shieldDmg'),
      armorDmg: adjusted(source.armorDmg, 'armorDmg'),
      speed: adjusted(source.speed, 'projectileSpeed'),
      coolDown: adjusted(source.coolDown, 'coolDown'),
      spread: adjusted(source.spread, 'spread'),
      seekTurnSpeed: adjusted(source.seekTurnSpeed, 'seekTurnSpeed'),
      beamRange: adjusted(source.beamRange, 'range'),
      lifetime: source.beam ? source.lifetime : adjusted(source.lifetime, 'range'),
    };
    const names = source.fireSoundLoops ? source.soundsFire.slice(0, 1) : source.soundsFire;
    this.soundsFire = names.map((name) => new SoundEffect(`Weapon.${name}`, source.fireSoundLoops));
  }

  updateWithShip(): void {
    if (this.coolDownCounter > 0) this.coolDownCounter -= 1;
    this.position.set(this.ship.position);
  }

  fire(): boolean {
    if (this.coolDownCounter > 0) return false;
    this.coolDownCounter = this.template.coolDown;
    this.position.add(this.hardpointPosition.clone().rotateZ(this.ship.angle));
    const sound = this.template.fireSoundLoops ? this.soundsFire[0]
      : this.soundsFire[Math.floor(Math.random() * this.soundsFire.length)];
    // Audio selection does not consume the simulation's random sequence.
    if (sound) { sound.setPosition(this.position); sound.play(); }
    let adjustedAngle = this.ship.angle;
    if (this.template.targetingArc > 0) {
      let closest = 1000;
      for (const target of this.game.targetsFor(this.ship.id)) {
        const distanceToTarget = this.template.beam
          ? target.position.clone().subtract(this.position)
          : this.ship.velocity.clone().scale(-target.position.distance2D(this.position) / this.template.speed)
            .add(target.position).subtract(this.position);
        const difference = angleDifference(this.ship.angle, distanceToTarget.angle2D());
        if (Math.abs(difference) < this.template.targetingArc / 2 && distanceToTarget.length() < closest) {
          closest = distanceToTarget.length();
          adjustedAngle = distanceToTarget.angle2D();
        }
      }
    }
    adjustedAngle += this.game.random() * this.template.spread - this.template.spread / 2;
    if (this.template.beam) {
      this.game.beams.push(new Beam(this.template, this.ship.id, this.position, this.ship.velocity, adjustedAngle, this.game));
    } else {
      const velocity = new Vector3(0, this.template.speed).rotateZ(adjustedAngle).add(this.ship.velocity);
      const angle = this.template.projectileIsDirectional ? adjustedAngle : Math.floor(this.game.random() * 360);
      this.game.projectiles.push(Projectile.fromWeapon(this.template, this.ship.id, this.position, velocity, angle, this.game));
    }
    return true;
  }

  get range(): number {
    const { beam, beamRange, lifetime, speed, accel } = this.template;
    return beam ? beamRange : lifetime * speed + accel * lifetime * lifetime / 2;
  }

  stopFiringSound(): void {
    if (this.template.fireSoundLoops) this.soundsFire[0]?.stop();
  }

  stopFiringSoundAndDecay(): void {
    if (this.template.fireSoundLoops) this.soundsFire[0]?.stopAndDecay();
  }

  stopSounds(): void { for (const sound of this.soundsFire) sound.stop(); }
}
