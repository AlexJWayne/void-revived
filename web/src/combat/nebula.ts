import type { NebulaTemplate } from './content.ts';
import { SpaceObject } from './space-object.ts';

export class Nebula extends SpaceObject {
  readonly template: NebulaTemplate;
  readonly size: number;

  constructor(template: NebulaTemplate, random: () => number) {
    super();
    this.template = template;
    this.position.set({ ...template.position, z: 0 });
    this.size = template.size * 1.1;
    this.angle = Math.floor(random() * 360);
  }

  override update(): void { this.angle += 0.25; }
}
