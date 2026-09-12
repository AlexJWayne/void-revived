import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  DEFAULT_GAME_SETTINGS,
  GameSettingsStore,
  SETTINGS_KEY,
} from '../src/application/settings.ts';
import type { KeyValueStorage } from '../src/player/storage.ts';

class MemoryStorage implements KeyValueStorage {
  readonly values = new Map<string, string>();

  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

describe('game settings persistence', () => {
  it('uses the Original Game defaults when no preferences exist', () => {
    assert.deepEqual(new GameSettingsStore(new MemoryStorage()).load(), DEFAULT_GAME_SETTINGS);
  });

  it('round-trips music, steering sensitivity, and inversion', () => {
    const storage = new MemoryStorage();
    const store = new GameSettingsStore(storage);
    const settings = store.save({ musicVolume: 0.75, turnSensitivity: 6.5, invertSteering: true });

    assert.deepEqual(store.load(), settings);
    assert.deepEqual(JSON.parse(storage.getItem(SETTINGS_KEY)!), settings);
  });

  it('contains corrupt or out-of-range browser preferences', () => {
    const storage = new MemoryStorage();
    storage.setItem(SETTINGS_KEY, JSON.stringify({
      musicVolume: 20,
      turnSensitivity: -3,
      invertSteering: 'yes',
    }));

    assert.deepEqual(new GameSettingsStore(storage).load(), {
      musicVolume: 1,
      turnSensitivity: 2,
      invertSteering: false,
    });

    storage.setItem(SETTINGS_KEY, '{bad json');
    assert.deepEqual(new GameSettingsStore(storage).load(), DEFAULT_GAME_SETTINGS);
  });
});
