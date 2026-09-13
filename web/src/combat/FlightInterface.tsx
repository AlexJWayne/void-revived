import { GenericButton } from '../ui/GenericButton.tsx';
import { useEffect, useRef, useState } from 'preact/hooks';
import { contentUrl, type ContentManifest } from '../content/manifest.ts';
import type { PlayerStore } from '../player/storage.ts';
import type { Game } from './game.ts';
import { captureGame } from './game-state.ts';
import { CombatRenderer } from './combat-renderer.ts';
import { BrowserSimulationLoop } from './browser-loop.ts';
import { FlightInput } from './flight-input.ts';

interface FlightInterfaceProps {
  readonly game: Game;
  readonly manifest: ContentManifest;
  readonly playerStore: PlayerStore;
  readonly restored: boolean;
  readonly onFinish: (game: Game) => void;
  readonly onLeave: () => void;
}

type FlightState = 'loading' | 'intro' | 'paused' | 'flying' | 'error';

export function FlightInterface({ game, manifest, playerStore, restored, onFinish, onLeave }: FlightInterfaceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const creditsRef = useRef<HTMLSpanElement>(null);
  const controller = useRef<{ resume: () => Promise<void>; pause: () => void; abort: () => void }>();
  const [state, setState] = useState<FlightState>('loading');
  const [message, setMessage] = useState('');
  const [requestingMotion, setRequestingMotion] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;
    let loaded = false;
    let active = false;
    let completed = false;
    let failed = false;
    let interrupted = restored;
    let fadeInFrame = restored ? 30 : 0;
    let renderer: CombatRenderer;
    try { renderer = new CombatRenderer(canvas, manifest, game); }
    catch (error) {
      setMessage(error instanceof Error ? error.message : 'Graphics could not start.');
      setState('error');
      return;
    }
    const input = new FlightInput(canvas, game);
    const reportError = (error: unknown) => {
      if (disposed) return;
      failed = true;
      setMessage(error instanceof Error ? error.message : 'Combat could not continue.');
      setState('error');
    };
    const save = () => {
      if (game.finished || completed) return;
      try { playerStore.saveCombatSnapshot(captureGame(game)); }
      catch (error) { reportError(error); }
    };
    const draw = (interpolation = 1) => {
      if (disposed || !loaded) return;
      try {
        renderer.render(interpolation);
        if (surfaceRef.current) surfaceRef.current.style.opacity = String(game.stageIsEnding ? game.alpha : fadeInFrame / 30);
        if (creditsRef.current) creditsRef.current.textContent = String(game.player.credits);
      } catch (error) { loop.stop(); input.stop(); active = false; reportError(error); }
    };
    const update = () => {
      if (!active) return;
      if (fadeInFrame < 30) fadeInFrame += 1;
      game.update();
      if (game.finished && !completed) {
        loop.stop();
        input.stop();
        active = false;
        // The caller commits successful rewards before discarding the archive.
        try { onFinish(game); completed = true; }
        catch (error) { reportError(error); }
      }
    };
    const loop = new BrowserSimulationLoop(update, draw);
    const pause = () => {
      interrupted = true;
      active = false;
      input.stop();
      loop.stop();
      if (loaded && !failed) setState('paused');
      save();
    };
    const resume = async () => {
      if (!loaded || disposed || failed || window.innerWidth <= window.innerHeight) return;
      await input.requestMotion();
      if (disposed || failed || document.hidden || window.innerWidth <= window.innerHeight) return;
      active = true;
      input.start();
      setState('flying');
      setMessage('');
      loop.start();
    };
    const abort = () => {
      if (disposed || failed) return;
      input.stop();
      game.abortStage();
      setState('flying');
      active = true;
      loop.start();
    };
    controller.current = { resume, pause, abort };
    game.onPause = pause;
    const visibility = () => { if (document.hidden) pause(); };
    const resize = () => {
      if (window.innerWidth <= window.innerHeight && active) pause();
      if (!active) draw();
    };
    const contextLost = (event: Event) => {
      event.preventDefault();
      pause();
      reportError(new Error('Graphics were interrupted. Reload to resume this stage.'));
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('pagehide', pause);
    window.addEventListener('blur', pause);
    window.addEventListener('orientationchange', pause);
    canvas.addEventListener('webglcontextlost', contextLost);
    void renderer.load().then(() => {
      if (disposed || failed) return;
      loaded = true;
      setState(interrupted ? 'paused' : 'intro');
      draw();
      if (!interrupted && !game.stage.description && input.canStart) void resume().catch(reportError);
    }).catch(reportError);
    return () => {
      disposed = true;
      loop.stop();
      input.dispose();
      observer.disconnect();
      renderer.dispose();
      controller.current = undefined;
      game.onPause = undefined;
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('pagehide', pause);
      window.removeEventListener('blur', pause);
      window.removeEventListener('orientationchange', pause);
      canvas.removeEventListener('webglcontextlost', contextLost);
    };
  }, [game, manifest, playerStore]);

  const resume = async () => {
    if (requestingMotion) return;
    setRequestingMotion(true);
    try { await controller.current?.resume(); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to start motion steering.'); }
    finally { setRequestingMotion(false); }
  };

  return (
    <section class="flight-interface" aria-label={`Flight in ${game.stageName}`}>
      <div ref={surfaceRef} class="flight-surface">
        <canvas ref={canvasRef} class="flight-canvas" aria-label="Combat view and flight controls" />
        <span ref={creditsRef} class="flight-credits">{game.player.credits}</span>
      </div>
      {state === 'paused' && (
        <div class="flight-pause" style={{ '--pause-image': `url("${contentUrl('textures/Pause.png')}")` }}
          role="button" tabIndex={0} aria-label="Resume flight" onClick={resume}
          onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') void resume(); }}>
          <h2>P A U S E D</h2>
          <p class="pause-continue">Tap anywhere to continue</p>
          <GenericButton class="pause-abandon" onClick={(event) => {
            event.stopPropagation(); controller.current?.abort();
          }}>Abandon Ship</GenericButton>
          <p class="pause-caption">Abort mission and return to hyperspace</p>
        </div>
      )}
      {state === 'loading' && <div class="flight-loading" role="status" aria-label="Loading stage">
        <img src={contentUrl('textures/Default.png')} alt="" />
        <div class="flight-loading-spinner" aria-hidden="true">
          {Array.from({ length: 12 }, (_, index) => <span key={index}
            style={{ transform: `rotate(${index * 30}deg)`, animationDelay: `${index / 12 - 1}s` }} />)}
        </div>
      </div>}
      {(state === 'intro' || state === 'error') && (
        <div class="confirmation-backdrop" role="dialog" aria-modal="true" aria-labelledby="flight-dialog-title">
          <div class="confirmation-panel">
            <h2 id="flight-dialog-title">{state === 'error' ? 'Flight interrupted' : game.stageName}</h2>
            <p>{state === 'intro' ? game.stage.description : state === 'error' ? message : ''}</p>
            <div class="confirmation-actions confirmation-actions-single">
              {state === 'intro' && <button type="button" disabled={requestingMotion} onClick={resume}>Play Now</button>}
              {state === 'error' && <button type="button" onClick={onLeave}>Return to Hyperspace</button>}
            </div>
          </div>
        </div>
      )}
      {message && state !== 'error' && <p class="flight-message" role="alert">{message}</p>}
    </section>
  );
}
