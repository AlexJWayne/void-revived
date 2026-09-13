import type { PickupType } from './content.ts';
import type { Game } from './game.ts';
import { SpaceObject, type SpaceObjectSnapshot } from './space-object.ts';

export interface PickupSnapshot extends SpaceObjectSnapshot {
  readonly type: PickupType;
  readonly itemName: string | null;
  readonly size: number;
  readonly creditValue: number;
  readonly pickedUp: boolean;
  readonly animationCounter: number;
}

export class Pickup extends SpaceObject {
  readonly type: PickupType;
  readonly itemName: string | null;
  size = 1.5;
  creditValue = 0;
  pickedUp = false;
  animationCounter = 0;

  constructor(type: PickupType, itemName: string | null, game: Game) {
    super();
    this.type = type;
    this.itemName = itemName;
    this.angle = Math.floor(game.random() * 360);
    this.velocity.x = (game.random() * 2 - 1) * 0.1;
    this.velocity.rotateZ(Math.floor(game.random() * 360));
    if (type === 'Money') {
      this.creditValue = Math.floor(game.random() * 10) + 1;
      this.size *= this.creditValue / 15 + 0.5;
      const creditScalar = [0.5, 1, 1.25, 2, 4, 8][game.stage.tier] ?? 0;
      this.creditValue = Math.ceil(this.creditValue * creditScalar);
    } else {
      this.size *= 2;
      const item = itemName ? game.content.equipment[itemName] : undefined;
      if (item && 'type' in item && item.type === 'Trophy') this.size *= 2;
    }
  }

  updateWithGame(game: Game): void {
    this.angle += 2;
    if (!this.pickedUp && this.position.distance2D(game.ship.position) < game.ship.definition.size + this.size) {
      this.pickedUp = true;
      if (this.type === 'Money') game.addCredits(this.creditValue);
      else if (this.itemName) game.pickupItem(this.itemName, this.type);
    } else if (this.pickedUp) {
      const distanceToShip = this.position.clone().subtract(game.ship.position).limit(0.1);
      this.position.subtract(distanceToShip);
      this.animationCounter += 1;
    } else {
      super.update();
    }
  }

  protected override updateVelocity(): void {
    super.updateVelocity();
    this.velocity.scale(0.965);
  }

  get expired(): boolean { return this.animationCounter >= 10; }

  override toSnapshot(): PickupSnapshot {
    return { ...super.toSnapshot(), type: this.type, itemName: this.itemName, size: this.size,
      creditValue: this.creditValue, pickedUp: this.pickedUp, animationCounter: this.animationCounter };
  }
}
