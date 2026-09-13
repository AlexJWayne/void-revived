import { Matrix4 } from '../graphics/matrix.ts';
import type { Renderer } from '../graphics/renderer.ts';

export type Rectangle = readonly [x: number, y: number, width: number, height: number];

export class Button {
  readonly frame: Rectangle;
  readonly textureFrame: Rectangle;
  readonly texture: string;

  constructor(frame: Rectangle, textureFrame: Rectangle, texture = 'UIAtlas.png') {
    this.frame = frame;
    this.textureFrame = textureFrame;
    this.texture = texture;
  }

  render(renderer: Renderer): void {
    const [x, y, width, height] = this.frame;
    const [textureX, textureY, textureWidth, textureHeight] = this.textureFrame;
    const model = new Matrix4().translate(x, y).scale(width, height, 1);
    renderer.drawQuad(this.texture, model, [textureX / 256, textureY / 256, textureWidth / 256, textureHeight / 256]);
  }
}
