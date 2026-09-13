import { Button } from './button.ts';
import { Matrix4 } from '../graphics/matrix.ts';
import type { Renderer } from '../graphics/renderer.ts';

export class Gauge extends Button {
  value = 1;

  override render(renderer: Renderer): void {
    const [x, y, width, height] = this.frame;
    const [textureX, textureY, textureWidth, textureHeight] = this.textureFrame;
    const value = Math.max(0, Math.min(1, this.value));
    const displayHeight = height * value;
    const model = new Matrix4().translate(x, y + height - displayHeight).scale(width, displayHeight, 1);
    renderer.drawQuad(this.texture, model, [textureX / 256, (textureY + textureHeight * (1 - value)) / 256,
      textureWidth / 256, textureHeight * value / 256]);
  }
}
