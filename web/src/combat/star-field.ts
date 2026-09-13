import { Vector3 } from './math.ts';
import type { Renderer } from '../graphics/renderer.ts';

export class StarField {
  readonly points: Float32Array;

  constructor(random = Math.random) {
    const points: number[] = [];
    for (let index = 0; index < 1500; index += 1) {
      const position = new Vector3();
      do {
        position.set({ x: (random() * 2 - 1) * 85, y: (random() * 2 - 1) * 85, z: (random() * 2 - 1) * 6 });
      } while (position.length() > 80);
      const brightness = Math.floor(random() * 200);
      const red = (brightness + Math.floor(random() * 55)) / 255;
      const green = (brightness + Math.floor(random() * 55)) / 255;
      const blue = (brightness + Math.floor(random() * 55)) / 255;
      const size = Math.floor(random() * 2) + 1.5;
      points.push(position.x, position.y, position.z - 6, red, green, blue, 1, size);
    }
    this.points = new Float32Array(points);
  }

  render(renderer: Renderer): void { renderer.drawPoints(this.points); }
}
