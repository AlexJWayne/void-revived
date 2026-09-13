import { Projectile, type ProjectileSnapshot } from './projectile.ts';
import { Ship, type ShipSnapshot } from './ship.ts';

export interface SimulationSnapshot {
  readonly tick: number;
  readonly ships: readonly ShipSnapshot[];
  readonly projectiles: readonly ProjectileSnapshot[];
}

export type SimulationPhase = 'before-projectiles' | 'after-projectiles' | 'after-ships' | 'after-step';
export type SimulationObserver = (runtime: SimulationRuntime, phase: SimulationPhase) => void;

export class SimulationRuntime {
  tick: number;
  readonly ships: Ship[];
  readonly projectiles: Projectile[];
  readonly #observers: SimulationObserver[] = [];
  readonly #pendingShips: Ship[] = [];
  readonly #pendingProjectiles: Projectile[] = [];
  readonly #shipsToRemove = new Set<number>();
  readonly #projectilesToRemove = new Set<number>();
  #updating = false;

  constructor(snapshot: SimulationSnapshot = { tick: 0, ships: [], projectiles: [] }) {
    this.tick = snapshot.tick;
    this.ships = snapshot.ships.map((ship) => new Ship(ship));
    this.projectiles = snapshot.projectiles.map((projectile) => new Projectile(projectile));
  }

  observe(observer: SimulationObserver): () => void {
    this.#observers.push(observer);
    return () => {
      const index = this.#observers.indexOf(observer);
      if (index >= 0) this.#observers.splice(index, 1);
    };
  }

  addShip(ship: Ship): void {
    this.#addUnique(this.ships, this.#pendingShips, ship);
  }

  addProjectile(projectile: Projectile): void {
    this.#addUnique(this.projectiles, this.#pendingProjectiles, projectile);
  }

  removeShip(id: number): void {
    this.#shipsToRemove.add(id);
  }

  removeProjectile(id: number): void {
    this.#projectilesToRemove.add(id);
  }

  update(): void {
    if (this.#updating) throw new Error('SimulationRuntime.update cannot be called recursively');
    this.#updating = true;
    try {
      this.tick += 1;
      this.#notify('before-projectiles');
      const targets = new Map(this.ships.map((ship) => [ship.id, ship]));
      for (const projectile of this.projectiles) projectile.updateWithTargets(targets);
      removeWhere(this.projectiles, (projectile) => projectile.expired || this.#projectilesToRemove.has(projectile.id));
      this.#projectilesToRemove.clear();
      this.#notify('after-projectiles');
      for (const ship of this.ships) ship.update();
      this.#notify('after-ships');
      this.#notify('after-step');
    } finally {
      this.#updating = false;
      removeWhere(this.projectiles, (projectile) => this.#projectilesToRemove.has(projectile.id));
      removeWhere(this.ships, (ship) => this.#shipsToRemove.has(ship.id));
      this.#projectilesToRemove.clear();
      this.#shipsToRemove.clear();
      this.ships.push(...this.#pendingShips.splice(0));
      this.projectiles.push(...this.#pendingProjectiles.splice(0));
    }
  }

  toSnapshot(): SimulationSnapshot {
    return {
      tick: this.tick,
      ships: this.ships.map((ship) => ship.toSnapshot()),
      projectiles: this.projectiles.map((projectile) => projectile.toSnapshot()),
    };
  }

  #addUnique<T extends { readonly id: number }>(active: T[], pending: T[], value: T): void {
    if (active.some((item) => item.id === value.id) || pending.some((item) => item.id === value.id)) {
      throw new Error(`Duplicate simulation object id: ${value.id}`);
    }
    (this.#updating ? pending : active).push(value);
  }

  #notify(phase: SimulationPhase): void {
    for (const observer of [...this.#observers]) observer(this, phase);
  }
}

function removeWhere<T>(values: T[], predicate: (value: T) => boolean): void {
  let writeIndex = 0;
  for (const value of values) {
    if (!predicate(value)) values[writeIndex++] = value;
  }
  values.length = writeIndex;
}
