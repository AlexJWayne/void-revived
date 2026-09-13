import { AIBase } from './ai-base.ts';
import { angleDifference } from './math.ts';

export class AIFighter extends AIBase {
  override update(): void {
    super.update();
    if (this.noticedPlayer) this.updateWithAggro();
    else this.updateWithoutAggro();
  }

  private updateWithAggro(): void {
    const distance = this.distanceToPlayer.length();
    if (distance > 25 + 5 * this.tendency) {
      this.noticedPlayer = false;
      return;
    }
    const { ship } = this;
    const difference = angleDifference(ship.angle, this.distanceToPlayer.angle2D());
    ship.desiredAngle = this.distanceToPlayer.angle2D();
    if (distance < (this.keyWeapon?.range ?? 0)) {
      ship.controls.firing = Math.abs(difference) < 20;
      ship.controls.thrusting = false;
      ship.controls.braking = false;
    } else {
      ship.controls.firing = false;
      const movingToward = Math.abs(angleDifference(ship.velocity.angle2D(), this.distanceToPlayer.angle2D())) < 20 + 10 * this.tendency;
      const pointedToward = Math.abs(difference) < 15 + 10 * this.tendency;
      const stopped = ship.velocity.length() < 0.05 + 0.04 * this.tendency;
      ship.controls.thrusting = pointedToward && (movingToward || stopped);
      ship.controls.braking = !ship.controls.thrusting;
    }
  }

  private updateWithoutAggro(): void {
    this.ship.controls.braking = true;
    if (this.distanceToPlayer.length() < 14 + 2 * this.tendency) this.noticedPlayer = true;
  }

  override tookDamage(): void { this.noticedPlayer = true; }
}
