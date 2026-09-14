import { useEffect, useMemo, useRef, useState } from 'preact/hooks';

import { SoundEffect } from '../audio/sound-effect.ts';
import { GenericButton } from '../ui/GenericButton.tsx';
import { contentUrl, type ContentManifest } from '../content/manifest.ts';
import { EMPTY_SLOT, type PlayerState } from '../player/model.ts';
import { FAILURE_COPY, LoadoutNotice, applyResult, useSelectSound, type Notice } from './LoadoutFeedback.tsx';
import { HardpointButton } from './HardpointButton.tsx';
import {
  buyBackItems,
  dismountEquipment,
  dismountWeapon,
  mountEquipment,
  mountWeapon,
  sellItems,
  sortEquipment,
  toggleWeaponGroup,
  type EquipmentCatalog,
  type EquipmentDefinition,
  type ShipCatalog,
  type WeaponCatalog,
  type WeaponDefinition,
} from './model.ts';

interface StationProps {
  readonly player: PlayerState;
  readonly weapons: WeaponCatalog;
  readonly equipment: EquipmentCatalog;
  readonly ships: ShipCatalog;
  readonly manifest: ContentManifest;
  readonly onPlayerChange: (player: PlayerState) => void;
}

type ItemSelection = { readonly source: 'inventory' | 'slot'; readonly index: number } | null;
type ItemCatalog = WeaponCatalog | EquipmentCatalog;

const EFFECT_NAMES: Readonly<Record<string, string>> = {
  mass: 'Mass',
  thrusterForce: 'Acceleration',
  maxSpeed: 'Max Speed',
  turnSpeed: 'Turn Speed',
  brakeForce: 'Braking',
  shields: 'Shields',
  shieldRecharge: 'Shield Recharge',
  armor: 'Armor',
  armorRecharge: 'Armor Regeneration',
  energy: 'Weapon Energy',
  energyRecharge: 'Energy Recharge',
  shieldDmg: 'Shields Damage',
  armorDmg: 'Armor Damage',
  projectileSpeed: 'Projectile Speed',
  range: 'Weapon Range',
  coolDown: 'Weapon Cooldown',
  spread: 'Weapon Spread',
  seekTurnSpeed: 'Projectile Seeking',
};

const NEGATIVE_IS_GOOD = new Set(['mass', 'coolDown', 'spread']);

export function WeaponsScreen({ player, weapons, ships, onPlayerChange }: StationProps) {
  const inventory = useMemo(() => [...player.inventory.weapons].sort(), [player.inventory.weapons]);
  const [selection, setSelection] = useState<ItemSelection>(() => initialItemSelection(player.ship.guns));
  const [notice, setNotice] = useState<Notice>(() => noShipNotice(player));
  const selectedName = itemName(selection, inventory, player.ship.guns);
  const selectedWeapon = selectedName === EMPTY_SLOT ? undefined : weapons[selectedName];

  useEffect(() => keepSelectionValid(selection, inventory, player.ship.guns, setSelection), [inventory, player.ship.guns]);

  const equip = (inventoryIndex: number) => {
    const slot = targetSlot(selection, player.ship.guns);
    if (slot < 0) {
      SoundEffect.effectNamed('Error').play();
      setNotice({ title: 'No more item mounts', message: 'To mount more items you first must clear a spot by double tapping an equipped item to remove it from its socket.' });
      return;
    }
    const name = inventory[inventoryIndex];
    if (!name) return;
    const result = mountWeapon(player, name, slot, weapons, ships);
    if (!result.ok) {
      SoundEffect.effectNamed('Error').play();
      setNotice(result.reason === 'not-enough-energy'
        ? { title: 'Not enough energy', message: `Your ship needs at least ${weapons[name]?.energy ?? 0} energy to fire the ${name}, but it only has ${ships[player.ship.type]?.energy ?? 0}.` }
        : FAILURE_COPY[result.reason]);
      return;
    }
    SoundEffect.effectNamed('Mount').play();
    onPlayerChange(result.player);
    setSelection({ source: 'slot', index: slot });
  };

  const sell = () => {
    if (selection?.source !== 'inventory') return;
    const result = sellItems(player, 'weapons', [selection.index], weapons);
    if (!result.ok) {
      SoundEffect.effectNamed('Error').play();
      setNotice(FAILURE_COPY[result.reason]);
      return;
    }
    SoundEffect.effectNamed('Sell').play();
    onPlayerChange(result.player);
    setSelection(inventory.length > 1 ? { source: 'inventory', index: Math.min(selection.index, inventory.length - 2) } : initialItemSelection(player.ship.guns));
  };

  return (
    <ItemScreen
      kind="weapon"
      inventory={inventory}
      catalog={weapons}
      equipped={player.ship.guns}
      selection={selection}
      onSelection={setSelection}
      onEquip={equip}
      onDismount={(slot) => applyResult(dismountWeapon(player, slot), onPlayerChange, setNotice, 'Dismount')}
      onSell={sell}
      onBuyback={() => applyResult(buyBackItems(player, 'weapons'), onPlayerChange, setNotice, 'Sell')}
      canBuyback={player.buybackWeapons.length > 0}
    >
      <WeaponDetails name={selectedName} weapon={selectedWeapon} />
      {selection?.source === 'slot' && selectedWeapon && (
        <div class="weapon-groups" aria-label="Assigned weapon groups">
          <span class="weapon-groups-label">Assigned Group:</span>
          {([{ label: 'A', group: 0 }, { label: 'B', group: 1 }, { label: 'C', group: 2 }] as const).map(({ label, group }) => (
            <button
              key={label}
              class={player.ship.weaponGroups[group].includes(selection.index) ? 'loadout-socket group-button loadout-socket-selected' : 'loadout-socket group-button'}
              type="button"
              aria-pressed={player.ship.weaponGroups[group].includes(selection.index)}
              onClick={() => applyResult(toggleWeaponGroup(player, selection.index, group), onPlayerChange, setNotice, 'WeaponSwap')}
            >{label}</button>
          ))}
        </div>
      )}
      {notice && <LoadoutNotice {...notice} onClose={() => setNotice(null)} />}
    </ItemScreen>
  );
}

