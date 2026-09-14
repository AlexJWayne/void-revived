import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';
import { createPlayerState } from '../src/player/model.ts';
import { purchaseOrPilotShip, sellShip, type ShipCatalog } from '../src/loadout/model.ts';
import { filterShipyard, shipyardCatalogue } from '../src/loadout/shipyard.ts';
import { parseVmdl, vmdlRadius } from '../src/assets/vmdl.ts';

const content = async (name: string) => JSON.parse(await readFile(new URL(`../public/content/data/${name}.json`, import.meta.url), 'utf8'));
async function fixture() {
  return { player: createPlayerState(await content('newPlayer')), ships: await content('shipTypes') as ShipCatalog };
}

describe('shipyard catalogue and transactions', () => {
  it('offers the four starting shuttles in display-race order without unlocking other ships', async () => {
    const { player, ships } = await fixture();
    const catalogue = shipyardCatalogue(player, ships);
    assert.deepEqual(catalogue.map(entry => entry.key), ['Cyber Shuttle', 'Energy Shuttle', 'Crystal Shuttle', 'Organic Shuttle']);
    for (const race of ['Cyber', 'Energy', 'Crystal', 'Organic'] as const) {
      assert.equal(filterShipyard(catalogue, player.ownedShips, race).length, 1);
    }
  });

  it('sorts ranks highest first and races alphabetically even when price order differs', async () => {
    const { player, ships } = await fixture();
    const catalogue = shipyardCatalogue(createPlayerState({ ...player, completedStages: Object.keys(await content('stages')) }), {
      ...ships,
      'Cyber Shuttle': { ...ships['Cyber Shuttle']!, price: 999_999 },
    });
    assert.equal(catalogue.length, 32);
    assert.deepEqual(catalogue.slice(0, 4).map(entry => [entry.ship.powerRank, entry.ship.race]), [[8, 'Cyber'], [8, 'Energy'], [8, 'Crystal'], [8, 'Organic']]);
    assert.deepEqual(catalogue.slice(-4).map(entry => entry.ship.powerRank), [1, 1, 1, 1]);
  });

  it('shows the whole fleet after race browsing, including an owned ship whose unlock stage is absent', async () => {
    const { player, ships } = await fixture();
    const owner = createPlayerState({ ...player, ownedShips: ['Cyber Shuttle', 'Energy Light Fighter'] });
    const catalogue = shipyardCatalogue(owner, ships);
    assert.deepEqual(filterShipyard(catalogue, owner.ownedShips, 'Organic').map(entry => entry.key), ['Organic Shuttle']);
    assert.deepEqual(filterShipyard(catalogue, owner.ownedShips, 'owned').map(entry => entry.key), ['Energy Light Fighter', 'Cyber Shuttle']);
  });

  it('buys the first shuttle immediately and provides its starter weapon only once', async () => {
    const { player, ships } = await fixture();
    const result = purchaseOrPilotShip(player, 'Cyber Shuttle', ships);
    assert.ok(result.ok);
    assert.equal(result.player.credits, player.credits - 100);
    assert.equal(result.player.ship.type, 'Cyber Shuttle');
    assert.deepEqual(result.player.ownedShips, ['Cyber Shuttle']);
    assert.ok(result.player.inventory.weapons.includes('Genjuro Blaster'));
    const again = purchaseOrPilotShip(result.player, 'Cyber Shuttle', ships);
    assert.ok(again.ok);
    assert.strictEqual(again.player, result.player);
  });

  it('pilots an owned ship without charging and returns installed gear to inventory', async () => {
    const { player, ships } = await fixture();
    const owner = createPlayerState({ ...player, credits: 50, ownedShips: ['Cyber Shuttle', 'Energy Shuttle'],
      ship: { type: 'Cyber Shuttle', guns: ['Genjuro Blaster'], equipment: ['Alpha Plating'], weaponGroups: [[0], [0], [0]] } });
    const result = purchaseOrPilotShip(owner, 'Energy Shuttle', ships);
    assert.ok(result.ok);
    assert.equal(result.player.credits, 50);
    assert.equal(result.player.ship.type, 'Energy Shuttle');
    assert.ok(result.player.inventory.weapons.includes('Genjuro Blaster'));
    assert.ok(result.player.inventory.equipment.includes('Alpha Plating'));
    assert.deepEqual(result.player.ship.guns, ['<Empty>']);
    assert.deepEqual(result.player.ship.equipment, ['<Empty>', '<Empty>']);
    assert.deepEqual(result.player.ship.weaponGroups, [[0], [0], [0]]);
  });

  it('requires an explicit trade-in and sells only an unpiloted ship for 75 percent', async () => {
    const { player, ships } = await fixture();
    const owner = createPlayerState({ ...player, credits: 425, completedStages: ['Discipulus Major'], ownedShips: ['Cyber Shuttle'],
      ship: { type: 'Cyber Shuttle', guns: ['Genjuro Blaster'], equipment: ['<Empty>'], weaponGroups: [[0], [0], [0]] } });
    assert.deepEqual(purchaseOrPilotShip(owner, 'Cyber Light Fighter', ships), { ok: false, reason: 'not-enough-credits' });
    const trade = purchaseOrPilotShip(owner, 'Cyber Light Fighter', ships, true);
    assert.ok(trade.ok);
    assert.equal(trade.player.credits, 0);
    assert.deepEqual(trade.player.ownedShips, ['Cyber Light Fighter']);
    assert.ok(trade.player.inventory.weapons.includes('Genjuro Blaster'));
    assert.deepEqual(sellShip(trade.player, 'Cyber Light Fighter', ships), { ok: false, reason: 'cannot-sell-piloted-ship' });
    const seller = createPlayerState({ ...trade.player, ownedShips: [...trade.player.ownedShips, 'Energy Shuttle'] });
    const sale = sellShip(seller, 'Energy Shuttle', ships);
    assert.ok(sale.ok);
    assert.equal(sale.player.credits, 75);
    assert.deepEqual(sale.player.ownedShips, ['Cyber Light Fighter']);
    assert.equal(sale.player.ship.type, 'Cyber Light Fighter');
  });
});

describe('ship preview bounds', () => {
  it('measures distance in all three axes, including negative coordinates', () => {
    const mesh = parseVmdl('1\n-3,4,0,0,0,-12,1,2,2\n0,0,1,0,0,1,0,0,1\n0,0,1,0,1,1');
    assert.equal(vmdlRadius(mesh), 12);
  });
});
