import { useEffect, useRef, useState } from 'preact/hooks';

import {
  detectPlatformCapabilities,
  gateForCapabilities,
  type CapabilityGate,
} from './capabilities.ts';
import { createGraphicsDevice, type GraphicsDevice } from '../graphics/device.ts';

const initialGate: CapabilityGate = {
  kind: 'checking',
  title: 'Preparing The VOID',
  message: 'Checking this device…',
};

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const graphicsRef = useRef<GraphicsDevice>();
  const [gate, setGate] = useState<CapabilityGate>(initialGate);

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

  return (
    <main class="safe-viewport relative h-dvh w-dvw overflow-hidden bg-slate-950 text-slate-100">
      <canvas
        ref={canvasRef}
        class="block h-full w-full touch-none"
        aria-label="The VOID game view"
      />

      {gate.kind !== 'ready' && (
        <section class="absolute inset-0 grid place-items-center bg-slate-950/95 p-8 text-center">
          <div class="max-w-md">
            <p class="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">
              The VOID
            </p>
            <h1 class="text-2xl font-semibold tracking-tight">{gate.title}</h1>
            <p class="mt-3 text-sm leading-6 text-slate-300">{gate.message}</p>
          </div>
        </section>
      )}

      {gate.kind === 'ready' && (
        <p class="pointer-events-none absolute bottom-safe left-safe text-[0.625rem] uppercase tracking-[0.24em] text-slate-500">
          Web Port foundation
        </p>
      )}
    </main>
  );
}