export function EquipmentScreen({ player, equipment, onPlayerChange }: StationProps) {
  const inventory = useMemo(() => sortEquipment(player.inventory.equipment, equipment), [player.inventory.equipment, equipment]);
  const [selection, setSelection] = useState<ItemSelection>(() => initialItemSelection(player.ship.equipment));
  const [notice, setNotice] = useState<Notice>(() => noShipNotice(player));
  const selectedName = itemName(selection, inventory, player.ship.equipment);
  const selectedEquipment = selectedName === EMPTY_SLOT ? undefined : equipment[selectedName];

  useEffect(() => keepSelectionValid(selection, inventory, player.ship.equipment, setSelection), [inventory, player.ship.equipment]);

  const equip = (inventoryIndex: number) => {
    const slot = targetSlot(selection, player.ship.equipment);
    if (slot < 0) {
      SoundEffect.effectNamed('Error').play();
      setNotice({ title: 'No more item mounts', message: 'To mount more items you first must clear a spot by double tapping an equipped item to remove it from its socket.' });
      return;
    }
    const name = inventory[inventoryIndex];
    if (!name) return;
    const result = mountEquipment(player, name, slot, equipment);
    if (!result.ok) {
      SoundEffect.effectNamed('Error').play();
      const duplicate = player.ship.equipment.find((equipped) => equipped !== EMPTY_SLOT && equipment[equipped]?.groupName === equipment[name]?.groupName);
      setNotice(result.reason === 'duplicate-equipment-group'
        ? { title: 'Duplicate Equipment Type', message: `You may only have one item from an equipment group at a time. Dequip your “${duplicate}” to install this item.` }
        : FAILURE_COPY[result.reason]);
      return;
    }
    SoundEffect.effectNamed('Mount').play();
    onPlayerChange(result.player);
    setSelection({ source: 'slot', index: slot });
  };

  const sell = () => {
    if (selection?.source !== 'inventory') return;
    const result = sellItems(player, 'equipment', [selection.index], equipment);
    if (!result.ok) {
      SoundEffect.effectNamed('Error').play();
      setNotice(FAILURE_COPY[result.reason]);
      return;
    }
    SoundEffect.effectNamed('Sell').play();
    onPlayerChange(result.player);
    setSelection(inventory.length > 1 ? { source: 'inventory', index: Math.min(selection.index, inventory.length - 2) } : initialItemSelection(player.ship.equipment));
  };

  return (
    <ItemScreen
      kind="equipment"
      inventory={inventory}
      catalog={equipment}
      equipped={player.ship.equipment}
      selection={selection}
      onSelection={setSelection}
      onEquip={equip}
      onDismount={(slot) => applyResult(dismountEquipment(player, slot, equipment), onPlayerChange, setNotice, 'Dismount')}
      onSell={sell}
      onBuyback={() => applyResult(buyBackItems(player, 'equipment', equipment), onPlayerChange, setNotice, 'Sell')}
      canBuyback={player.buybackEquipment.length > 0}
    >
      <EquipmentDetails name={selectedName} item={selectedEquipment} />
      {notice && <LoadoutNotice {...notice} onClose={() => setNotice(null)} />}
    </ItemScreen>
  );
}

