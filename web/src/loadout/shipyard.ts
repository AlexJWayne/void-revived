import type { PlayerState } from '../player/model.ts';
import { availableShips, type ShipCatalog, type ShipDefinition } from './model.ts';

/** Full-strength race hues used by the galaxy map, in alphabetical display order. */
export const SHIP_RACES = [
  { key: 'Cyber', name: 'Cykan', color: '#ff0000' },
  { key: 'Energy', name: 'Lanaar', color: '#0066ff' },
  { key: 'Crystal', name: 'Orthos', color: '#00ff00' },
  { key: 'Organic', name: 'Wrethk', color: '#ff6600' },
] as const;

export type ShipRace = typeof SHIP_RACES[number];
// A single choice makes fleet and race filtering mutually exclusive.
export type ShipyardFilter = 'all' | 'owned' | ShipRace['key'];
export interface ShipyardEntry {
  readonly key: string;
  readonly ship: ShipDefinition;
}

export function shipRace(ship: ShipDefinition): ShipRace | undefined {
  return SHIP_RACES.find(race => race.key === ship.race);
}

export function shipyardCatalogue(player: PlayerState, ships: ShipCatalog): readonly ShipyardEntry[] {
  return availableShips(player, ships)
    .map(key => ({ key, ship: ships[key]! }))
    .sort((a, b) => (b.ship.powerRank ?? 0) - (a.ship.powerRank ?? 0)
      || (shipRace(a.ship)?.name ?? '').localeCompare(shipRace(b.ship)?.name ?? '')
      || a.ship.name.localeCompare(b.ship.name));
}

export function filterShipyard(catalogue: readonly ShipyardEntry[], ownedShips: readonly string[], filter: ShipyardFilter): readonly ShipyardEntry[] {
  if (filter === 'all') return catalogue;
  if (filter === 'owned') return catalogue.filter(entry => ownedShips.includes(entry.key));
  return catalogue.filter(entry => entry.ship.race === filter);
}
