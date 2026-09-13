import { useEffect, useMemo, useState } from 'preact/hooks';

import { contentUrl } from '../content/manifest.ts';
import { markHelpSeen, type HelpScreen, type PlayerState } from '../player/model.ts';
import { TitleScreen } from '../application/TitleScreen.tsx';
import {
  HYPERSPACE_TABS,
  raceName,
  stageState,
  tabIconStyle,
  tierName,
  validatePreflight,
  visibleConnections,
  type HyperspaceTab,
  type StageCatalog,
} from './model.ts';

const TAB_ICONS: Readonly<Record<HyperspaceTab, string>> = {
  'Galaxy Map': 'GalaxyMapTab.png',
  Weapons: 'WeaponsTab.png',
  Equipment: 'EquipmentTab.png',
  Shipyard: 'ShipyardTab.png',
  Menu: 'MenuTab.png',
};

const HELP_BY_TAB: Partial<Record<HyperspaceTab, HelpScreen>> = {
  'Galaxy Map': 'GalaxyMap',
  Weapons: 'Weapons',
  Equipment: 'Equipment',
  Shipyard: 'Shipyard',
};

const ZONE_COLORS = [
  [0.8, 0.8, 0.8],
  [1, 0, 0],
  [0, 1, 0],
  [1, 0.4, 0],
  [0, 0.4, 1],
] as const;

function stageColor(zone: number, tier: number): string {
  const [red, green, blue] = ZONE_COLORS[zone] ?? ZONE_COLORS[0];
  const fade = tier / 5;
  return `rgb(${Math.round(red * fade * 255)} ${Math.round(green * fade * 255)} ${Math.round(blue * fade * 255)})`;
}

function tabBadge(tab: HyperspaceTab, player: PlayerState): number {
  if (tab === 'Weapons') return player.newWeaponCount;
  if (tab === 'Equipment') return player.newEquipmentCount;
  if (tab === 'Shipyard') return player.newShipCount;
  return 0;
}

interface HyperspaceScreenProps {
  readonly player: PlayerState;
  readonly stages: StageCatalog;
  readonly onPlayerChange: (player: PlayerState) => void;
  readonly onLaunchStage: (stageName: string) => void;
  readonly onNewGame: () => void;
}

export function HyperspaceScreen({ player, stages, onPlayerChange, onLaunchStage, onNewGame }: HyperspaceScreenProps) {
  const [tab, setTab] = useState<HyperspaceTab>('Galaxy Map');
  const [help, setHelp] = useState<HelpScreen | null>(null);

  useEffect(() => {
    const screen = HELP_BY_TAB[tab];
    if (!screen || player.seenHelp[screen]) return;
    setHelp(screen);
    onPlayerChange(markHelpSeen(player, screen));
  }, [tab]);

  const changeTab = (next: HyperspaceTab) => {
    setHelp(null);
    setTab(next);
  };

  return (
    <section class="hyperspace-shell" aria-label="Hyperspace" data-music-track="MusicHyperspace">
      <div class="hyperspace-content">
        {tab === 'Galaxy Map' && <GalaxyMap player={player} stages={stages} onLaunchStage={onLaunchStage} />}
        {tab === 'Menu' && (
          <TitleScreen mode="menu" canContinue={false} onContinue={() => undefined} onNewGame={onNewGame} />
        )}
        {tab !== 'Galaxy Map' && tab !== 'Menu' && (
          <section class="hyperspace-placeholder" aria-label={tab}>
            <h1>{tab}</h1>
            <p>This station is not available yet.</p>
          </section>
        )}

        {HELP_BY_TAB[tab] && (
          <button class="hyperspace-help-button" type="button" aria-label={`Show ${tab} help`} onClick={() => setHelp(HELP_BY_TAB[tab] ?? null)}>
            <img src={contentUrl('textures/HelpButton.png')} alt="" />
          </button>
        )}

        {help && (
          <button class="hyperspace-help" type="button" aria-label="Close help" onClick={() => setHelp(null)}>
            <img src={contentUrl(`textures/Help.${help}.png`)} alt={`${tab} instructions`} />
          </button>
        )}
      </div>

      <nav class="hyperspace-tabs" aria-label="Hyperspace screens">
        {HYPERSPACE_TABS.map((item) => (
          <button key={item} class={item === tab ? 'hyperspace-tab hyperspace-tab-selected' : 'hyperspace-tab'} type="button" aria-label={item} aria-current={item === tab ? 'page' : undefined} onClick={() => changeTab(item)}>
            <span
              class="hyperspace-tab-icon"
              style={tabIconStyle(contentUrl(`textures/${TAB_ICONS[item]}`))}
              aria-hidden="true"
            />
            <span class="hyperspace-tab-label">{item}</span>
            {tabBadge(item, player) > 0 && <span class="hyperspace-tab-badge">{tabBadge(item, player)}</span>}
          </button>
        ))}
      </nav>
    </section>
  );
}

