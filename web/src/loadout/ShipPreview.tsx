import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { ContentManifest } from '../content/manifest.ts';
import { Matrix4 } from '../graphics/matrix.ts';
import { Renderer } from '../graphics/renderer.ts';
import { renderShipParts } from '../combat/combat-renderer.ts';
import { StarField } from '../combat/star-field.ts';
import type { ShipDefinition } from './model.ts';

interface ShipPreviewProps {
  readonly manifest: ContentManifest;
  readonly ship: ShipDefinition;
}

/** Original ship art with the approved shipyard framing and slower showroom rotation. */
export function ShipPreview({ manifest, ship }: ShipPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const starField = useMemo(() => new StarField(), []);
  const [error, setError] = useState('');

  // Keep one context and its asset cache while browsing; release it on leaving the screen.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let renderer: Renderer;
    try { renderer = new Renderer(canvas, manifest); }
    catch (error) { setError(String(error)); return; }
    renderer.lightDirection = [1, -0.5, 0.5];
    rendererRef.current = renderer;
    return () => { rendererRef.current = null; renderer.dispose(); };
  }, [manifest]);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    let disposed = false;
    let frame = 0;
    let previousTime: number | undefined;
    let seconds = 0;
    let radius = 1;
    renderer.clear();
    setError('');

    const animate = (time: number) => {
      if (disposed) return;
      // Avoid a rotation jump when a backgrounded browser resumes.
      seconds += previousTime === undefined ? 0 : Math.min(100, time - previousTime) / 1000;
      previousTime = time;
      renderer.resize();
      const aspect = renderer.canvas.clientWidth / Math.max(1, renderer.canvas.clientHeight);
      const extent = Math.max(1.3, 1.34 / aspect);
      renderer.projection = Matrix4.frustum(-extent * aspect, extent * aspect, -extent, extent, 3.5, 50)
        .translate(0, 0, -5).rotateX(-45);
      renderer.clear();
      renderer.depthTest(false);
      starField.render(renderer);
      renderer.depthTest(true);
      renderShipParts(renderer, ship.model, new Matrix4().rotateZ(-35 - seconds * 18).scale(1 / radius), (seconds * 0.6) % 1);
      frame = requestAnimationFrame(animate);
    };

    const requests = ship.model.flatMap(part => [renderer.loadModel(part.modelName), renderer.loadTexture(part.texture)]);
    void Promise.all(requests).then(() => {
      if (disposed) return;
      // Transparent energy-field quads have large invisible margins. Fit the opaque hull.
      const hull = ship.model.filter(part => part.style === 'opaque');
      radius = Math.max(0.01, ...(hull.length ? hull : ship.model).map(part => renderer.modelRadius(part.modelName)));
      frame = requestAnimationFrame(animate);
    }).catch((error: unknown) => { if (!disposed) setError(String(error)); });

    return () => { disposed = true; cancelAnimationFrame(frame); };
  }, [manifest, ship, starField]);

  return <>
    <canvas ref={canvasRef} class="ship-preview" aria-label={`Rotating view of ${ship.name}`} />
    {error && <p class="flight-message" role="alert">{error}</p>}
  </>;
}
