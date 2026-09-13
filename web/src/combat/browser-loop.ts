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
    this.#clock.reset();
  }

  readonly #frame = (timestamp: number): void => {
    const elapsed = this.#previousTimestamp === null ? 0 : timestamp - this.#previousTimestamp;
    this.#previousTimestamp = timestamp;
    const { interpolation } = this.#clock.advance(elapsed, this.#update);
    this.#render(interpolation);
    this.#handle = this.#scheduler.request(this.#frame);
  };
}

function browserScheduler(): AnimationFrameScheduler {
  return {
    request: (callback) => requestAnimationFrame(callback),
    cancel: (handle) => cancelAnimationFrame(handle),
  };
}
