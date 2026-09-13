import { useEffect, useMemo, useRef, useState } from 'preact/hooks';

import { Accelerometer } from './accelerometer.ts';
import { GenericButton } from '../ui/GenericButton.tsx';

import { contentUrl } from '../content/manifest.ts';
import {
  createBrowserSettingsStore,
  type GameSettings,
} from './settings.ts';

const TITLE_BACKGROUNDS = ['Cyber', 'Organic', 'Crystal', 'Energy'] as const;
const INSTRUCTION_PAGES = Array.from({ length: 6 }, (_, index) => index + 1);

export type UtilityScreen = 'instructions' | 'settings' | 'credits';

interface TitleScreenProps {
  readonly mode: 'title' | 'menu';
  readonly canContinue: boolean;
  readonly onContinue: () => void;
  readonly onNewGame: () => void;
}

export function TitleScreen({ mode, canContinue, onContinue, onNewGame }: TitleScreenProps) {
  const [utility, setUtility] = useState<UtilityScreen | null>(null);
  const background = useMemo(
    () => TITLE_BACKGROUNDS[Math.floor(Math.random() * TITLE_BACKGROUNDS.length)],
    [],
  );

  return (
    <section
      class="title-screen"
      style={{ backgroundImage: `url(${contentUrl(`textures/Title.${background}.png`)})` }}
      aria-label={mode === 'title' ? 'The VOID title menu' : 'The VOID game menu'}
    >
      {mode === 'title' && (
        <GenericButton class="title-continue" disabled={!canContinue} onClick={onContinue}>
          Continue
        </GenericButton>
      )}
      <GenericButton class="title-new-game" onClick={onNewGame}>New Game</GenericButton>
      <GenericButton class="title-instructions" onClick={() => setUtility('instructions')}>
        Instructions
      </GenericButton>
      <GenericButton class="title-credits" onClick={() => setUtility('credits')}>Credits</GenericButton>
      <GenericButton class="title-settings" onClick={() => setUtility('settings')}>Settings</GenericButton>

      {utility === 'instructions' && <InstructionsScreen onClose={() => setUtility(null)} />}
      {utility === 'settings' && <SettingsScreen onClose={() => setUtility(null)} />}
      {utility === 'credits' && <CreditsScreen onClose={() => setUtility(null)} />}
    </section>
  );
}

function InstructionsScreen({ onClose }: { readonly onClose: () => void }) {
  const pagesRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);

  const updatePage = () => {
    const pages = pagesRef.current;
    if (!pages) return;
    setPage(Math.round(pages.scrollLeft / pages.clientWidth));
  };

  return (
    <UtilityOverlay label="Instructions">
      <div
        ref={pagesRef}
        class="instruction-pages"
        onScroll={updatePage}
        aria-label="Instructions pages"
      >
        {INSTRUCTION_PAGES.map((number) => (
          <img
            class="instruction-page"
            src={contentUrl(`textures/Instructions${number}.png`)}
            alt={`Instructions page ${number} of ${INSTRUCTION_PAGES.length}`}
          />
        ))}
      </div>
      <GenericButton class="utility-back" onClick={onClose}>Back</GenericButton>
      <div class="page-control" aria-label={`Page ${page + 1} of ${INSTRUCTION_PAGES.length}`}>
        {INSTRUCTION_PAGES.map((_, index) => (
          <span class={index === page ? 'page-dot page-dot-current' : 'page-dot'} aria-hidden="true" />
        ))}
      </div>
    </UtilityOverlay>
  );
}

function SettingsScreen({ onClose }: { readonly onClose: () => void }) {
  const store = useMemo(() => createBrowserSettingsStore(), []);
  const [settings, setSettings] = useState<GameSettings>(() => store.load());
  const [tilt, setTilt] = useState(0);

  const accelerometer = useRef<Accelerometer>();
  const currentSettings = useRef(settings);
  currentSettings.current = settings;
  useEffect(() => {
    let lastTilt = 0;
    const sensor = new Accelerometer((y) => {
      const settings = currentSettings.current;
      let currentTilt = Math.max(-1, Math.min(1, y * settings.turnSensitivity));
      currentTilt = Math.abs(currentTilt) < 0.2 ? 0 : (currentTilt - Math.sign(currentTilt) * 0.2) / 0.8;
      if (settings.invertSteering) currentTilt = -currentTilt;
      lastTilt = lastTilt * 0.8 + currentTilt * 0.2;
      setTilt(lastTilt);
    });
    accelerometer.current = sensor;
    return () => { sensor.dispose(); accelerometer.current = undefined; };
  }, []);

  const update = (next: GameSettings) => setSettings(store.save(next));

  return (
    <UtilityOverlay label="Settings" dim>
      <label class="settings-label music-label" for="music-volume">Music Volume</label>
      <input
        id="music-volume"
        class="void-slider music-slider"
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={settings.musicVolume}
        onInput={(event) => update({ ...settings, musicVolume: Number(event.currentTarget.value) })}
      />

      <button
        class="steering-indicator"
        type="button"
        aria-label="Enable steering tilt preview"
        onClick={() => { void accelerometer.current?.requestPermission().catch(() => setTilt(0)); }}
      >
        <img
          src={contentUrl('textures/ShipyardTab.png')}
          alt=""
          style={{ transform: `rotate(${(-tilt * Math.PI) / 4}rad)` }}
        />
      </button>

      <label class="settings-label sensitivity-label" for="turn-sensitivity">Turn Sensitivity</label>
      <input
        id="turn-sensitivity"
        class="void-slider sensitivity-slider"
        type="range"
        min="2"
        max="10"
        step="0.1"
        value={settings.turnSensitivity}
        onInput={(event) => update({ ...settings, turnSensitivity: Number(event.currentTarget.value) })}
      />

      <span class="invert-label" id="invert-steering-label">Invert Tilt Steering</span>
      <button
        id="invert-steering"
        class="void-switch"
        type="button"
        role="switch"
        aria-labelledby="invert-steering-label"
        aria-checked={settings.invertSteering}
        onClick={() => update({ ...settings, invertSteering: !settings.invertSteering })}
      >
        <span />
      </button>

      <GenericButton class="settings-done" onClick={onClose}>Done</GenericButton>
    </UtilityOverlay>
  );
}

function CreditsScreen({ onClose }: { readonly onClose: () => void }) {
  return (
    <UtilityOverlay label="Credits" dim>
      <img class="credits-art" src={contentUrl('textures/Credits.png')} alt="The VOID credits" />
      <GenericButton class="credits-done" onClick={onClose}>Done</GenericButton>
    </UtilityOverlay>
  );
}

function UtilityOverlay({
  children,
  dim = false,
  label,
}: {
  readonly children: preact.ComponentChildren;
  readonly dim?: boolean;
  readonly label: string;
}) {
  return (
    <section class={dim ? 'utility-overlay utility-overlay-dim' : 'utility-overlay'} aria-label={label}>
      {children}
    </section>
  );
}
