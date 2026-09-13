import type { JSX } from 'preact';

import {
  canTravelToStage,
  type PlayerState,
  type StageGraph,
  type StageReadiness,
  stageReadiness,
} from '../player/model.ts';

export const HYPERSPACE_TABS = ['Galaxy Map', 'Weapons', 'Equipment', 'Shipyard', 'Menu'] as const;
export type HyperspaceTab = (typeof HYPERSPACE_TABS)[number];

export interface GalaxyPosition {
  readonly x: number;
  readonly y: number;
}

export interface StageDefinition {
  readonly tier: number;
  readonly zone: number;
  readonly connections: readonly string[];
  readonly description: string;
  readonly galaxyPosition: GalaxyPosition;
}

export type StageCatalog = Readonly<Record<string, StageDefinition>>;

export type StageState = 'locked' | 'reachable' | 'completed' | 'current';

export interface PreflightFailure {
  readonly title: string;
  readonly message: string;
}

export type TabIconStyle = Pick<JSX.CSSProperties, 'maskImage' | 'WebkitMaskImage'>;

export function tabIconStyle(url: string): TabIconStyle {
  const maskImage = `url("${url}")`;
  return { maskImage, WebkitMaskImage: maskImage };
}

export function stageState(player: PlayerState, stageName: string, stages: StageCatalog): StageState {
  if (stageName === player.currentStage) return 'current';
  if (player.completedStages.includes(stageName)) return 'completed';
  return canTravelToStage(player, stageName, stages as StageGraph) ? 'reachable' : 'locked';
}

export function visibleConnections(player: PlayerState, stages: StageCatalog): readonly [string, string][] {
  const completed = new Set(player.completedStages);
  const seen = new Set<string>();
  const result: [string, string][] = [];

  for (const [from, stage] of Object.entries(stages)) {
    for (const to of stage.connections) {
      if (!(to in stages) || (!completed.has(from) && !completed.has(to))) continue;
      const key = [from, to].sort().join('\0');
      if (seen.has(key)) continue;
      seen.add(key);
      result.push([from, to]);
    }
  }

  return result;
}

export function raceName(zone: number): string {
  return ['Uninhabited', 'Cykan', 'Orthos', 'Wrethk', 'Lanaar'][zone] ?? 'Unknown';
}

export function tierName(stage: StageDefinition): string {
  if (stage.zone === 0) return '';
  return ['Tutorial', 'Outer Rim', 'Inner Rim', 'Outer Core', 'Inner Core', 'Homeworld'][stage.tier] ?? '';
}

export function preflightFailure(readiness: StageReadiness): PreflightFailure | null {
  switch (readiness.kind) {
    case 'ready': return null;
    case 'no-ship': return { title: 'No Ship', message: 'Go to the shipyard to purchase your first ship.' };
    case 'no-weapons': return { title: 'No Weapons', message: 'Space is dangerous. Equip some weapons on the Weapons tab.' };
    case 'no-weapon-group': return {
      title: 'You have no weapons in any weapon group',
      message: 'On the weapons screen, use the A, B and C buttons to put some guns into at least one group.',
    };
  }
}

export function validatePreflight(player: PlayerState): PreflightFailure | null {
  return preflightFailure(stageReadiness(player));
}
