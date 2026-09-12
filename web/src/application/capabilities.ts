export interface PlatformCapabilities {
  readonly webgl2: boolean;
  readonly landscape: boolean;
}

export type CapabilityGate =
  | { readonly kind: 'checking'; readonly title: string; readonly message: string }
  | { readonly kind: 'unsupported'; readonly title: string; readonly message: string }
  | { readonly kind: 'rotate'; readonly title: string; readonly message: string }
  | { readonly kind: 'ready' };

export function gateForCapabilities(capabilities: PlatformCapabilities): CapabilityGate {
  if (!capabilities.webgl2) {
    return {
      kind: 'unsupported',
      title: 'This device is not supported',
      message: 'The Web Port requires a browser with WebGL 2 graphics.',
    };
  }

  if (!capabilities.landscape) {
    return {
      kind: 'rotate',
      title: 'Rotate to landscape',
      message: 'The VOID is designed to be played with your phone held sideways.',
    };
  }

  return { kind: 'ready' };
}

export function detectPlatformCapabilities(canvas: HTMLCanvasElement): PlatformCapabilities {
  return {
    webgl2: canvas.getContext('webgl2') !== null,
    landscape: window.innerWidth > window.innerHeight,
  };
}
