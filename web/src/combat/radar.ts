import { Button } from './button.ts';
import type { Game } from './game.ts';
import { Vector3, type Vector3Value } from './math.ts';
import type { Color, Renderer } from '../graphics/renderer.ts';

export class Radar extends Button {
  readonly game: Game;
  readonly shipPosition = new Vector3();

  constructor(game: Game) {
    super([0, 0, 81, 81], [0, 50, 81, 81]);
    this.game = game;
  }

  update(): void { this.shipPosition.set(this.game.ship.position); }

  override render(renderer: Renderer): void {
    super.render(renderer);
    const points: number[] = [];
    const addBlip = (position: Vector3Value, size: number, color: Color): void => {
      const offset = Vector3.from(position).subtract(this.shipPosition).scale(0.5).limit(32).rotateZ(-this.game.angle);
      points.push(40.5 + offset.x, 40.5 - offset.y, 0, ...color, size);
    };
    for (const planet of this.game.planets) addBlip(planet.position, planet.size / (planet.gravity > 0 ? 2 : 4), [64 / 255, 64 / 255, 64 / 255, 1]);
    for (const pickup of this.game.pickups) {
      const color: Color = pickup.type === 'Money' ? [0, 192 / 255, 0, 1]
        : pickup.type === 'Weapon' ? [192 / 255, 96 / 255, 0, 1] : [192 / 255, 192 / 255, 0, 1];
      addBlip(pickup.position, 1, color);
    }
    for (const enemy of this.game.enemies) addBlip(enemy.position, 2, enemy.optional
      ? [192 / 255, 192 / 255, 96 / 255, 1] : [1, 0, 0, 1]);
    const gateBrightness = this.game.canBeCompleted ? 1 : 127 / 255;
    addBlip(this.game.hypergate.position, 3, [gateBrightness, 0, gateBrightness, 1]);
    renderer.drawPoints(points);
  }
}
