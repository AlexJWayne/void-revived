import { useEffect, useRef, useState } from 'preact/hooks';

import {
  detectPlatformCapabilities,
  gateForCapabilities,
  type CapabilityGate,
} from './capabilities.ts';
import { createGraphicsDevice, type GraphicsDevice } from '../graphics/device.ts';
import { contentUrl, loadContentData, loadContentManifest } from '../content/manifest.ts';
import { createBrowserPlayerStore } from '../player/browser.ts';
import type { PlayerState } from '../player/model.ts';
import { TitleScreen } from './TitleScreen.tsx';
import { HyperspaceScreen } from '../hyperspace/HyperspaceScreen.tsx';
import type { StageCatalog } from '../hyperspace/model.ts';
import { musicForRoute, type AppRoute } from './routes.ts';

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
  const [contentError, setContentError] = useState<string>();
  const [route, setRoute] = useState<AppRoute>({ name: 'title' });
  const [player, setPlayer] = useState<PlayerState | null>(null);
  const [confirmNewGame, setConfirmNewGame] = useState(false);

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
        const [nextDefaultPlayer, nextStages] = await Promise.all([
          loadContentData(manifest, 'newPlayer'),
          loadContentData<StageCatalog>(manifest, 'stages'),
        ]);
        setDefaultPlayer(nextDefaultPlayer);
        setStages(nextStages);
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
    if (!player) return;
    updatePlayer({ ...player, currentStage: stage });
    setRoute({ name: 'combat', stage });
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

        {route.name === 'hyperspace' && player && stages && (
          <HyperspaceScreen player={player} stages={stages} onPlayerChange={updatePlayer} onLaunchStage={launchStage} onNewGame={startNewGame} />
        )}

        {route.name === 'title' && (
          <TitleScreen
            mode="title"
            canContinue={playerStoreRef.current.hasContinue()}
            onContinue={continueGame}
            onNewGame={startNewGame}
          />
        )}

        {route.name === 'combat' && (
          <section class="combat-handoff" aria-label={`Combat handoff for ${route.stage}`}>
            <p class="handoff-eyebrow">Stage selected</p>
            <h1>{route.stage}</h1>
            <p>Combat attaches at this route boundary.</p>
            <button type="button" onClick={() => setRoute({ name: 'hyperspace' })}>Return to Hyperspace</button>
          </section>
        )}

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

      {(gate.kind !== 'ready' || !defaultPlayer || !stages || contentError) && (
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
