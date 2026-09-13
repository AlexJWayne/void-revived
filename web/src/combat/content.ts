import type { StageDefinition } from '../hyperspace/model.ts';
import type { EquipmentCatalog, ShipDefinition, WeaponDefinition } from '../loadout/model.ts';
import type { PlayerShip } from '../player/model.ts';
import type { Vector3Value } from './math.ts';

export interface ShipTemplate extends ShipDefinition {
  readonly thrusterSound?: string;
  readonly explosionSound: string;
  readonly gunHardpoints: readonly Vector3Value[];
  readonly thrusterModelName: string;
  readonly thrusterTexture: string;
  readonly explosionSprite: string;
}

export interface WeaponTemplate extends WeaponDefinition {
  readonly soundsFire: readonly string[];
  readonly soundsHit: readonly string[];
  readonly fireSoundLoops: boolean;
  readonly explosionSize: number;
  readonly forceFire: number;
  readonly forceHit: number;
  readonly projectileCollisionSize: number;
  readonly projectileImage: string;
  readonly projectileIsDirectional: boolean;
  readonly projectileSize: number;
  readonly seekLockAngle: number;
  readonly seekTurnSpeed: number;
  readonly spread: number;
  readonly targetingArc: number;
  readonly hitSprite?: string;
}

export interface EnemyLoadout extends Omit<PlayerShip, 'weaponGroups'> {
  readonly aiType: 'Crate' | 'Fighter' | 'Stationary' | 'Warship';
  readonly weaponGroups?: PlayerShip['weaponGroups'];
  readonly loot: Readonly<Record<string, { readonly min?: number; readonly max?: number; readonly qty?: number; readonly chance?: number }>>;
  readonly mine?: { readonly size: number; readonly shieldDamage: number; readonly armorDamage: number };
}

export interface StageEnemy {
  readonly loadout: string;
  readonly optional: boolean;
  readonly firstTimeOnly: boolean;
  readonly position?: { readonly x: number; readonly y: number };
  readonly qty?: string;
  readonly chance?: number;
}

export interface PlanetTemplate {
  readonly image: string;
  readonly size: number;
  readonly position: { readonly x: number; readonly y: number };
}

export interface NebulaTemplate {
  readonly texture: string;
  readonly size: number;
  readonly position: { readonly x: number; readonly y: number };
  readonly opacity: number;
  readonly drag: number;
  readonly energyRegen: number;
  readonly shieldRegen: number;
  readonly armorRegen: number;
}

export interface StageTemplate extends StageDefinition {
  readonly music?: string;
  readonly hypergatePosition: { readonly x: number; readonly y: number };
  readonly enemies: readonly StageEnemy[];
  readonly planets: readonly PlanetTemplate[];
  readonly nebulas: readonly NebulaTemplate[];
}

export type PickupType = 'Money' | 'Weapon' | 'Equipment';

export interface CombatContent {
  readonly stages: Readonly<Record<string, StageTemplate>>;
  readonly shipTypes: Readonly<Record<string, ShipTemplate>>;
  readonly weapons: Readonly<Record<string, WeaponTemplate>>;
  readonly equipment: EquipmentCatalog;
  readonly enemies: Readonly<Record<string, EnemyLoadout>>;
  readonly lootTables: Readonly<Record<string, readonly { readonly name: string; readonly type: Exclude<PickupType, 'Money'> }[]>>;
}

export function requireDefinition<T>(catalog: Readonly<Record<string, T>>, name: string): T {
  const definition = catalog[name];
  if (!definition) throw new Error(`Game content not found: ${name}`);
  return definition;
}
