import { useEffect, useRef, useState } from 'preact/hooks';

import {
  detectPlatformCapabilities,
  gateForCapabilities,
  type CapabilityGate,
} from './capabilities.ts';
import { createGraphicsDevice, type GraphicsDevice } from '../graphics/device.ts';
import { contentUrl, loadContentData, loadContentManifest, type ContentManifest } from '../content/manifest.ts';
import { createBrowserPlayerStore } from '../player/browser.ts';
import type { PlayerState } from '../player/model.ts';
import { TitleScreen } from './TitleScreen.tsx';
import { HyperspaceScreen } from '../hyperspace/HyperspaceScreen.tsx';
import type { StageCatalog } from '../hyperspace/model.ts';
import type { EquipmentCatalog, ShipCatalog, WeaponCatalog } from '../loadout/model.ts';
import { musicForRoute, type AppRoute } from './routes.ts';
import { Game, type StageStats } from '../combat/game.ts';
import type { CombatContent } from '../combat/content.ts';
import { restoreGame } from '../combat/game-state.ts';
import { FlightInterface } from '../combat/FlightInterface.tsx';
import { StageSummary } from '../combat/StageSummary.tsx';
import { createBrowserSettingsStore } from './settings.ts';

const initialGate: CapabilityGate = {
  kind: 'checking',
  title: 'Preparing The VOID',
  message: 'Checking this device…',
};

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const graphicsRef = useRef<GraphicsDevice>();
  const playerStoreRef = useRef(createBrowserPlayerStore());
  const [gate, setGate] = useState<CapabilityGate>(initialGate);
  const [defaultPlayer, setDefaultPlayer] = useState<unknown>();
  const [stages, setStages] = useState<StageCatalog>();
  const [weapons, setWeapons] = useState<WeaponCatalog>();
  const [equipment, setEquipment] = useState<EquipmentCatalog>();
  const [ships, setShips] = useState<ShipCatalog>();
  const [manifest, setManifest] = useState<ContentManifest>();
  const [contentError, setContentError] = useState<string>();
  const [route, setRoute] = useState<AppRoute>({ name: 'title' });
  const [player, setPlayer] = useState<PlayerState | null>(null);
  const [confirmNewGame, setConfirmNewGame] = useState(false);
  const [combatContent, setCombatContent] = useState<CombatContent>();
  const [game, setGame] = useState<Game>();
  const [restoredCombat, setRestoredCombat] = useState(false);
  const [stageSummary, setStageSummary] = useState<StageStats>();
  const [combatError, setCombatError] = useState<string>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateGate = () => {
      const capabilities = detectPlatformCapabilities(canvas);
      setGate(gateForCapabilities(capabilities));

      if (capabilities.webgl2 && !graphicsRef.current) {
        graphicsRef.current = createGraphicsDevice(canvas);
      }

      graphicsRef.current?.resize();
      graphicsRef.current?.clear();
    };

    const resizeObserver = new ResizeObserver(updateGate);
    resizeObserver.observe(canvas);
    window.addEventListener('orientationchange', updateGate);
    window.visualViewport?.addEventListener('resize', updateGate);
    updateGate();

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('orientationchange', updateGate);
      window.visualViewport?.removeEventListener('resize', updateGate);
      graphicsRef.current?.dispose();
      graphicsRef.current = undefined;
    };
  }, []);

  useEffect(() => {
    loadContentManifest()
      .then(async (manifest) => {
        const [nextDefaultPlayer, nextStages, nextWeapons, nextEquipment, nextShips, nextEnemies, nextLootTables] = await Promise.all([
          loadContentData(manifest, 'newPlayer'),
          loadContentData<CombatContent['stages']>(manifest, 'stages'),
          loadContentData<CombatContent['weapons']>(manifest, 'weapons'),
          loadContentData<EquipmentCatalog>(manifest, 'equipment'),
          loadContentData<CombatContent['shipTypes']>(manifest, 'shipTypes'),
          loadContentData<CombatContent['enemies']>(manifest, 'enemies'),
          loadContentData<CombatContent['lootTables']>(manifest, 'lootTables'),
        ]);
        setManifest(manifest);
        setDefaultPlayer(nextDefaultPlayer);
        setStages(nextStages);
        setWeapons(nextWeapons);
        setEquipment(nextEquipment);
        setShips(nextShips);
        const content: CombatContent = { stages: nextStages, weapons: nextWeapons, equipment: nextEquipment,
          shipTypes: nextShips, enemies: nextEnemies, lootTables: nextLootTables };
        setCombatContent(content);
        try {
          const restored = playerStoreRef.current.takeCombatSnapshot((snapshot) =>
            restoreGame(content, snapshot, Math.random, createBrowserSettingsStore().load()));
          if (restored) {
            setPlayer(restored.originalPlayer);
            setGame(restored);
            setRestoredCombat(true);
            setRoute({ name: 'combat', stage: restored.stageName });
          }
        } catch {
          setCombatError('The interrupted stage could not be restored. Your saved campaign is still available.');
        }
      })
      .catch((error: unknown) => {
        setContentError(error instanceof Error ? error.message : 'Unable to load game content');
      });
  }, []);

  const enterHyperspace = (nextPlayer: PlayerState) => {
    setPlayer(nextPlayer);
    setRoute({ name: 'hyperspace' });
  };

  const continueGame = () => {
    const savedPlayer = playerStoreRef.current.continueGame();
    if (savedPlayer) enterHyperspace(savedPlayer);
  };

  const startNewGame = () => {
    if (!defaultPlayer) return;
    if (playerStoreRef.current.hasContinue() && !confirmNewGame) {
      setConfirmNewGame(true);
      return;
    }
    playerStoreRef.current.deletePlayer();
    enterHyperspace(playerStoreRef.current.startNewGame(defaultPlayer));
    setConfirmNewGame(false);
  };

  const updatePlayer = (nextPlayer: PlayerState) => {
    playerStoreRef.current.save(nextPlayer);
    setPlayer(nextPlayer);
  };

  const launchStage = (stage: string) => {
    if (!player || !combatContent) return;
    try {
      const nextPlayer = { ...player, currentStage: stage };
      const nextGame = new Game(combatContent, nextPlayer, Math.random, createBrowserSettingsStore().load());
      updatePlayer(nextPlayer);
      setGame(nextGame);
      setRestoredCombat(false);
      setRoute({ name: 'combat', stage });
    } catch (error) {
      setCombatError(error instanceof Error ? error.message : 'Unable to start this stage.');
    }
  };

  const finishCombat = (finishedGame: Game) => {
    const nextPlayer = finishedGame.completedPlayer();
    updatePlayer(nextPlayer);
    playerStoreRef.current.discardCombatSnapshot();
    if (finishedGame.ship.currentArmor > 0) setStageSummary(finishedGame.stats);
    setGame(undefined);
    setRoute({ name: 'hyperspace' });
  };

  const leaveCombat = () => {
    playerStoreRef.current.discardCombatSnapshot();
    setGame(undefined);
    setRoute({ name: 'hyperspace' });
  };
  const frameStyle = {
    '--instructions-background': `url("${contentUrl('textures/Instructions.Background.png')}")`,
    '--level-track': `url("${contentUrl('textures/LevelTrack.png')}")`,
    '--level-thumb': `url("${contentUrl('textures/LevelThumb.png')}")`,
  } as preact.JSX.CSSProperties;

  return (
    <main class="safe-viewport app-shell">
      <div class="game-frame" style={frameStyle} data-music-track={musicForRoute(route) ?? undefined}>
        <canvas ref={canvasRef} class="game-canvas" aria-label="The VOID game view" />

        {route.name === 'hyperspace' && player && stages && weapons && equipment && ships && manifest && (
          <HyperspaceScreen
            player={player}
            stages={stages}
            weapons={weapons}
            equipment={equipment}
            ships={ships}
            manifest={manifest}
            onPlayerChange={updatePlayer}
            onLaunchStage={launchStage}
            onNewGame={startNewGame}
          />
        )}

        {route.name === 'title' && (
          <TitleScreen
            mode="title"
            canContinue={playerStoreRef.current.hasContinue()}
            onContinue={continueGame}
            onNewGame={startNewGame}
          />
        )}

        {route.name === 'combat' && game && manifest && (
          <FlightInterface game={game} manifest={manifest} playerStore={playerStoreRef.current}
            restored={restoredCombat} onFinish={finishCombat} onLeave={leaveCombat} />
        )}

        {stageSummary && player && combatContent && <StageSummary stats={stageSummary} player={player}
          content={combatContent} onDismiss={() => setStageSummary(undefined)} />}

        {combatError && <section class="confirmation-backdrop" role="alertdialog" aria-modal="true" aria-label="Flight unavailable">
          <div class="confirmation-panel"><h2>Flight unavailable</h2><p>{combatError}</p>
            <button type="button" onClick={() => {
              playerStoreRef.current.discardCombatSnapshot();
              setCombatError(undefined);
              continueGame();
            }}>Continue from Hyperspace</button>
          </div>
        </section>}

        {confirmNewGame && (
          <section class="confirmation-backdrop" role="alertdialog" aria-modal="true" aria-labelledby="new-game-title">
            <div class="confirmation-panel">
              <h2 id="new-game-title">Existing Game Data!</h2>
              <p>Starting a new game will erase your current game, and you will start over. Are you sure you want to do this?</p>
              <div class="confirmation-actions">
                <button type="button" onClick={() => setConfirmNewGame(false)}>Cancel</button>
                <button type="button" onClick={startNewGame}>New Game</button>
              </div>
            </div>
          </section>
        )}
      </div>

      {(gate.kind !== 'ready' || !defaultPlayer || !stages || !weapons || !equipment || !ships || !manifest || contentError) && (
        <section class="absolute inset-0 grid place-items-center bg-slate-950/95 p-8 text-center">
          <div class="max-w-md">
            <p class="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">
              The VOID
            </p>
            <h1 class="text-2xl font-semibold tracking-tight">
              {contentError ? 'Game content unavailable' : gate.kind === 'ready' ? 'Loading The VOID' : gate.title}
            </h1>
            <p class="mt-3 text-sm leading-6 text-slate-300">
              {contentError ?? (gate.kind === 'ready' ? 'Preparing the Original Game…' : gate.message)}
            </p>
          </div>
        </section>
      )}
    </main>
  );
}
