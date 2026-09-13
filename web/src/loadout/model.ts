import { createPlayerState, EMPTY_SLOT, type PlayerState } from '../player/model.ts';

export interface WeaponDefinition {
  readonly accel: number;
  readonly armorDmg: number;
  readonly beam: boolean;
  readonly beamRange: number;
  readonly coolDown: number;
  readonly description: string;
  readonly energy: number;
  readonly icon: string;
  readonly lifetime: number;
  readonly mass: number;
  readonly shieldDmg: number;
  readonly speed: number;
  readonly value: number;
}

export interface EquipmentEffect {
  readonly amount: number;
  readonly stat: string;
}

export interface EquipmentDefinition {
  readonly description: string;
  readonly effects: readonly EquipmentEffect[];
  readonly groupName: string;
  readonly icon: string;
  readonly mass: number;
  readonly value: number;
}

export interface ShipModelPart {
  readonly modelName: string;
  readonly style: string;
  readonly texture: string;
}

export interface ShipDefinition {
  readonly armor: number;
  readonly brakeForce: number;
  readonly energy: number;
  readonly energyRecharge: number;
  readonly equipmentSlots: number;
  readonly gunHardpoints: readonly unknown[];
  readonly mass: number;
  readonly maxSpeed: number;
  readonly model: readonly ShipModelPart[];
  readonly name: string;
  readonly pilotable: boolean;
  readonly price: number;
  readonly shieldRecharge: number;
  readonly shieldRechargeDelay: number;
  readonly shields: number;
  readonly size: number;
  readonly thrusterForce: number;
  readonly turnSpeed: number;
  readonly unlockStages?: readonly string[];
}

export type WeaponCatalog = Readonly<Record<string, WeaponDefinition>>;
export type EquipmentCatalog = Readonly<Record<string, EquipmentDefinition>>;
export type ShipCatalog = Readonly<Record<string, ShipDefinition>>;
export type ItemKind = 'weapons' | 'equipment';
export type LoadoutFailure =
  | 'no-ship'
  | 'invalid-hardpoint'
  | 'occupied-hardpoint'
  | 'item-not-owned'
  | 'unknown-item'
  | 'not-enough-energy'
  | 'duplicate-equipment-group'
  | 'nothing-to-buy-back'
  | 'ship-unavailable'
  | 'not-enough-credits'
  | 'ship-not-owned'
  | 'cannot-sell-piloted-ship';

export type PlayerActionResult =
  | { readonly ok: true; readonly player: PlayerState }
  | { readonly ok: false; readonly reason: LoadoutFailure };

const success = (source: unknown): PlayerActionResult => ({ ok: true, player: createPlayerState(source) });
const failure = (reason: LoadoutFailure): PlayerActionResult => ({ ok: false, reason });

export function mountWeapon(
  player: PlayerState,
  name: string,
  hardpoint: number,
  weapons: WeaponCatalog,
  ships: ShipCatalog,
): PlayerActionResult {
  if (player.ship.type === EMPTY_SLOT) return failure('no-ship');
  if (!Number.isInteger(hardpoint) || hardpoint < 0 || hardpoint >= player.ship.guns.length) return failure('invalid-hardpoint');
  if (player.ship.guns[hardpoint] !== EMPTY_SLOT) return failure('occupied-hardpoint');
  const inventoryIndex = player.inventory.weapons.indexOf(name);
  if (inventoryIndex < 0) return failure('item-not-owned');
  const weapon = weapons[name];
  if (!weapon) return failure('unknown-item');
  if (weapon.energy > (ships[player.ship.type]?.energy ?? 0)) return failure('not-enough-energy');

  const inventory = [...player.inventory.weapons];
  inventory.splice(inventoryIndex, 1);
  const guns = [...player.ship.guns];
  guns[hardpoint] = name;
  return success({ ...player, ship: { ...player.ship, guns }, inventory: { ...player.inventory, weapons: inventory } });
}

export function dismountWeapon(player: PlayerState, hardpoint: number): PlayerActionResult {
  if (!Number.isInteger(hardpoint) || hardpoint < 0 || hardpoint >= player.ship.guns.length) return failure('invalid-hardpoint');
  const name = player.ship.guns[hardpoint];
  if (name === EMPTY_SLOT) return { ok: true, player };
  const guns = [...player.ship.guns];
  guns[hardpoint] = EMPTY_SLOT;
  return success({
    ...player,
    ship: { ...player.ship, guns },
    inventory: { ...player.inventory, weapons: [...player.inventory.weapons, name].sort() },
  });
}

