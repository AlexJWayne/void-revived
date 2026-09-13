import { AIBase } from './ai-base.ts';

export class AIStationary extends AIBase {
  override update(): void {
    super.update();
    this.ship.desiredAngle = this.distanceToPlayer.angle2D();
    this.noticedPlayer = true;
    this.ship.controls.braking = true;
    if (this.keyWeapon) this.ship.controls.firing = this.distanceToPlayer.length() < this.keyWeapon.range;
  }
}
