export interface GraphicsDevice {
  clear(): void;
  resize(): void;
  dispose(): void;
}

export function createGraphicsDevice(canvas: HTMLCanvasElement): GraphicsDevice {
  const gl = canvas.getContext('webgl2', {
    alpha: false,
    antialias: true,
    depth: true,
    powerPreference: 'high-performance',
  });

  if (!gl) {
    throw new Error('WebGL 2 became unavailable while starting the Web Port.');
  }

  let disposed = false;

  return {
    clear() {
      if (disposed) return;
      gl.clearColor(0.008, 0.012, 0.035, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    },
    resize() {
      if (disposed) return;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(canvas.clientWidth * pixelRatio));
      const height = Math.max(1, Math.round(canvas.clientHeight * pixelRatio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, width, height);
    },
    dispose() {
      disposed = true;
    },
  };
}
