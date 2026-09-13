import type { Game } from './game.ts';

import { Accelerometer } from '../application/accelerometer.ts';

/** Browser events become the touches and accelerometer samples consumed by Game. */
export class FlightInput {
  readonly canvas: HTMLCanvasElement;
  readonly game: Game;
  active = false;
  readonly accelerometer: Accelerometer;

  constructor(canvas: HTMLCanvasElement, game: Game) {
    this.canvas = canvas;
    this.game = game;
    canvas.addEventListener('pointerdown', this.pointerDown);
    canvas.addEventListener('pointermove', this.pointerMove);
    canvas.addEventListener('pointerup', this.pointerUp);
    canvas.addEventListener('pointercancel', this.pointerUp);
    canvas.addEventListener('lostpointercapture', this.pointerUp);
    canvas.addEventListener('contextmenu', this.preventMenu);
    this.accelerometer = new Accelerometer((y) => { if (this.active) game.accelerometer(y); });
  }

  requestMotion(): Promise<void> { return this.accelerometer.requestPermission(); }
  get canStart(): boolean { return navigator.maxTouchPoints === 0 || this.accelerometer.hasRecentSample; }

  start(): void {
    this.active = true;
    this.game.clearTouches();
    if (this.accelerometer.current !== null) this.game.accelerometer(this.accelerometer.current);
  }

  stop(): void { this.active = false; this.game.clearTouches(); }

  private readonly pointerDown = (event: PointerEvent): void => {
    if (!this.active) return;
    event.preventDefault();
    this.canvas.setPointerCapture(event.pointerId);
    this.game.touchesBegan(event.pointerId, this.position(event));
  };

  private readonly pointerMove = (event: PointerEvent): void => {
    if (this.active) this.game.touchesMoved(event.pointerId, this.position(event));
  };

  private readonly pointerUp = (event: PointerEvent): void => { this.game.touchesEnded(event.pointerId); };
  private readonly preventMenu = (event: Event): void => { event.preventDefault(); };

  private position(event: PointerEvent): { x: number; y: number } {
    const rectangle = this.canvas.getBoundingClientRect();
    return { x: (event.clientX - rectangle.left) * 480 / rectangle.width,
      y: (event.clientY - rectangle.top) * 320 / rectangle.height };
  }

  dispose(): void {
    this.stop();
    this.canvas.removeEventListener('pointerdown', this.pointerDown);
    this.canvas.removeEventListener('pointermove', this.pointerMove);
    this.canvas.removeEventListener('pointerup', this.pointerUp);
    this.canvas.removeEventListener('pointercancel', this.pointerUp);
    this.canvas.removeEventListener('lostpointercapture', this.pointerUp);
    this.canvas.removeEventListener('contextmenu', this.preventMenu);
    this.accelerometer.dispose();
  }
}
