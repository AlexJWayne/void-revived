import { FixedStepClock } from './clock.ts';

export interface AnimationFrameScheduler {
  request(callback: FrameRequestCallback): number;
  cancel(handle: number): void;
}

export class BrowserSimulationLoop {
  readonly #clock = new FixedStepClock();
  readonly #scheduler: AnimationFrameScheduler;
  readonly #update: () => void;
  readonly #render: (interpolation: number) => void;
  #handle: number | null = null;
  #previousTimestamp: number | null = null;
  #hasUpdated = false;

  constructor(update: () => void, render: (interpolation: number) => void, scheduler = browserScheduler()) {
    this.#update = update;
    this.#render = render;
    this.#scheduler = scheduler;
  }

  start(): void {
    if (this.#handle !== null) return;
    this.#handle = this.#scheduler.request(this.#frame);
  }

  stop(): void {
    if (this.#handle !== null) this.#scheduler.cancel(this.#handle);
    this.#handle = null;
    this.#previousTimestamp = null;
    this.#hasUpdated = false;
    this.#clock.reset();
  }

  readonly #frame = (timestamp: number): void => {
    const elapsed = this.#previousTimestamp === null ? 0 : timestamp - this.#previousTimestamp;
    this.#previousTimestamp = timestamp;
    const { steps, interpolation } = this.#clock.advance(elapsed, this.#update);
    if (steps > 0) this.#hasUpdated = true;
    this.#render(this.#hasUpdated ? interpolation : 1);
    // An update or render can pause combat or leave the flight screen.
    if (this.#handle !== null) this.#handle = this.#scheduler.request(this.#frame);
  };
}

function browserScheduler(): AnimationFrameScheduler {
  return {
    request: (callback) => requestAnimationFrame(callback),
    cancel: (handle) => cancelAnimationFrame(handle),
  };
}
