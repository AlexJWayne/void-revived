export const EMPTY_SLOT = '<Empty>';

export const HELP_SCREENS = ['GalaxyMap', 'Weapons', 'Equipment', 'Shipyard'] as const;

export type HelpScreen = (typeof HELP_SCREENS)[number];
export type WeaponGroups = readonly [readonly number[], readonly number[], readonly number[]];

export interface PlayerShip {
  readonly type: string;
  readonly guns: readonly string[];
  readonly equipment: readonly string[];
  readonly weaponGroups: WeaponGroups;
}

export interface PlayerInventory {
  readonly weapons: readonly string[];
  readonly equipment: readonly string[];
}

export interface PlayerState {
  readonly credits: number;
  readonly currentStage: string;
  readonly completedStages: readonly string[];
  readonly ship: PlayerShip;
  readonly inventory: PlayerInventory;
  readonly buybackWeapons: readonly string[];
  readonly buybackWeaponsValue: number;
  readonly buybackEquipment: readonly string[];
  readonly buybackEquipmentValue: number;
  readonly ownedShips: readonly string[];
  readonly newShipCount: number;
  readonly newWeaponCount: number;
  readonly newEquipmentCount: number;
  readonly unlockedAchievements: readonly string[];
  readonly seenHelp: Readonly<Partial<Record<HelpScreen, boolean>>>;
  readonly seenGalaxyConquered: boolean;
}

export interface StageGraphEntry {
  readonly connections: readonly string[];
}

export type StageGraph = Readonly<Record<string, StageGraphEntry>>;

export type StageReadiness =
  | { readonly kind: 'ready' }
  | { readonly kind: 'no-ship' }
  | { readonly kind: 'no-weapons' }
  | { readonly kind: 'no-weapon-group' };

export function createPlayerState(source: unknown): PlayerState {
  const input = record(source, 'player');
  const ship = record(input.ship, 'player.ship');
  const inventory = record(input.inventory, 'player.inventory');
  const weaponGroups = array(ship.weaponGroups, 'player.ship.weaponGroups');

  if (weaponGroups.length !== 3) {
    throw new InvalidPlayerStateError('player.ship.weaponGroups must contain groups A, B, and C');
  }

  const guns = stringArray(ship.guns, 'player.ship.guns');
  const parsedGroups = weaponGroups.map((group, groupIndex) => {
    const indices = numberArray(group, `player.ship.weaponGroups[${groupIndex}]`);
    const unique = new Set(indices);
    if (unique.size !== indices.length) {
      throw new InvalidPlayerStateError(`player.ship.weaponGroups[${groupIndex}] contains a duplicate hardpoint`);
    }
    if (indices.some((index) => !Number.isInteger(index) || index < 0 || index >= guns.length)) {
      throw new InvalidPlayerStateError(`player.ship.weaponGroups[${groupIndex}] references an invalid hardpoint`);
    }
    return indices;
  }) as [number[], number[], number[]];

  const ownedShips = stringArray(input.ownedShips, 'player.ownedShips');
  const shipType = string(ship.type, 'player.ship.type');
  if (shipType !== EMPTY_SLOT && !ownedShips.includes(shipType)) {
    throw new InvalidPlayerStateError('player.ship.type must be owned before it can be piloted');
  }

  return {
    credits: integer(input.credits, 'player.credits'),
    currentStage: string(input.currentStage, 'player.currentStage'),
    completedStages: uniqueStringArray(input.completedStages, 'player.completedStages'),
    ship: {
      type: shipType,
      guns,
      equipment: stringArray(ship.equipment, 'player.ship.equipment'),
      weaponGroups: parsedGroups,
    },
    inventory: {
      weapons: stringArray(inventory.weapons, 'player.inventory.weapons'),
      equipment: stringArray(inventory.equipment, 'player.inventory.equipment'),
    },
    buybackWeapons: stringArray(input.buybackWeapons, 'player.buybackWeapons'),
    buybackWeaponsValue: nonNegativeInteger(input.buybackWeaponsValue, 'player.buybackWeaponsValue'),
    buybackEquipment: stringArray(input.buybackEquipment, 'player.buybackEquipment'),
    buybackEquipmentValue: nonNegativeInteger(input.buybackEquipmentValue, 'player.buybackEquipmentValue'),
    ownedShips,
    newShipCount: nonNegativeInteger(input.newShipCount, 'player.newShipCount'),
    newWeaponCount: nonNegativeInteger(input.newWeaponCount, 'player.newWeaponCount'),
    newEquipmentCount: nonNegativeInteger(input.newEquipmentCount, 'player.newEquipmentCount'),
    unlockedAchievements: optionalStringArray(input.unlockedAchievements ?? input.unlockedAcheivements, 'player.unlockedAchievements'),
    seenHelp: parseSeenHelp(input.seenHelp),
    seenGalaxyConquered: optionalBoolean(input.seenGalaxyConquered, 'player.seenGalaxyConquered'),
  };
}

