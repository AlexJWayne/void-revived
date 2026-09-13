export const SIMULATION_HZ = 40;
export const SIMULATION_STEP_MS = 1000 / SIMULATION_HZ;
export const MAX_CATCH_UP_MS = 250;

export interface FixedStepResult {
  readonly steps: number;
  readonly interpolation: number;
}

export class FixedStepClock {
  #accumulator = 0;

  advance(elapsedMilliseconds: number, update: () => void): FixedStepResult {
    if (!Number.isFinite(elapsedMilliseconds)) throw new TypeError('elapsedMilliseconds must be finite');
    this.#accumulator += Math.max(0, Math.min(MAX_CATCH_UP_MS, elapsedMilliseconds));

    let steps = 0;
    while (this.#accumulator + Number.EPSILON >= SIMULATION_STEP_MS) {
      update();
      steps += 1;
      this.#accumulator -= SIMULATION_STEP_MS;
    }

    return { steps, interpolation: Math.max(0, this.#accumulator / SIMULATION_STEP_MS) };
  }

  reset(): void {
    this.#accumulator = 0;
  }
}
