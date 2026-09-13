import { Button } from './button.ts';
import { Gauge } from './gauge.ts';
import { Radar } from './radar.ts';
import type { Game } from './game.ts';
import { Matrix4 } from '../graphics/matrix.ts';
import type { Renderer } from '../graphics/renderer.ts';

/** Atlas rectangles and draw order from FlightUI.m; coordinates are 480 × 320. */
export class FlightUI {
  readonly game: Game;
  readonly thrustButton = new Button([0, 208, 112, 112], [0, 144, 112, 112]);
  readonly fireButton = new Button([422, 146, 58, 174], [198, 82, 58, 174]);
  readonly pauseButton = new Button([381, 21, 20, 20], [0, 0, 20, 20]);
  readonly thrustFeedback = new Button([-36, 172, 128, 128], [41, 0, 50, 50]);
  readonly reverseFeedback = new Button([-36, 228, 128, 128], [41, 0, 50, 50]);
  readonly brakeFeedback = new Button([20, 228, 128, 128], [41, 0, 50, 50]);
  readonly fireFeedback = [116, 172, 228].map((y) => new Button([388, y, 128, 128], [41, 0, 50, 50]));
  readonly creditIcon = new Button([62, 4, 16, 16], [20, 0, 16, 16]);
  readonly gaugeBackground = new Button([431, 4, 43, 126], [112, 98, 43, 126]);
  readonly gaugeArmorBackground = new Button([454, 10, 14, 93], [157, 98, 14, 93]);
  readonly energyGauge = new Gauge([435, 12, 10, 90], [147, 0, 10, 90]);
  readonly armorGauge = new Gauge([456, 12, 10, 90], [157, 0, 10, 90]);
  readonly shieldsGauge = new Gauge([452, 8, 18, 98], [167, 0, 18, 98]);
  readonly stageClearButton = new Button([112, 288, 256, 32], [0, 0, 256, 256], 'StageClear.png');
  readonly radar: Radar;

  constructor(game: Game) { this.game = game; this.radar = new Radar(game); }

  update(): void {
    this.radar.update();
    const ship = this.game.ship;
    this.energyGauge.value = ship.definition.energy > 0 ? ship.currentEnergy / ship.definition.energy : 0;
    this.shieldsGauge.value = ship.definition.shields > 0 ? ship.currentShields / ship.definition.shields : 0;
    this.armorGauge.value = ship.currentArmor / ship.definition.armor;
  }

  render(renderer: Renderer): void {
    renderer.projection = Matrix4.orthographic(0, 480, 320, 0);
    this.thrustButton.render(renderer);
    this.fireButton.render(renderer);
    this.pauseButton.render(renderer);
    const controls = this.game.ship.controls;
    if (controls.thrusting) this.thrustFeedback.render(renderer);
    if (controls.reversing) this.reverseFeedback.render(renderer);
    if (controls.braking) this.brakeFeedback.render(renderer);
    if (controls.firing) this.fireFeedback[this.game.weaponGroupId]?.render(renderer);
    this.creditIcon.render(renderer);
    this.gaugeBackground.render(renderer);
    this.energyGauge.render(renderer);
    this.shieldsGauge.render(renderer);
    this.gaugeArmorBackground.render(renderer);
    this.armorGauge.render(renderer);
    this.radar.render(renderer);
    if (this.game.canBeCompleted) this.stageClearButton.render(renderer);
  }
}
