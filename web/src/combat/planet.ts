import type { PlanetTemplate } from './content.ts';
import { SpaceObject } from './space-object.ts';

export class Planet extends SpaceObject {
  readonly image: string;
  readonly size: number;
  readonly gravity: number;

  constructor(template: PlanetTemplate) {
    super();
    this.position.set({ ...template.position, z: 0 });
    this.image = template.image;
    this.size = template.size;
    this.gravity = template.image.includes('Ring') ? 0 : this.size ** 1.75 * 0.0025;
  }
}
