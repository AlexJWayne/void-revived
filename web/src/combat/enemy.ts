import { AIBase, type AISnapshot } from './ai-base.ts';
import { AICrate } from './ai-crate.ts';
import { AIFighter } from './ai-fighter.ts';
import { AIStationary } from './ai-stationary.ts';
import { AIWarship } from './ai-warship.ts';
import { requireDefinition, type EnemyLoadout } from './content.ts';
import type { Game } from './game.ts';
import { Pickup } from './pickup.ts';
import { Projectile } from './projectile.ts';
import { Ship, type ShipDamageResult, type ShipSnapshot } from './ship.ts';

export interface EnemySnapshot extends ShipSnapshot {
  readonly loadoutName: string;
  readonly optional: boolean;
  readonly ai: AISnapshot;
}

export class Enemy extends Ship {
  readonly loadoutName: string;
  readonly enemyLoadout: EnemyLoadout;
  readonly ai: AIBase;
  optional = false;

  constructor(loadoutName: string, game: Game, snapshot?: EnemySnapshot) {
    const loadout = requireDefinition(game.content.enemies, loadoutName);
    const shipSnapshot = snapshot ?? Ship.snapshotForLoadout(game.content, game.nextIdentifier++, {
      ...loadout, weaponGroups: loadout.weaponGroups ?? [[], [], []],
    });
    super(shipSnapshot, game);
    this.loadoutName = loadoutName;
    this.enemyLoadout = loadout;
    const AI = { Crate: AICrate, Fighter: AIFighter, Stationary: AIStationary, Warship: AIWarship }[loadout.aiType];
    if (!AI) throw new Error(`Unknown AI type: ${loadout.aiType}`);
    this.ai = new AI(this, game.ship, game.random);
    if (snapshot) {
      this.optional = snapshot.optional;
      Object.assign(this.ai, snapshot.ai);
    }
  }

  override update(): void {
    this.ai.update();
    if (this.ai.noticedPlayer || this.velocity.length() > 0 || this.acceleration.length() > 0) {
      super.update();
    } else {
      if (this.ai instanceof AICrate) this.updateAngle();
      this.updateEnergy();
      this.updateShields();
      this.updateGuns();
    }
    const mine = this.enemyLoadout.mine;
    if (this.game && mine && mine.size > 0 && this.game.ship.position.distance2D(this.position) < mine.size) {
      this.damage(1_000_000, 1_000_000);
      this.game.projectiles.push(new Projectile({
        ...super.toSnapshot(), id: this.game.nextIdentifier++, ownerId: this.id,
        definition: { lifetime: 0, shieldDamage: mine.shieldDamage, armorDamage: mine.armorDamage,
          hitForce: 0, size: 0, collisionSize: 0, explosionSize: mine.size, seekLockAngle: 0, seekTurnSpeed: 0 },
        potentialTargetIds: [], seekTargetId: null, age: 0, expired: false,
        hitSprite: requireDefinition(this.game.content.shipTypes, this.type).explosionSprite,
      }, this.game));
    }
  }

  spawnLoot(): void {
    const game = this.game!;
    for (const [name, roll] of Object.entries(this.enemyLoadout.loot)) {
      if (name === 'credits') {
        const minimum = roll.min ?? 0;
        const quantity = Math.floor(game.random() * ((roll.max ?? 0) - minimum + 1)) + minimum;
        for (let index = 0; index < quantity; index += 1) this.spawnPickup(new Pickup('Money', null, game));
      } else {
        for (let index = 0; index < (roll.qty || 1); index += 1) {
          if (game.random() >= (roll.chance ?? 0)) continue;
          const table = requireDefinition(game.content.lootTables, name);
          const item = table[Math.floor(game.random() * table.length)];
          if (!item) throw new Error(`Empty loot table: ${name}`);
          this.spawnPickup(new Pickup(item.type, item.name, game));
        }
      }
    }
  }

  private spawnPickup(pickup: Pickup): void {
    pickup.position.set(this.position);
    this.game!.pickups.push(pickup);
  }

  override damage(shieldAmount: number, armorAmount: number): ShipDamageResult {
    const result = super.damage(shieldAmount, armorAmount);
    this.ai.tookDamage();
    return result;
  }

  override toSnapshot(): EnemySnapshot {
    return { ...super.toSnapshot(), loadoutName: this.loadoutName, optional: this.optional, ai: this.ai.toSnapshot() };
  }
}
