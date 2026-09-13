import type { JSX } from 'preact';

interface GenericButtonProps {
  readonly children: string;
  readonly class?: string;
  readonly disabled?: boolean;
  readonly onClick: JSX.MouseEventHandler<HTMLButtonElement>;
}

/** Shared title-button styling, explicitly retained for the Web Port. */
export function GenericButton({ children, class: className = '', disabled, onClick }: GenericButtonProps) {
  return <button
    class={`game-button ${className}`}
    type="button" disabled={disabled} onClick={onClick}>
    {children}
  </button>;
}