export function toggleWeaponGroup(player: PlayerState, hardpoint: number, group: number): PlayerActionResult {
  if (!Number.isInteger(hardpoint) || hardpoint < 0 || hardpoint >= player.ship.guns.length) return failure('invalid-hardpoint');
  if (!Number.isInteger(group) || group < 0 || group > 2) return failure('invalid-hardpoint');
  const groups = player.ship.weaponGroups.map((indices) => [...indices]) as [number[], number[], number[]];
  const target = groups[group]!;
  const index = target.indexOf(hardpoint);
  if (index < 0) target.push(hardpoint);
  else target.splice(index, 1);
  return success({ ...player, ship: { ...player.ship, weaponGroups: groups } });
}

export function mountEquipment(
  player: PlayerState,
  name: string,
  hardpoint: number,
  equipment: EquipmentCatalog,
): PlayerActionResult {
  if (player.ship.type === EMPTY_SLOT) return failure('no-ship');
  if (!Number.isInteger(hardpoint) || hardpoint < 0 || hardpoint >= player.ship.equipment.length) return failure('invalid-hardpoint');
  if (player.ship.equipment[hardpoint] !== EMPTY_SLOT) return failure('occupied-hardpoint');
  const inventoryIndex = player.inventory.equipment.indexOf(name);
  if (inventoryIndex < 0) return failure('item-not-owned');
  const item = equipment[name];
  if (!item) return failure('unknown-item');
  if (player.ship.equipment.some((equipped) => equipped !== EMPTY_SLOT && equipment[equipped]?.groupName === item.groupName)) {
    return failure('duplicate-equipment-group');
  }

  const inventory = [...player.inventory.equipment];
  inventory.splice(inventoryIndex, 1);
  const mounted = [...player.ship.equipment];
  mounted[hardpoint] = name;
  return success({ ...player, ship: { ...player.ship, equipment: mounted }, inventory: { ...player.inventory, equipment: inventory } });
}

export function dismountEquipment(
  player: PlayerState,
  hardpoint: number,
  equipment: EquipmentCatalog,
): PlayerActionResult {
  if (!Number.isInteger(hardpoint) || hardpoint < 0 || hardpoint >= player.ship.equipment.length) return failure('invalid-hardpoint');
  const name = player.ship.equipment[hardpoint];
  if (!name || name === EMPTY_SLOT) return { ok: true, player };
  const mounted = [...player.ship.equipment];
  mounted[hardpoint] = EMPTY_SLOT;
  return success({
    ...player,
    ship: { ...player.ship, equipment: mounted },
    inventory: { ...player.inventory, equipment: sortEquipment([...player.inventory.equipment, name], equipment) },
  });
}

export function sellItems(
  player: PlayerState,
  kind: ItemKind,
  indices: readonly number[],
  catalog: WeaponCatalog | EquipmentCatalog,
): PlayerActionResult {
  const inventory = player.inventory[kind];
  const selected = [...new Set(indices)].filter((index) => Number.isInteger(index) && index >= 0 && index < inventory.length).sort((a, b) => a - b);
  if (!selected.length) return failure('item-not-owned');
  const sold = selected.map((index) => inventory[index]!);
  if (sold.some((name) => !catalog[name])) return failure('unknown-item');
  const soldSet = new Set(selected);
  const remaining = inventory.filter((_, index) => !soldSet.has(index));
  const value = sold.reduce((total, name) => total + catalog[name]!.value, 0);
  const nextInventory = kind === 'weapons'
    ? { ...player.inventory, weapons: remaining }
    : { ...player.inventory, equipment: remaining };
  const buyback = kind === 'weapons'
    ? { buybackWeapons: sold, buybackWeaponsValue: value }
    : { buybackEquipment: sold, buybackEquipmentValue: value };
  return success({ ...player, ...buyback, credits: player.credits + value, inventory: nextInventory });
}

export function buyBackItems(
  player: PlayerState,
  kind: ItemKind,
  equipment?: EquipmentCatalog,
): PlayerActionResult {
  const items = kind === 'weapons' ? player.buybackWeapons : player.buybackEquipment;
  const value = kind === 'weapons' ? player.buybackWeaponsValue : player.buybackEquipmentValue;
  if (!items.length) return failure('nothing-to-buy-back');
  const merged = [...player.inventory[kind], ...items];
  const inventory = kind === 'weapons'
    ? { ...player.inventory, weapons: merged.sort() }
    : { ...player.inventory, equipment: equipment ? sortEquipment(merged, equipment) : merged };
  const buyback = kind === 'weapons'
    ? { buybackWeapons: [], buybackWeaponsValue: 0 }
    : { buybackEquipment: [], buybackEquipmentValue: 0 };
  return success({ ...player, ...buyback, credits: player.credits - value, inventory });
}

