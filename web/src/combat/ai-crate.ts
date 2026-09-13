import { AIBase } from './ai-base.ts';

export class AICrate extends AIBase {
  override zBob = true;

  override update(): void {
    super.update();
    this.ship.desiredAngle = this.ship.angle + this.ship.definition.turnSpeed / 100;
  }

  override tookDamage(): void { this.ship.controls.braking = true; }
}
