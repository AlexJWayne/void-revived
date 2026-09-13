import { AIBase } from './ai-base.ts';
import { angleDifference } from './math.ts';

export class AIWarship extends AIBase {
  override update(): void {
    super.update();
    if (!this.noticedPlayer) {
      if (this.distanceToPlayer.length() < 14 + 3 * this.tendency) this.noticedPlayer = true;
      return;
    }
    const { ship } = this;
    const difference = angleDifference(ship.angle, this.distanceToPlayer.angle2D());
    ship.desiredAngle = this.distanceToPlayer.angle2D();
    if (this.distanceToPlayer.length() < (this.keyWeapon?.range ?? 0)) {
      ship.controls.firing = Math.abs(difference) < 15 + 5 * this.tendency;
      ship.controls.thrusting = false;
      ship.controls.braking = true;
    } else {
      ship.controls.firing = false;
      const movingToward = Math.abs(angleDifference(ship.velocity.angle2D(), this.distanceToPlayer.angle2D())) < 20 + 10 * this.tendency;
      const pointedToward = Math.abs(difference) < 15 + 10 * this.tendency;
      const stopped = ship.velocity.length() < 0.05 + 0.04 * this.tendency;
      ship.controls.thrusting = pointedToward && (movingToward || stopped);
      ship.controls.braking = !ship.controls.thrusting;
    }
  }

  override tookDamage(): void { this.noticedPlayer = true; }
}
