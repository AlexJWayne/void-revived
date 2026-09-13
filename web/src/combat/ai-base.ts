import { Vector3 } from './math.ts';
import type { Enemy } from './enemy.ts';
import type { Ship } from './ship.ts';
import type { Weapon } from './weapon.ts';

export interface AISnapshot {
  readonly noticedPlayer: boolean;
  readonly tendency: number;
  readonly zBobPhase: number;
}

export class AIBase {
  readonly ship: Enemy;
  readonly player: Ship;
  readonly distanceToPlayer = new Vector3();
  readonly keyWeapon: Weapon | null;
  noticedPlayer = false;
  tendency: number;
  zBob = false;
  zBobPhase: number;

  constructor(ship: Enemy, player: Ship, random: () => number) {
    this.ship = ship;
    this.player = player;
    this.tendency = random() * 2 - 1;
    this.zBobPhase = Math.floor(random() * 360);
    this.keyWeapon = ship.guns[0] ?? null;
  }

  update(): void {
    if (this.zBob) {
      this.zBobPhase += 1.5;
      this.ship.position.z = 0.65 * Math.sin(this.zBobPhase * Math.PI / 180);
    }
    this.distanceToPlayer.set(this.player.position).subtract(this.ship.position);
    this.distanceToPlayer.z = 0;
  }

  tookDamage(): void {}

  toSnapshot(): AISnapshot {
    return { noticedPlayer: this.noticedPlayer, tendency: this.tendency, zBobPhase: this.zBobPhase };
  }
}
