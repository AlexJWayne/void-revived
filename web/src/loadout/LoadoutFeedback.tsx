import { useEffect, useMemo, useRef } from 'preact/hooks';
import { SoundEffect } from '../audio/sound-effect.ts';
import type { PlayerState } from '../player/model.ts';
import type { LoadoutFailure, PlayerActionResult } from './model.ts';

export const FAILURE_COPY: Readonly<Record<LoadoutFailure, { readonly title: string; readonly message: string }>> = {
  'no-ship': { title: 'No Ship', message: 'Go to the shipyard to purchase your first ship.' },
  'invalid-hardpoint': { title: 'Invalid Mount', message: 'That item socket is not available on this ship.' },
  'occupied-hardpoint': { title: 'Item Mount Occupied', message: 'Double tap an equipped item to clear its socket first.' },
  'item-not-owned': { title: 'Item Not Available', message: 'That item is no longer in your inventory.' },
  'unknown-item': { title: 'Unknown Item', message: 'The selected item could not be found in the game data.' },
  'not-enough-energy': { title: 'Not enough energy', message: 'Your ship does not have enough weapon energy for this item.' },
  'duplicate-equipment-group': { title: 'Duplicate Equipment Type', message: 'You may only have one item from an equipment group at a time. Dequip the installed item first.' },
  'nothing-to-buy-back': { title: 'Nothing to Buy Back', message: 'There is no previous sale to buy back.' },
  'ship-unavailable': { title: 'Ship Unavailable', message: 'That ship is not yet available.' },
  'not-enough-credits': { title: 'Not Enough Credits', message: 'You do not have enough credits to buy that ship.' },
  'ship-not-owned': { title: 'Ship Not Owned', message: 'You do not own that ship.' },
  'cannot-sell-piloted-ship': { title: 'Ship In Use', message: 'You cannot sell the ship you are currently piloting.' },
};

export type Notice = { readonly title: string; readonly message: string } | null;

export function LoadoutNotice({ title, message, onClose, confirmLabel, onConfirm }: {
  readonly title: string;
  readonly message: string;
  readonly onClose: () => void;
  readonly confirmLabel?: string;
  readonly onConfirm?: () => void;
}) {
  return (
    <section class="confirmation-backdrop loadout-notice" role="alertdialog" aria-modal="true" aria-labelledby="loadout-notice-title">
      <div class="confirmation-panel">
        <h2 id="loadout-notice-title">{title}</h2>
        <p>{message}</p>
        <div class={onConfirm ? 'confirmation-actions' : 'confirmation-actions confirmation-actions-single'}>
          <button type="button" onClick={onClose}>{onConfirm ? 'Cancel' : 'OK'}</button>
          {onConfirm && <button type="button" onClick={onConfirm}>{confirmLabel ?? 'Confirm'}</button>}
        </div>
      </div>
    </section>
  );
}

export function applyResult(
  result: PlayerActionResult,
  onPlayerChange: (player: PlayerState) => void,
  setNotice: (notice: Notice) => void,
  soundName: string,
) {
  SoundEffect.effectNamed(result.ok ? soundName : 'Error').play();
  if (result.ok) onPlayerChange(result.player);
  else setNotice(FAILURE_COPY[result.reason]);
}

/** ItemController and ShipyardController rotate three selection players for quick taps. */
export function useSelectSound(): () => void {
  const sounds = useMemo(() => Array.from({ length: 3 }, () => new SoundEffect('Select')), []);
  const index = useRef(0);
  useEffect(() => () => { for (const sound of sounds) sound.stop(); }, [sounds]);
  return () => {
    sounds[index.current]?.play();
    index.current = (index.current + 1) % sounds.length;
  };
}
