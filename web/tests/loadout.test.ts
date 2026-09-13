import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

import {
  buyBackItems,
  mountEquipment,
  mountWeapon,
  purchaseOrPilotShip,
  sellItems,
  type EquipmentCatalog,
  type ShipCatalog,
  type WeaponCatalog,
} from '../src/loadout/model.ts';
import { createPlayerState } from '../src/player/model.ts';

const content = (name: string) => new URL(`../public/content/data/${name}.json`, import.meta.url);

async function fixture() {
  const [source, weapons, equipment, ships] = await Promise.all([
    readFile(content('newPlayer'), 'utf8'),
    readFile(content('weapons'), 'utf8'),
    readFile(content('equipment'), 'utf8'),
    readFile(content('shipTypes'), 'utf8'),
  ]);
  const player = createPlayerState({
    ...JSON.parse(source),
    credits: 1_000,
    ownedShips: ['Cyber Shuttle'],
    ship: {
      type: 'Cyber Shuttle',
      guns: ['<Empty>'],
      equipment: ['<Empty>'],
      weaponGroups: [[0], [0], [0]],
    },
    inventory: { weapons: ['Genjuro Blaster'], equipment: [] },
  });
  return {
    player,
    weapons: JSON.parse(weapons) as WeaponCatalog,
    equipment: JSON.parse(equipment) as EquipmentCatalog,
    ships: JSON.parse(ships) as ShipCatalog,
  };
}

describe('loadout and economy', () => {
  it('mounts an owned weapon at a compatible empty hardpoint', async () => {
    const { player, weapons, ships } = await fixture();

    const result = mountWeapon(player, 'Genjuro Blaster', 0, weapons, ships);

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.deepEqual(result.player.ship.guns, ['Genjuro Blaster']);
    assert.deepEqual(result.player.inventory.weapons, []);
  });

  it('rejects a second item from the same equipment group', async () => {
    const { player, equipment } = await fixture();
    const names = Object.keys(equipment).filter((name) => equipment[name].groupName === 'Carapace');
    const equipped = createPlayerState({
      ...player,
      ship: { ...player.ship, equipment: [names[0], '<Empty>'] },
      inventory: { ...player.inventory, equipment: [names[1]] },
    });

    assert.deepEqual(mountEquipment(equipped, names[1], 1, equipment), {
      ok: false,
      reason: 'duplicate-equipment-group',
    });
  });

  it('round-trips one sale batch through the Original Game buyback slot', async () => {
    const { player, weapons } = await fixture();
    const sold = sellItems(player, 'weapons', [0], weapons);
    assert.equal(sold.ok, true);
    if (!sold.ok) return;
    assert.equal(sold.player.credits, 1_010);
    assert.deepEqual(sold.player.buybackWeapons, ['Genjuro Blaster']);

    const restored = buyBackItems(sold.player, 'weapons');
    assert.equal(restored.ok, true);
    if (!restored.ok) return;
    assert.equal(restored.player.credits, 1_000);
    assert.deepEqual(restored.player.inventory.weapons, ['Genjuro Blaster']);
    assert.deepEqual(restored.player.buybackWeapons, []);
  });

  it('trades owned ships for an affordable upgrade and resets its mounts', async () => {
    const { player, ships } = await fixture();
    const trader = createPlayerState({ ...player, credits: 425, completedStages: ['Discipulus Major'] });

    const result = purchaseOrPilotShip(trader, 'Cyber Light Fighter', ships, true);

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.player.ship.type, 'Cyber Light Fighter');
    assert.deepEqual(result.player.ownedShips, ['Cyber Light Fighter']);
    assert.equal(result.player.credits, 0);
    assert.deepEqual(result.player.ship.guns, ['<Empty>']);
    assert.deepEqual(result.player.ship.weaponGroups, [[0], [0], [0]]);
  });
});