export function availableShips(player: PlayerState, ships: ShipCatalog): readonly string[] {
  return Object.entries(ships)
    .filter(([name, ship]) => player.ownedShips.includes(name)
      || (ship.pilotable && (!ship.unlockStages?.length || ship.unlockStages.some((stage) => player.completedStages.includes(stage)))))
    .sort(([nameA, shipA], [nameB, shipB]) => shipB.price - shipA.price || nameA.localeCompare(nameB))
    .map(([name]) => name);
}

export function shipTradeInValue(player: PlayerState, ships: ShipCatalog): number {
  return Math.trunc(player.ownedShips.reduce((total, name) => total + (ships[name]?.price ?? 0) * 0.75, 0));
}

export function purchaseOrPilotShip(
  player: PlayerState,
  name: string,
  ships: ShipCatalog,
  tradeIn = false,
): PlayerActionResult {
  const ship = ships[name];
  if (!ship || !availableShips(player, ships).includes(name)) return failure('ship-unavailable');
  const alreadyOwned = player.ownedShips.includes(name);
  if (alreadyOwned && player.ship.type === name) return { ok: true, player };
  if (!alreadyOwned && player.credits < ship.price) {
    if (!tradeIn || player.credits + shipTradeInValue(player, ships) < ship.price) return failure('not-enough-credits');
  }

  const firstShip = player.ownedShips.length === 0;
  const returnedWeapons = player.ship.guns.filter((gun) => gun !== EMPTY_SLOT);
  const returnedEquipment = player.ship.equipment.filter((item) => item !== EMPTY_SLOT);
  const tradeCredit = !alreadyOwned && tradeIn ? shipTradeInValue(player, ships) : 0;
  const ownedShips = alreadyOwned ? [...player.ownedShips] : tradeIn ? [name] : [...player.ownedShips, name];
  const starter = firstShip ? starterWeapon(name) : null;
  const hardpoints = ship.gunHardpoints.map((_, index) => index);

  return success({
    ...player,
    credits: player.credits + tradeCredit - (alreadyOwned ? 0 : ship.price),
    ownedShips,
    ship: {
      type: name,
      guns: ship.gunHardpoints.map(() => EMPTY_SLOT),
      equipment: Array.from({ length: ship.equipmentSlots }, () => EMPTY_SLOT),
      weaponGroups: [[...hardpoints], [...hardpoints], [...hardpoints]],
    },
    inventory: {
      weapons: [...player.inventory.weapons, ...returnedWeapons, ...(starter ? [starter] : [])].sort(),
      equipment: [...player.inventory.equipment, ...returnedEquipment],
    },
  });
}

export function sellShip(player: PlayerState, name: string, ships: ShipCatalog): PlayerActionResult {
  if (!player.ownedShips.includes(name)) return failure('ship-not-owned');
  if (player.ship.type === name) return failure('cannot-sell-piloted-ship');
  const ship = ships[name];
  if (!ship) return failure('ship-unavailable');
  return success({
    ...player,
    credits: player.credits + Math.trunc(ship.price * 0.75),
    ownedShips: player.ownedShips.filter((owned) => owned !== name),
  });
}

export function clearNewItemCount(player: PlayerState, kind: ItemKind | 'ships'): PlayerState {
  if (kind === 'weapons') return createPlayerState({ ...player, newWeaponCount: 0 });
  if (kind === 'equipment') return createPlayerState({ ...player, newEquipmentCount: 0 });
  return createPlayerState({ ...player, newShipCount: 0 });
}

export function sortEquipment(names: readonly string[], equipment: EquipmentCatalog): string[] {
  return [...names].sort((a, b) => {
    const first = equipment[a];
    const second = equipment[b];
    if (!first || !second) return a.localeCompare(b);
    const family = `${first.icon} - ${first.groupName}`.localeCompare(`${second.icon} - ${second.groupName}`);
    return family || second.value - first.value || a.localeCompare(b);
  });
}

function starterWeapon(shipName: string): string | null {
  if (shipName.startsWith('Cyber ')) return 'Genjuro Blaster';
  if (shipName.startsWith('Crystal ')) return 'Edge';
  if (shipName.startsWith('Organic ')) return 'Spine Hurler';
  if (shipName.startsWith('Energy ')) return 'Mining Laser';
  return null;
}