function GalaxyMap({ player, stages, onLaunchStage }: Pick<HyperspaceScreenProps, 'player' | 'stages' | 'onLaunchStage'>) {
  const [selected, setSelected] = useState<string | null>(null);
  const [failure, setFailure] = useState<ReturnType<typeof validatePreflight>>(null);
  const connections = useMemo(() => visibleConnections(player, stages), [player, stages]);
  const selectedStage = selected ? stages[selected] : undefined;

  const play = () => {
    if (!selected) return;
    const nextFailure = validatePreflight(player);
    if (nextFailure) {
      setFailure(nextFailure);
      return;
    }
    onLaunchStage(selected);
  };

  return (
    <section class="galaxy-map" aria-label="Galaxy map">
      <img class="galaxy-map-art" src={contentUrl('textures/GalaxyMap.png')} alt="" />
      <svg class="galaxy-connections" viewBox="0 0 480 271" aria-hidden="true">
        {connections.map(([from, to]) => {
          const start = stages[from]?.galaxyPosition;
          const end = stages[to]?.galaxyPosition;
          return start && end ? <line key={`${from}-${to}`} x1={start.x} y1={start.y} x2={end.x} y2={end.y} /> : null;
        })}
      </svg>
      {Object.entries(stages).map(([name, stage]) => {
        const state = stageState(player, name, stages);
        return (
          <button
            key={name}
            class={`galaxy-stage galaxy-stage-${state} galaxy-zone-${stage.zone}`}
            style={{
              left: `${(stage.galaxyPosition.x / 480) * 100}%`,
              top: `${(stage.galaxyPosition.y / 271) * 100}%`,
              '--stage-tier': stage.tier,
              '--zone-color': stageColor(stage.zone, stage.tier),
            } as preact.JSX.CSSProperties}
            type="button"
            aria-label={`${name}, ${state}`}
            disabled={state === 'locked'}
            onClick={() => setSelected(name)}
          />
        );
      })}
      <img
        class="galaxy-highlight"
        src={contentUrl('textures/StageHighlight.png')}
        alt=""
        style={{
          left: `${((selectedStage ?? stages[player.currentStage])?.galaxyPosition.x ?? 0) / 4.8}%`,
          top: `${((selectedStage ?? stages[player.currentStage])?.galaxyPosition.y ?? 0) / 2.71}%`,
        }}
      />

      {selected && selectedStage && (
        <section class="stage-detail" role="dialog" aria-modal="true" aria-labelledby="stage-detail-title">
          <h2 id="stage-detail-title">{selected}</h2>
          <p class={`stage-race stage-zone-${selectedStage.zone}`}>{raceName(selectedStage.zone)}</p>
          <p class="stage-tier">{tierName(selectedStage)}</p>
          <p class="stage-description">{selectedStage.description}</p>
          <div class="stage-actions">
            <button type="button" onClick={() => setSelected(null)}>Cancel</button>
            <button type="button" onClick={play}>Play</button>
          </div>
        </section>
      )}

      {failure && (
        <section class="confirmation-backdrop" role="alertdialog" aria-modal="true" aria-labelledby="preflight-title">
          <div class="confirmation-panel">
            <h2 id="preflight-title">{failure.title}</h2>
            <p>{failure.message}</p>
            <div class="confirmation-actions confirmation-actions-single">
              <button type="button" onClick={() => setFailure(null)}>OK</button>
            </div>
          </div>
        </section>
      )}
    </section>
  );
}
