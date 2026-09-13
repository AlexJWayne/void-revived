import type { JSX } from 'preact';
import { useRef } from 'preact/hooks';

interface HardpointButtonProps {
  readonly label: string;
  readonly icon?: string;
  readonly selected: boolean;
  readonly disabled: boolean;
  readonly onTap: () => void;
  readonly onDragOut: () => void;
}

/** Weapons.xib and Equipment.xib connect Touch Drag Exit to dismountItem:. */
export function HardpointButton({ label, icon, selected, disabled, onTap, onDragOut }: HardpointButtonProps) {
  const pointerId = useRef<number | null>(null);
  const draggedOutside = useRef(false);

  const pointerDown: JSX.PointerEventHandler<HTMLButtonElement> = (event) => {
    if (!event.isPrimary || event.button !== 0) return;
    pointerId.current = event.pointerId;
    draggedOutside.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const pointerMoved: JSX.PointerEventHandler<HTMLButtonElement> = (event) => {
    if (event.pointerId !== pointerId.current || draggedOutside.current) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.clientX >= bounds.left && event.clientX < bounds.right
      && event.clientY >= bounds.top && event.clientY < bounds.bottom) return;

    // Pointer capture keeps tracking a finger outside the button, as UIKit did.
    draggedOutside.current = true;
    onDragOut();
  };

  return (
    <button
      class={`loadout-socket${selected ? ' loadout-socket-selected' : ''}`}
      type="button"
      disabled={disabled}
      aria-label={label}
      onPointerDown={pointerDown}
      onPointerMove={pointerMoved}
      onLostPointerCapture={() => { pointerId.current = null; }}
      onPointerCancel={() => { pointerId.current = null; draggedOutside.current = true; }}
      onClick={() => {
        // A captured drag can still produce a click on release; it is not another tap.
        if (draggedOutside.current) {
          draggedOutside.current = false;
          return;
        }
        onTap();
      }}
    >{icon && <img src={icon} alt="" />}</button>
  );
}
