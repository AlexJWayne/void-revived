import type { KeyValueStorage } from '../player/storage.ts';

export const SETTINGS_KEY = 'the-void.settings';

export interface GameSettings {
  readonly musicVolume: number;
  readonly turnSensitivity: number;
  readonly invertSteering: boolean;
}

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  musicVolume: 0.5,
  turnSensitivity: 3,
  invertSteering: false,
};

export class GameSettingsStore {
  readonly #storage: KeyValueStorage;

  constructor(storage: KeyValueStorage) {
    this.#storage = storage;
  }

  load(): GameSettings {
    const serialized = this.#storage.getItem(SETTINGS_KEY);
    if (serialized === null) return DEFAULT_GAME_SETTINGS;

    try {
      return parseSettings(JSON.parse(serialized) as unknown);
    } catch {
      return DEFAULT_GAME_SETTINGS;
    }
  }

  save(settings: GameSettings): GameSettings {
    const normalized = parseSettings(settings);
    this.#storage.setItem(SETTINGS_KEY, JSON.stringify(normalized));
    return normalized;
  }
}

export function createBrowserSettingsStore(): GameSettingsStore {
  return new GameSettingsStore(window.localStorage);
}

function parseSettings(value: unknown): GameSettings {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return DEFAULT_GAME_SETTINGS;
  const input = value as Partial<Record<keyof GameSettings, unknown>>;

  return {
    musicVolume: finiteInRange(input.musicVolume, 0, 1, DEFAULT_GAME_SETTINGS.musicVolume),
    turnSensitivity: finiteInRange(input.turnSensitivity, 2, 10, DEFAULT_GAME_SETTINGS.turnSensitivity),
    invertSteering: typeof input.invertSteering === 'boolean'
      ? input.invertSteering
      : DEFAULT_GAME_SETTINGS.invertSteering,
  };
}

function finiteInRange(value: unknown, minimum: number, maximum: number, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(maximum, Math.max(minimum, value))
    : fallback;
}
