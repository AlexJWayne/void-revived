import { createPlayerState, type PlayerState } from './model.ts';

export const PLAYER_SAVE_KEY = 'the-void.player';
export const COMBAT_SNAPSHOT_KEY = 'the-void.combat-snapshot';
export const PLAYER_SAVE_VERSION = 1;
export const COMBAT_SNAPSHOT_VERSION = 1;

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface PlayerSaveEnvelope {
  readonly version: typeof PLAYER_SAVE_VERSION;
  readonly player: PlayerState;
}

interface CombatSnapshotEnvelope<T> {
  readonly version: typeof COMBAT_SNAPSHOT_VERSION;
  readonly snapshot: T;
}

export class PlayerStore {
  readonly #storage: KeyValueStorage;

  constructor(storage: KeyValueStorage) {
    this.#storage = storage;
  }

  hasContinue(): boolean {
    return this.#storage.getItem(PLAYER_SAVE_KEY) !== null;
  }

  startNewGame(defaultPlayerData: unknown): PlayerState {
    const player = createPlayerState(defaultPlayerData);
    this.#storage.removeItem(COMBAT_SNAPSHOT_KEY);
    this.save(player);
    return player;
  }

  continueGame(): PlayerState | null {
    const serialized = this.#storage.getItem(PLAYER_SAVE_KEY);
    if (serialized === null) return null;

    const decoded = parseJson(serialized, PLAYER_SAVE_KEY);
    if (isVersionedEnvelope(decoded)) {
      if (decoded.version !== PLAYER_SAVE_VERSION) throw new UnsupportedSaveVersionError('player', decoded.version);
      return createPlayerState(decoded.player);
    }

    // Migrate the Original Game's unversioned player dictionary on first read.
    const player = createPlayerState(decoded);
    this.save(player);
    return player;
  }

  save(player: PlayerState): void {
    const envelope: PlayerSaveEnvelope = {
      version: PLAYER_SAVE_VERSION,
      player: createPlayerState(player),
    };
    this.#storage.setItem(PLAYER_SAVE_KEY, JSON.stringify(envelope));
  }

  deletePlayer(): void {
    this.#storage.removeItem(PLAYER_SAVE_KEY);
    this.#storage.removeItem(COMBAT_SNAPSHOT_KEY);
  }

  saveCombatSnapshot<T>(snapshot: T): void {
    const envelope: CombatSnapshotEnvelope<T> = { version: COMBAT_SNAPSHOT_VERSION, snapshot };
    this.#storage.setItem(COMBAT_SNAPSHOT_KEY, JSON.stringify(envelope));
  }

  hasCombatSnapshot(): boolean {
    return this.#storage.getItem(COMBAT_SNAPSHOT_KEY) !== null;
  }

  takeCombatSnapshot<T>(validate: (value: unknown) => T): T | null {
    const serialized = this.#storage.getItem(COMBAT_SNAPSHOT_KEY);
    if (serialized === null) return null;

    const decoded = parseJson(serialized, COMBAT_SNAPSHOT_KEY);
    if (!isVersionedEnvelope(decoded)) throw new InvalidSaveDataError('combat snapshot envelope is missing a version');
    if (decoded.version !== COMBAT_SNAPSHOT_VERSION) throw new UnsupportedSaveVersionError('combat snapshot', decoded.version);

    const snapshot = validate(decoded.snapshot);
    this.#storage.removeItem(COMBAT_SNAPSHOT_KEY);
    return snapshot;
  }

  discardCombatSnapshot(): void {
    this.#storage.removeItem(COMBAT_SNAPSHOT_KEY);
  }
}

export class UnsupportedSaveVersionError extends Error {
  readonly version: unknown;

  constructor(kind: string, version: unknown) {
    super(`Unsupported ${kind} save version: ${String(version)}`);
    this.name = 'UnsupportedSaveVersionError';
    this.version = version;
  }
}

export class InvalidSaveDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidSaveDataError';
  }
}

function parseJson(serialized: string, key: string): unknown {
  try {
    return JSON.parse(serialized) as unknown;
  } catch {
    throw new InvalidSaveDataError(`${key} does not contain valid JSON`);
  }
}

function isVersionedEnvelope(value: unknown): value is Record<string, unknown> & { version: unknown } {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value) && 'version' in value);
}