interface ItemScreenProps {
  readonly kind: 'weapon' | 'equipment';
  readonly inventory: readonly string[];
  readonly catalog: ItemCatalog;
  readonly equipped: readonly string[];
  readonly selection: ItemSelection;
  readonly onSelection: (selection: ItemSelection) => void;
  readonly onEquip: (index: number) => void;
  readonly onDismount: (index: number) => void;
  readonly onSell: () => void;
  readonly onBuyback: () => void;
  readonly canBuyback: boolean;
  readonly children: preact.ComponentChildren;
}

function ItemScreen({ kind, inventory, catalog, equipped, selection, onSelection, onEquip, onDismount, onSell, onBuyback, canBuyback, children }: ItemScreenProps) {
  const playSelectSound = useSelectSound();
  const visualSlots = slotsByVisualPosition(equipped.length);
  const lastTap = useRef<{ readonly item: NonNullable<ItemSelection>; readonly time: number } | null>(null);

  // Inventory indices may refer to different items after mounting, selling, or buying back.
  useEffect(() => { lastTap.current = null; }, [inventory, equipped]);

  const tappedItem = (item: NonNullable<ItemSelection>) => {
    const time = performance.now();
    const previous = lastTap.current;
    const wasSelected = selection?.source === item.source && selection.index === item.index;
    // ItemController.m uses DOUBLE_TAP_TIME = 0.5, independent of native double-click events.
    const isDoubleTap = wasSelected && previous?.item.source === item.source
      && previous.item.index === item.index && time - previous.time < 500;
    lastTap.current = isDoubleTap ? null : { item, time };
    if (!isDoubleTap) playSelectSound();
    onSelection(item);
    if (isDoubleTap) {
      if (item.source === 'slot') onDismount(item.index);
      else onEquip(item.index);
    }
  };

  const dismountItem = (slot: number) => {
    lastTap.current = null;
    onSelection({ source: 'slot', index: slot });
    onDismount(slot);
  };

  return (
    <section class={`item-screen item-screen-${kind}`} aria-label={kind === 'weapon' ? 'Weapons' : 'Equipment'} style={loadoutAssetStyle()}>
      <div class="item-inventory" role="listbox" aria-label={`${kind} inventory`}>
        <div class="item-actions">
          <GenericButton class="loadout-action" disabled={selection?.source !== 'inventory'} onClick={onSell}>Sell Item</GenericButton>
          <GenericButton class="loadout-action buyback-action" disabled={!canBuyback} onClick={onBuyback}>Buyback</GenericButton>
        </div>
        <div class="item-list">
          {inventory.map((name, index) => (
            <button
              key={`${name}-${index}`}
              class={selection?.source === 'inventory' && selection.index === index ? 'loadout-row item-row loadout-row-selected' : 'loadout-row item-row'}
              type="button"
              role="option"
              aria-selected={selection?.source === 'inventory' && selection.index === index}
              onClick={() => tappedItem({ source: 'inventory', index })}
            >
              <img class="item-icon" src={itemIcon(catalog[name])} alt="" />
              <span>{name}</span>
              <span class="equip-accessory" role="button" aria-label={`Equip ${name}`} onClick={(event) => {
                event.stopPropagation();
                lastTap.current = null;
                onEquip(index);
              }}>
                <img src={contentUrl('textures/EquipAccessory.png')} alt="" />
              </span>
            </button>
          ))}
        </div>
      </div>

      <div class="loadout-hardpoints" aria-label={`${kind} mounts`}>
        {visualSlots.map((slot, visualIndex) => {
          const name = slot === null ? EMPTY_SLOT : equipped[slot] ?? EMPTY_SLOT;
          const active = slot !== null;
          const selected = active && selection?.source === 'slot' && selection.index === slot;
          return (
            <HardpointButton
              key={visualIndex}
              selected={selected}
              disabled={!active}
              label={active ? `${kind} mount ${slot + 1}: ${name}` : 'Unavailable mount'}
              icon={active && name !== EMPTY_SLOT ? itemIcon(catalog[name]) : undefined}
              onTap={() => active && tappedItem({ source: 'slot', index: slot })}
              onDragOut={() => active && dismountItem(slot)}
            />
          );
        })}
      </div>

      {children}
    </section>
  );
}

