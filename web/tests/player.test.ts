import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

import {
  InvalidPlayerStateError,
  canTravelToStage,
  completeStage,
  createPlayerState,
  markHelpSeen,
  stageReadiness,
  type StageGraph,
} from '../src/player/model.ts';
import {
  COMBAT_SNAPSHOT_KEY,
  PLAYER_SAVE_KEY,
  PlayerStore,
  UnsupportedSaveVersionError,
  type KeyValueStorage,
} from '../src/player/storage.ts';

const defaultPlayerUrl = new URL('../public/content/data/newPlayer.json', import.meta.url);

class MemoryStorage implements KeyValueStorage {
  readonly values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

async function defaultPlayerData(): Promise<unknown> {
  return JSON.parse(await readFile(defaultPlayerUrl, 'utf8')) as unknown;
}

describe('player state', () => {
  it('creates the Original Game defaults without inventing progress', async () => {
    const player = createPlayerState(await defaultPlayerData());

    assert.equal(player.credits, 100);
    assert.equal(player.currentStage, 'Discipulus Minor');
    assert.deepEqual(player.completedStages, []);
    assert.deepEqual(player.ship, { type: '<Empty>', guns: [], equipment: [], weaponGroups: [[], [], []] });
    assert.equal(player.newShipCount, 4);
    assert.deepEqual(player.unlockedAchievements, []);
    assert.deepEqual(player.seenHelp, {});
  });

  it('completes each stage once and follows the original bidirectional reachability rule', async () => {
    const player = completeStage(createPlayerState(await defaultPlayerData()), 'Discipulus Minor');
    const completedAgain = completeStage(player, 'Discipulus Minor');
    const stages: StageGraph = {
      'Discipulus Minor': { connections: ['Discipulus Medius'] },
      'Discipulus Medius': { connections: [] },
      Isolated: { connections: [] },
    };

    assert.equal(completedAgain, player);
    assert.equal(canTravelToStage(player, 'Discipulus Medius', stages), true);
    assert.equal(canTravelToStage(player, 'Isolated', stages), false);
  });

  it('tracks first-view help flags with the durable profile', async () => {
    const player = markHelpSeen(createPlayerState(await defaultPlayerData()), 'Weapons');
    assert.deepEqual(player.seenHelp, { Weapons: true });
  });

  it('enforces loadout shape and hardpoint references', async () => {
    const defaults = await defaultPlayerData() as Record<string, unknown>;
    const ship = defaults.ship as Record<string, unknown>;

    assert.throws(
      () => createPlayerState({ ...defaults, ship: { ...ship, weaponGroups: [[0], [], []] } }),
      InvalidPlayerStateError,
    );
    assert.throws(
      () => createPlayerState({ ...defaults, ship: { ...ship, guns: ['Laser'], weaponGroups: [[1], [], []] } }),
      InvalidPlayerStateError,
    );
  });

  it('matches the Original Game preflight readiness checks', async () => {
    const defaults = await defaultPlayerData() as Record<string, unknown>;
    assert.equal(stageReadiness(createPlayerState(defaults)).kind, 'no-ship');

    const owned = { ...defaults, ownedShips: ['Cyber Shuttle'] };
    const emptyShip = { type: 'Cyber Shuttle', guns: ['<Empty>'], equipment: ['<Empty>'], weaponGroups: [[], [], []] };
    assert.equal(stageReadiness(createPlayerState({ ...owned, ship: emptyShip })).kind, 'no-weapons');

    const armedShip = { ...emptyShip, guns: ['Genjuro Blaster'] };
    assert.equal(stageReadiness(createPlayerState({ ...owned, ship: armedShip })).kind, 'no-weapon-group');
    assert.equal(stageReadiness(createPlayerState({ ...owned, ship: { ...armedShip, weaponGroups: [[0], [], []] } })).kind, 'ready');
  });
});

describe('player persistence', () => {
  it('starts, continues, and round-trips a versioned local save', async () => {
    const storage = new MemoryStorage();
    const store = new PlayerStore(storage);
    const started = store.startNewGame(await defaultPlayerData());
    const advanced = completeStage(started, 'Discipulus Minor');
    store.save(advanced);

    assert.equal(store.hasContinue(), true);
    assert.deepEqual(store.continueGame(), advanced);
    assert.equal(JSON.parse(storage.getItem(PLAYER_SAVE_KEY)!).version, 1);
  });

  it('migrates an unversioned Original Game dictionary on read', async () => {
    const storage = new MemoryStorage();
    storage.setItem(PLAYER_SAVE_KEY, JSON.stringify(await defaultPlayerData()));

    const player = new PlayerStore(storage).continueGame();

    assert.equal(player?.currentStage, 'Discipulus Minor');
    assert.equal(JSON.parse(storage.getItem(PLAYER_SAVE_KEY)!).version, 1);
  });

  it('rejects unknown save versions without overwriting them', () => {
    const storage = new MemoryStorage();
    const serialized = JSON.stringify({ version: 2, player: {} });
    storage.setItem(PLAYER_SAVE_KEY, serialized);

    assert.throws(() => new PlayerStore(storage).continueGame(), UnsupportedSaveVersionError);
    assert.equal(storage.getItem(PLAYER_SAVE_KEY), serialized);
  });

  it('keeps a resumable combat snapshot separate and consumes it once', async () => {
    const storage = new MemoryStorage();
    const store = new PlayerStore(storage);
    store.startNewGame(await defaultPlayerData());
    store.saveCombatSnapshot({ stage: 'Discipulus Minor', tick: 42 });

    assert.equal(store.hasContinue(), true);
    assert.equal(store.hasCombatSnapshot(), true);
    assert.deepEqual(store.takeCombatSnapshot((value) => value), { stage: 'Discipulus Minor', tick: 42 });
    assert.equal(storage.getItem(COMBAT_SNAPSHOT_KEY), null);
    assert.equal(store.takeCombatSnapshot((value) => value), null);
  });

  it('clears both persistence lanes when starting over', async () => {
    const storage = new MemoryStorage();
    const store = new PlayerStore(storage);
    store.startNewGame(await defaultPlayerData());
    store.saveCombatSnapshot({ tick: 1 });
    store.deletePlayer();

    assert.equal(store.hasContinue(), false);
    assert.equal(store.hasCombatSnapshot(), false);
  });
});
