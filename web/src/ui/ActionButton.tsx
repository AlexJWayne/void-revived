import type { JSX } from 'preact';
import './action-button.css';

interface ActionButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  readonly appearance?: 'primary' | 'muted';
}

/** A console control; callers supply content, placement, and interaction state. */
export function ActionButton({ appearance = 'primary', class: className = '', type = 'button', ...props }: ActionButtonProps) {
  return <button {...props} type={type} class={`action-button action-button-${appearance} ${className}`} />;
}