export function completeStage(player: PlayerState, stageName: string): PlayerState {
  if (player.completedStages.includes(stageName)) return player;
  return createPlayerState({ ...player, completedStages: [...player.completedStages, stageName] });
}

export function canTravelToStage(player: PlayerState, destination: string, stages: StageGraph): boolean {
  if (!(destination in stages)) return false;
  if (destination === player.currentStage || player.completedStages.includes(destination)) return true;

  return player.completedStages.some((completed) =>
    stages[completed]?.connections.includes(destination)
    || stages[destination]?.connections.includes(completed),
  );
}

export function reachableStages(player: PlayerState, stages: StageGraph): readonly string[] {
  return Object.keys(stages).filter((stageName) => canTravelToStage(player, stageName, stages));
}

export function stageReadiness(player: PlayerState): StageReadiness {
  if (player.ship.type === EMPTY_SLOT) return { kind: 'no-ship' };
  if (!player.ship.guns.some((gun) => gun !== EMPTY_SLOT)) return { kind: 'no-weapons' };
  if (!player.ship.weaponGroups.some((group) => group.length > 0)) return { kind: 'no-weapon-group' };
  return { kind: 'ready' };
}

export function markHelpSeen(player: PlayerState, screen: HelpScreen): PlayerState {
  return createPlayerState({ ...player, seenHelp: { ...player.seenHelp, [screen]: true } });
}

export class InvalidPlayerStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPlayerStateError';
  }
}

function record(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new InvalidPlayerStateError(`${path} must be an object`);
  }
  return value as Record<string, unknown>;
}

function array(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) throw new InvalidPlayerStateError(`${path} must be an array`);
  return value;
}

function string(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new InvalidPlayerStateError(`${path} must be a non-empty string`);
  }
  return value;
}

function stringArray(value: unknown, path: string): string[] {
  return array(value, path).map((item, index) => string(item, `${path}[${index}]`));
}

function optionalStringArray(value: unknown, path: string): string[] {
  return value === undefined || value === null ? [] : stringArray(value, path);
}

function uniqueStringArray(value: unknown, path: string): string[] {
  const values = stringArray(value, path);
  if (new Set(values).size !== values.length) throw new InvalidPlayerStateError(`${path} contains duplicates`);
  return values;
}

function numberArray(value: unknown, path: string): number[] {
  return array(value, path).map((item, index) => number(item, `${path}[${index}]`));
}

function number(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new InvalidPlayerStateError(`${path} must be a finite number`);
  }
  return value;
}

function nonNegativeInteger(value: unknown, path: string): number {
  const parsed = integer(value, path);
  if (parsed < 0) {
    throw new InvalidPlayerStateError(`${path} must be a non-negative integer`);
  }
  return parsed;
}

function integer(value: unknown, path: string): number {
  const parsed = number(value, path);
  if (!Number.isInteger(parsed)) throw new InvalidPlayerStateError(`${path} must be an integer`);
  return parsed;
}

function optionalBoolean(value: unknown, path: string): boolean {
  if (value === undefined) return false;
  if (typeof value !== 'boolean') throw new InvalidPlayerStateError(`${path} must be a boolean`);
  return value;
}

function parseSeenHelp(value: unknown): Partial<Record<HelpScreen, boolean>> {
  if (value === undefined) return {};
  const input = record(value, 'player.seenHelp');
  const result: Partial<Record<HelpScreen, boolean>> = {};
  for (const screen of HELP_SCREENS) {
    if (input[screen] !== undefined) result[screen] = optionalBoolean(input[screen], `player.seenHelp.${screen}`);
  }
  return result;
}
