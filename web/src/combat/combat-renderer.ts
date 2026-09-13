import type { ContentManifest } from '../content/manifest.ts';
import type { ShipModelPart } from '../loadout/model.ts';
import { Matrix4 } from '../graphics/matrix.ts';
import { Renderer, type TextureFrame } from '../graphics/renderer.ts';
import { requireDefinition } from './content.ts';
import type { Game } from './game.ts';
import type { Ship } from './ship.ts';
import type { Vector3Value } from './math.ts';
import type { Particle } from './particle.ts';
import { StarField } from './star-field.ts';

export class CombatRenderer {
  readonly renderer: Renderer;
  readonly game: Game;
  readonly starField = new StarField();

  constructor(canvas: HTMLCanvasElement, manifest: ContentManifest, game: Game) {
    this.renderer = new Renderer(canvas, manifest);
    this.game = game;
  }

  async load(): Promise<void> {
    const { renderer, game } = this;
    const requests: Promise<void>[] = [];
    const textures = new Set(['UIAtlas.png', 'StageClear.png', 'White.png', 'ShieldBubble.png', 'Projectiles.png',
      'Hypergate1.png', 'Hypergate2.png', 'PickupMoney.png', 'PickupWeapon.png', 'PickupEquipment.png', 'Hit.png', 'Explosion.png']);
    for (const ship of game.targets) {
      const template = requireDefinition(game.content.shipTypes, ship.type);
      for (const part of template.model) {
        requests.push(renderer.loadModel(part.modelName));
        textures.add(part.texture);
      }
      if (template.thrusterModelName) {
        requests.push(renderer.loadModel(template.thrusterModelName));
        textures.add(template.thrusterTexture);
      }
      textures.add(template.explosionSprite);
      for (const gun of ship.guns) if (gun?.template.hitSprite !== undefined) textures.add(gun.template.hitSprite);
    }
    for (const planet of game.planets) textures.add(planet.image);
    for (const nebula of game.nebulas) textures.add(nebula.template.texture);
    for (const explosion of game.explosions) textures.add(explosion.imageName);
    for (const projectile of game.projectiles) if (projectile.template?.hitSprite !== undefined) textures.add(projectile.template.hitSprite);
    for (const texture of textures) requests.push(renderer.loadTexture(texture));
    await Promise.all(requests);
  }

  render(): void {
    const { renderer, game } = this;
    renderer.resize();
    const flash = game.canBeCompleted ? 1 - game.completionFlash / 60 : 0;
    renderer.clear(0.4 * flash, 0, 0.2 * flash);
    renderer.depthTest(false);
    renderer.projection = combatCamera(game.cameraPosition, game.angle);
    this.starField.render(renderer);
    this.renderPlanets();
    this.renderHypergate();
    this.renderProjectiles();
    this.renderBeams();
    for (const enemy of game.enemies) if (game.cameraPosition.distance2D(enemy.position) < 20) this.renderShip(enemy);
    if (game.ship.currentArmor > 0) this.renderShip(game.ship);
    this.renderPickups();
    this.renderExplosions();
    this.renderNebulas();
    game.flightUI.render(renderer);
  }

  private renderPlanets(): void {
    for (const planet of this.game.planets) {
      const model = new Matrix4().translate(planet.position.x, planet.position.y, planet.position.z)
        .rotateZ(this.game.angle).rotateX(25).rotateZ(-this.game.angle).scale(planet.size).translate(-0.5, -0.5);
      this.renderer.drawQuad(planet.image, model, [1, 0, -1, 1]);
    }
  }

  private renderHypergate(): void {
    const gate = this.game.hypergate;
    this.renderParticles(gate.particles);
    const [size1, size2] = gate.layerSizes(this.game.canBeCompleted);
    this.renderer.drawQuad('Hypergate1.png', spriteMatrix(gate.position, gate.angle, size1), [1, 0, -1, 1]);
    this.renderer.drawQuad('Hypergate2.png', spriteMatrix(gate.position, gate.angle + gate.angle2, size2),
      [1, 0, -1, 1], [1, 1, 1, 1], 'light');
  }

  private renderShip(ship: Ship): void {
    const template = requireDefinition(this.game.content.shipTypes, ship.type);
    const model = new Matrix4().translate(ship.position.x, ship.position.y, ship.position.z)
      .rotateZ(ship.angle).rotateY(ship.bankAngle).scale(ship.definition.size);
    this.renderer.depthTest(true);
    renderShipParts(this.renderer, template.model, model, (ship.pulsePhase + this.game.tick * 0.01) % 1);
    if (ship.thrusterAlpha > 0 && template.thrusterModelName) {
      this.renderer.drawModel(template.thrusterModelName, template.thrusterTexture, model, false, ship.thrusterAlpha);
    }
    this.renderer.depthTest(false);
    if (ship.shieldBubbleAlpha > 0) {
      const ratio = ship.currentShields / ship.definition.shields;
      this.renderer.drawQuad('ShieldBubble.png', model.scale(4).translate(-0.5, -0.5),
        [1, 1, -1, -1], [1, ratio, ratio, ship.shieldBubbleAlpha]);
    }
  }