function WeaponDetails({ name, weapon }: { readonly name: string; readonly weapon?: WeaponDefinition }) {
  if (!weapon) return <div class="item-detail"><h1>{EMPTY_SLOT}</h1></div>;
  const fireRate = 40 / weapon.coolDown;
  const range = weapon.beam ? weapon.beamRange : weapon.lifetime * weapon.speed + weapon.accel * weapon.lifetime * weapon.lifetime / 2;
  return (
    <div class="item-detail weapon-detail">
      <h1>{name}</h1>
      <p>{weapon.description}</p>
      <div class="weapon-stats">
        <ItemStat label="dmg/sec:" icon="HyperspaceIcon.Shields.png" value={Math.trunc(weapon.shieldDmg * fireRate)} />
        <ItemStat label="Speed:" value={weapon.beam ? 'Instant' : Math.trunc(weapon.speed * 40)} />
        <ItemStat label="dmg/sec:" icon="HyperspaceIcon.Armor.png" value={Math.trunc(weapon.armorDmg * fireRate)} />
        <ItemStat label="Range:" value={Math.trunc(range)} />
        <ItemStat label="/sec:" icon="HyperspaceIcon.Energy.png" value={Math.trunc(weapon.energy * fireRate)} />
        <ItemStat label="Value:" icon="MoneyIcon.png" value={weapon.value} />
        <ItemStat label="Shots/sec:" value={formatRate(fireRate)} />
        <ItemStat label="Mass:" value={Math.trunc(weapon.mass)} />
      </div>
    </div>
  );
}

function EquipmentDetails({ name, item }: { readonly name: string; readonly item?: EquipmentDefinition }) {
  return (
    <div class="item-detail equipment-detail">
      <h1>{name}</h1>
      {item && <p>{item.description}</p>}
      {item && <div class="equipment-value"><span>Value:</span><img src={contentUrl('textures/MoneyIcon.png')} alt="" /><strong>{formatNumber(item.value)}</strong></div>}
      <div class="equipment-effects" aria-label="Equipment effects">
        {item?.effects.map((effect, index) => {
          const value = Math.round(effect.amount * 100);
          const good = NEGATIVE_IS_GOOD.has(effect.stat) ? value < 0 : value > 0;
          return (
            <div key={`${effect.stat}-${index}`} class="equipment-effect">
              <span>{EFFECT_NAMES[effect.stat] ?? effect.stat}</span>
              <strong class={good ? 'effect-good' : 'effect-bad'}>{value > 0 ? '+' : '-'} {Math.abs(value)}%</strong>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ItemStat({ label, icon, value }: { readonly label: string; readonly icon?: string; readonly value: string | number }) {
  return <div class="item-stat"><span>{icon && <img src={contentUrl(`textures/${icon}`)} alt="" />}{label}</span><strong>{formatNumber(value)}</strong></div>;
}

function slotsByVisualPosition(count: number): readonly (number | null)[] {
  const result: (number | null)[] = [null, null, null, null, null];
  const positions: Readonly<Record<number, readonly number[]>> = {
    1: [2],
    2: [1, 3],
    3: [0, 2, 4],
    4: [0, 1, 3, 4],
    5: [0, 1, 2, 3, 4],
  };
  positions[Math.min(count, 5)]?.forEach((visual, slot) => { result[visual] = slot; });
  return result;
}

function initialItemSelection(equipped: readonly string[]): ItemSelection {
  return equipped.length ? { source: 'slot', index: 0 } : null;
}

function keepSelectionValid(selection: ItemSelection, inventory: readonly string[], equipped: readonly string[], setSelection: (selection: ItemSelection) => void) {
  if (selection?.source === 'inventory' && selection.index >= inventory.length) setSelection(inventory.length ? { source: 'inventory', index: inventory.length - 1 } : initialItemSelection(equipped));
  if (selection?.source === 'slot' && selection.index >= equipped.length) setSelection(initialItemSelection(equipped));
}

function targetSlot(selection: ItemSelection, equipped: readonly string[]): number {
  if (selection?.source === 'slot' && equipped[selection.index] === EMPTY_SLOT) return selection.index;
  return equipped.indexOf(EMPTY_SLOT);
}

function itemName(selection: ItemSelection, inventory: readonly string[], equipped: readonly string[]): string {
  if (!selection) return EMPTY_SLOT;
  return selection.source === 'inventory' ? inventory[selection.index] ?? EMPTY_SLOT : equipped[selection.index] ?? EMPTY_SLOT;
}

function itemIcon(item: WeaponDefinition | EquipmentDefinition | undefined): string {
  return contentUrl(`textures/ItemIcon.${item?.icon ?? 'GenericYellow'}.png`);
}

function noShipNotice(player: PlayerState): Notice {
  return player.ship.type === EMPTY_SLOT ? FAILURE_COPY['no-ship'] : null;
}

function formatNumber(value: string | number): string {
  return typeof value === 'number' ? value.toLocaleString('en-US') : value;
}

function formatRate(value: number): string {
  return value.toFixed(1).replace('.0', '');
}

function loadoutAssetStyle(): preact.JSX.CSSProperties {
  return {
    '--socket': `url("${contentUrl('textures/EmptyHardpoint.png')}")`,
    '--socket-selected': `url("${contentUrl('textures/EmptyHardpointSelected.png')}")`,
    '--socket-disabled': `url("${contentUrl('textures/DisabledHardpoint.png')}")`,
  } as preact.JSX.CSSProperties;
}
