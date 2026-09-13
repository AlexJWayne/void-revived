import { useEffect, useRef, useState } from 'preact/hooks';
import type { ContentManifest } from '../content/manifest.ts';
import { Matrix4 } from '../graphics/matrix.ts';
import { Renderer } from '../graphics/renderer.ts';
import { renderShipParts } from '../combat/combat-renderer.ts';
import type { ShipDefinition } from './model.ts';

interface ShipPreviewProps {
  readonly manifest: ContentManifest;
  readonly ship: ShipDefinition;
}

/** GLShipPreview.m's fixed camera and rotating, unarmed ship. */
export function ShipPreview({ manifest, ship }: ShipPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let renderer: Renderer;
    try { renderer = new Renderer(canvas, manifest); }
    catch (error) { setError(String(error)); return; }
    renderer.lightDirection = [1, -0.5, 0.5];
    renderer.projection = Matrix4.frustum(-1.85, 1.85, -1, 1, 3.5, 50)
      .translate(0, 0, -5).rotateX(-45).scale(1 / ship.size);
    let disposed = false;
    let frame = 0;
    let lastTime: number | undefined;
    let elapsed = 0;
    let angle = 0;
    let pulsePhase = Math.random();
    const drawView = () => {
      renderer.resize();
      renderer.clear();
      renderer.depthTest(true);
      const model = new Matrix4().rotateZ(angle).scale(ship.size);
      renderShipParts(renderer, ship.model, model, pulsePhase);
    };
    const animate = (time: number) => {
      if (disposed) return;
      elapsed += Math.min(100, lastTime === undefined ? 0 : time - lastTime);
      lastTime = time;
      // The native preview advances one degree per 1/60-second timer callback.
      while (elapsed >= 1000 / 60) {
        elapsed -= 1000 / 60;
        angle -= 1;
        pulsePhase = (pulsePhase + 0.01) % 1;
      }
      drawView();
      frame = requestAnimationFrame(animate);
    };
    const requests = ship.model.flatMap((part) => [renderer.loadModel(part.modelName), renderer.loadTexture(part.texture)]);
    setError('');
    void Promise.all(requests).then(() => {
      if (!disposed) frame = requestAnimationFrame(animate);
    }).catch((error: unknown) => { if (!disposed) setError(String(error)); });
    return () => { disposed = true; cancelAnimationFrame(frame); renderer.dispose(); };
  }, [manifest, ship]);

  return <>
    <canvas ref={canvasRef} class="ship-preview" aria-label="Rotating ship preview" />
    {error && <p class="flight-message" role="alert">{error}</p>}
  </>;
}