  private renderProjectiles(): void {
    for (const projectile of this.game.projectiles) {
      if (!projectile.template) continue;
      const progress = projectile.age / projectile.definition.lifetime;
      const alpha = projectile.definition.explosionSize === 0 && progress > 0.5 ? 2 * (1 - progress) : 1;
      const [x, y] = projectile.template.projectileImage.split(',').map(Number);
      const frame: TextureFrame = [((x ?? 0) + 1) / 4, ((y ?? 0) + 1) / 4, -0.25, -0.25];
      this.renderer.drawQuad('Projectiles.png', spriteMatrix(projectile.position, projectile.angle, projectile.definition.size), frame, [1, 1, 1, alpha]);
    }
  }

  private renderBeams(): void {
    for (const beam of this.game.beams) {
      const alpha = Math.max(0, 1 - beam.age / beam.template.lifetime);
      const width = beam.template.projectileSize * (1 + 0.8 * (1 - alpha));
      const [x = 0, y = 0] = beam.template.projectileImage.split(',').map(Number);
      const model = new Matrix4().translate(beam.position.x, beam.position.y, beam.position.z)
        .rotateZ(beam.angle).scale(width, beam.length, 1).translate(-0.5, 0);
      this.renderer.drawQuad('Projectiles.png', model,
        [(x + 1) / 4, (y + 1) / 4, -0.25, -0.25 * beam.length / beam.template.beamRange], [1, 1, 1, alpha]);
    }
  }

  private renderPickups(): void {
    for (const pickup of this.game.pickups) {
      const progress = pickup.animationCounter / 10;
      // Pickup.m calculates growth before incrementing the animation counter.
      const size = pickup.size * (1 + Math.max(0, pickup.animationCounter - 1) / 10);
      this.renderer.drawQuad(`Pickup${pickup.type}.png`, spriteMatrix(pickup.position, pickup.angle, size),
        [1, 0, -1, 1], [1, 1, 1, 1 - progress]);
    }
  }

  private renderExplosions(): void {
    for (const explosion of this.game.explosions) {
      this.renderParticles(explosion.particles);
      const progress = explosion.age / explosion.lifetime;
      const currentSize = explosion.size + 2 * explosion.size * (1 - (1 - progress) ** 2);
      const model = spriteMatrix(explosion.position, explosion.angle, currentSize);
      const imagesAcross = Math.sqrt(explosion.animationFrames);
      const span = 1 / imagesAcross;
      const frame1 = Math.floor(progress * explosion.animationFrames);
      const fraction = progress * explosion.animationFrames - frame1;
      const drawFrame = (frame: number, alpha: number): void => {
        const x = frame % imagesAcross / imagesAcross;
        const y = Math.floor(frame / imagesAcross) / imagesAcross;
        this.renderer.drawQuad(explosion.imageName, model, [x + span, y, -span, span], [1, 1, 1, alpha]);
      };
      drawFrame(frame1, 1 - fraction ** 2);
      if (frame1 + 1 <= 15) drawFrame(frame1 + 1, 1 - (fraction - 1) ** 2);
    }
  }

  private renderNebulas(): void {
    for (const nebula of this.game.nebulas) {
      const model = new Matrix4().translate(nebula.position.x, nebula.position.y).rotateZ(nebula.angle).scale(nebula.size);
      const tint = [1, 1, 1, nebula.template.opacity * 0.75] as const;
      const first = new Matrix4(Array.from(model.values)).translate(-0.5, -0.5);
      this.renderer.drawQuad(nebula.template.texture, first, [1, 0, -1, 1], tint);
      const scale = Math.sin(nebula.angle * Math.PI / 180 * 4) / 6 + 0.8;
      model.rotateZ(-nebula.angle * 1.5).scale(scale).translate(-0.5, -0.5);
      this.renderer.drawQuad(nebula.template.texture, model, [1, 0, -1, 1], tint);
    }
  }

  private renderParticles(particles: readonly Particle[]): void {
    const points: number[] = [];
    for (const particle of particles) points.push(particle.position.x, particle.position.y, particle.position.z,
      ...particle.color, particle.alpha, particle.size);
    this.renderer.drawPoints(points);
  }

  dispose(): void { this.renderer.dispose(); }
}

export function combatCamera(position: Vector3Value, angle: number): Matrix4 {
  const height = Math.max(8, Math.min(40, position.z));
  const extraTiltPortion = 1 - (height - 8) / 32;
  const tilt = 25 + extraTiltPortion * 10;
  return Matrix4.frustum(-1.5, 1.5, -1, 1, 4, 200)
    .translate(0, -0.08 * height, -height).rotateX(-tilt).rotateZ(-angle).translate(-position.x, -position.y);
}

export function renderShipParts(renderer: Renderer, parts: readonly ShipModelPart[], model: Matrix4, pulsePhase: number): void {
  for (const part of parts) {
    if (!['opaque', 'add', 'pulse'].includes(part.style)) throw new Error(`Invalid model blending mode: ${part.style}`);
    renderer.drawModel(part.modelName, part.texture, model, part.style === 'opaque',
      part.style === 'pulse' ? 1 - pulsePhase : 1, part.style === 'add' ? 'add' : 'alpha');
  }
}

function spriteMatrix(position: Vector3Value, angle: number, size: number): Matrix4 {
  return new Matrix4().translate(position.x, position.y, position.z).rotateZ(angle).scale(size).translate(-0.5, -0.5);
}
