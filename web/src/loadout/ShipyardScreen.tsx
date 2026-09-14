import type { JSX } from 'preact';
import { useEffect, useId, useMemo, useRef, useState } from 'preact/hooks';
import { contentUrl, type ContentManifest } from '../content/manifest.ts';
import type { PlayerState } from '../player/model.ts';
import { ActionButton } from '../ui/ActionButton.tsx';
import { LoadoutNotice, applyResult, useSelectSound, type Notice } from './LoadoutFeedback.tsx';
import { ShipPreview } from './ShipPreview.tsx';
import { purchaseOrPilotShip, sellShip, shipTradeInValue, type ShipCatalog, type ShipDefinition } from './model.ts';
import { SHIP_RACES, filterShipyard, shipRace, shipyardCatalogue, type ShipyardEntry, type ShipyardFilter } from './shipyard.ts';
import './shipyard.css';

interface ShipyardScreenProps {
  readonly player: PlayerState;
  readonly ships: ShipCatalog;
  readonly manifest: ContentManifest;
  readonly onPlayerChange: (player: PlayerState) => void;
}

const number = (value: number) => value.toLocaleString('en-US');
const raceStyle = (color: string): JSX.CSSProperties => ({ '--ship-race': color } as JSX.CSSProperties);

export function ShipyardScreen({ player, ships, manifest, onPlayerChange }: ShipyardScreenProps) {
  const playSelectSound = useSelectSound();
  const catalogue = useMemo(() => shipyardCatalogue(player, ships), [player, ships]);
  const [filter, setFilter] = useState<ShipyardFilter>('all');
  const [selection, setSelection] = useState(player.ship.type);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [tradeIn, setTradeIn] = useState<string | null>(null);
  const detailsId = useId();
  const entries = useMemo(() => filterShipyard(catalogue, player.ownedShips, filter), [catalogue, player.ownedShips, filter]);
  // Selling or changing filters may remove the selection; derive a valid one immediately.
  const selected = entries.find(entry => entry.key === selection)
    ?? entries.find(entry => entry.key === player.ship.type) ?? entries[0];
  const ship = selected?.ship;
  const owned = selected !== undefined && player.ownedShips.includes(selected.key);
  const piloting = selected?.key === player.ship.type;
  const canAfford = Boolean(ship && player.credits + shipTradeInValue(player, ships) >= ship.price);

  const changeFilter = (next: ShipyardFilter) => {
    playSelectSound();
    // Retain the current ship when it belongs to the new view.
    setSelection(selected?.key ?? '');
    setFilter(next === filter ? 'all' : next);
  };

  const purchase = () => {
    if (!selected) return;
    if (!owned && player.credits < selected.ship.price) {
      if (canAfford) setTradeIn(selected.key);
      return;
    }
    applyResult(purchaseOrPilotShip(player, selected.key, ships), onPlayerChange, setNotice, 'BuyShip');
  };

  return (
    <section class="shipyard" aria-label="Shipyard">
      <RaceFilters catalogue={catalogue} ownedShips={player.ownedShips} filter={filter} onFilter={changeFilter} />
      <ShipList entries={entries} player={player} selectedKey={selected?.key}
        onPilot={key => applyResult(purchaseOrPilotShip(player, key, ships), onPlayerChange, setNotice, 'BuyShip')} onSelect={key => {
        playSelectSound();
        setSelection(key);
      }} />
      {ship && selected && (
        <article class="shipyard-preview" aria-label={ship.name}>
          <div class="shipyard-art"><ShipPreview manifest={manifest} ship={ship} /></div>
          <div class="shipyard-heading">
            <header class="shipyard-identity">
              <span class="shipyard-class">
                <RankBadge ship={ship} />
                <span>{shipRace(ship)?.name ?? ship.race}</span>
                <span>{ship.class}</span>
              </span>
              <h1>{ship.name}</h1>
            </header>
            <div class="shipyard-trade">
              <div class="shipyard-balance"><CreditAmount value={player.credits} /></div>
              {owned && (
                <ActionButton appearance="muted" class="shipyard-sell" disabled={piloting}
                  title={piloting ? 'Pilot another ship before selling this one' : undefined}
                  onClick={() => applyResult(sellShip(player, selected.key, ships), onPlayerChange, setNotice, 'Sell')}>
                  <span>Sell</span><CreditAmount value={Math.trunc(ship.price * 0.75)} muted />
                </ActionButton>
              )}
            </div>
          </div>
          <section id={detailsId} class={`shipyard-details ${detailsOpen ? 'shipyard-details-open' : ''}`}
            aria-label={`${ship.name} detailed statistics`} aria-hidden={!detailsOpen} inert={!detailsOpen}>
            <ShipDetails ship={ship} />
          </section>
          <div class="shipyard-essentials" aria-label="Ship essentials">
            <QuickStat icon="Shields" label="Shields" value={ship.shields} />
            <QuickStat icon="Armor" label="Armor" value={ship.armor} />
            <QuickStat icon="Energy" label="Energy" value={ship.energy} />
            <QuickStat icon="Gun" label="Gun mounts" value={ship.gunHardpoints.length} />
            <QuickStat icon="Equipment" label="Equipment slots" value={ship.equipmentSlots} />
            <button class="shipyard-details-toggle" type="button" aria-label={detailsOpen ? 'Hide ship details' : 'Show ship details'}
              aria-expanded={detailsOpen} aria-controls={detailsId} onClick={() => setDetailsOpen(open => !open)}>
              {detailsOpen && <span>Less</span>}
              <i class={`shipyard-chevron ${detailsOpen ? 'shipyard-chevron-down' : ''}`} aria-hidden="true" />
              {!detailsOpen && <span>More</span>}
            </button>
          </div>
          <ActionButton class={`shipyard-primary ${piloting ? 'shipyard-primary-current' : ''} ${detailsOpen ? 'shipyard-primary-concealed' : ''}`}
            disabled={piloting || (!owned && !canAfford)} onClick={purchase}
            aria-hidden={detailsOpen} inert={detailsOpen}
            title={!owned && !canAfford ? 'Insufficient funds' : undefined}
            aria-label={owned ? piloting ? 'Currently piloting this ship' : 'Pilot ship' : `Buy ship for ${number(ship.price)} credits`}>
            <span class="shipyard-primary-label">
              {piloting && <i class="shipyard-primary-light" aria-hidden="true" />}
              {owned ? piloting ? 'Piloting' : 'Pilot' : 'Buy'}
            </span>
            {!owned && <CreditAmount value={ship.price} />}
          </ActionButton>
        </article>
      )}
      {tradeIn && (
        <LoadoutNotice title="Trade In"
          message="You must trade in your owned ships to have enough credits to buy this ship. Do you want to trade in all ships now?"
          onClose={() => setTradeIn(null)} confirmLabel="Buy Ship"
          onConfirm={() => {
            setTradeIn(null);
            applyResult(purchaseOrPilotShip(player, tradeIn, ships, true), onPlayerChange, setNotice, 'BuyShip');
          }} />
      )}
      {notice && <LoadoutNotice {...notice} onClose={() => setNotice(null)} />}
    </section>
  );
}

function RaceFilters({ catalogue, ownedShips, filter, onFilter }: {
  readonly catalogue: readonly ShipyardEntry[];
  readonly ownedShips: readonly string[];
  readonly filter: ShipyardFilter;
  readonly onFilter: (filter: ShipyardFilter) => void;
}) {
  const counts = (entries: readonly ShipyardEntry[]) => ({ owned: entries.filter(entry => ownedShips.includes(entry.key)).length, available: entries.length });
  const total = counts(catalogue);
  return (
    <aside class="shipyard-filters" aria-label="Browse ships">
      <div class="shipyard-races">
        {[{ key: 'all', name: 'All races', color: '#a9dce4' } as const, ...SHIP_RACES].map(race => {
          const count = race.key === 'all' ? total : counts(catalogue.filter(entry => entry.ship.race === race.key));
          const lit = filter === 'all' || filter === race.key;
          return (
            <button key={race.key} type="button" class="shipyard-filter" onClick={() => onFilter(race.key)}
              aria-label={`${race.name}, ${count.owned} of ${count.available} ships owned`} aria-pressed={filter === race.key}>
              <span class={`shipyard-race-light ${race.key === 'all' ? 'shipyard-all-races' : ''} ${lit ? 'shipyard-light-on' : ''}`}
                style={raceStyle(race.color)} aria-hidden="true">
                <span class="shipyard-fleet-count">{count.owned}<small>/{count.available}</small></span>
              </span>
            </button>
          );
        })}
      </div>
      <button type="button" class="shipyard-filter shipyard-fleet-filter" aria-label="Owned ships" aria-pressed={filter === 'owned'}
        disabled={total.owned === 0} onClick={() => onFilter('owned')}>
        <span class={`shipyard-race-light shipyard-hangar ${filter === 'owned' ? 'shipyard-light-on' : ''}`} aria-hidden="true">
          <img src={contentUrl('textures/ShipyardTab@2x.png')} alt="" />
        </span>
      </button>
    </aside>
  );
}

function ShipList({ entries, player, selectedKey, onSelect, onPilot }: {
  readonly entries: readonly ShipyardEntry[];
  readonly player: PlayerState;
  readonly selectedKey: string | undefined;
  readonly onSelect: (key: string) => void;
  readonly onPilot: (key: string) => void;
}) {
  const listRef = useRef<HTMLUListElement>(null);
  useEffect(() => {
    const list = listRef.current;
    const row = list?.querySelector<HTMLButtonElement>('[aria-pressed="true"]');
    if (!list || !row) return;
    // Scroll only the catalogue, never the enclosing fixed game frame.
    const top = row.getBoundingClientRect().top - list.getBoundingClientRect().top;
    if (top < 0) list.scrollTop += top;
    else if (top + row.offsetHeight > list.clientHeight) list.scrollTop += top + row.offsetHeight - list.clientHeight;
  }, [selectedKey, entries]);

  return <ul class="shipyard-list" aria-label="Available ships" ref={listRef}>
    {entries.map(({ key, ship }) => {
      const owned = player.ownedShips.includes(key);
      const piloting = player.ship.type === key;
      return <li key={key}>
        <button type="button" class="shipyard-row" aria-pressed={key === selectedKey} onClick={() => onSelect(key)}
          onDblClick={() => { if (owned && !piloting) onPilot(key); }}>
          <RankBadge ship={ship} compact bright={piloting} />
          <strong>{ship.name}</strong>
          {owned ? <i class={`shipyard-status-light ${piloting ? 'shipyard-status-piloting' : ''}`} aria-hidden="true" /> : <CreditIcon muted />}
          <small class={owned ? `shipyard-status ${piloting ? 'shipyard-status-current' : ''}` : 'shipyard-row-price'}
            aria-label={owned ? undefined : `${number(ship.price)} credits`}>
            {owned ? piloting ? 'Piloting' : 'Owned' : number(ship.price)}
          </small>
        </button>
      </li>;
    })}
  </ul>;
}

function RankBadge({ ship, compact = false, bright = true }: { readonly ship: ShipDefinition; readonly compact?: boolean; readonly bright?: boolean }) {
  const race = shipRace(ship);
  return <span class={`shipyard-rank ${compact ? 'shipyard-rank-compact' : ''} ${bright ? 'shipyard-rank-bright' : ''}`}
    style={raceStyle(race?.color ?? '#82939e')} aria-label={`${race?.name ?? ship.race ?? 'Unknown race'}, power rank ${ship.powerRank ?? 0}`}>
    {ship.powerRank ?? '–'}
  </span>;
}

function CreditIcon({ muted = false }: { readonly muted?: boolean }) {
  return <img class={`shipyard-credit-icon ${muted ? 'shipyard-credit-muted' : ''}`} src={contentUrl('textures/MoneyIcon.png')} alt="" />;
}

function CreditAmount({ value, muted = false }: { readonly value: number; readonly muted?: boolean }) {
  return <span class="shipyard-credit" aria-label={`${number(value)} credits`}><CreditIcon muted={muted} /><span>{number(value)}</span></span>;
}

function QuickStat({ icon, label, value }: { readonly icon: string; readonly label: string; readonly value: number }) {
  return <span title={label} aria-label={`${label}: ${value}`}>
    <img src={contentUrl(`textures/HyperspaceIcon.${icon}@2x.png`)} alt="" /><b>{value}</b>
  </span>;
}

function ShipDetails({ ship }: { readonly ship: ShipDefinition }) {
  const groups = [
    { title: 'Hull', rows: [['Shields', ship.shields], ['Armor', ship.armor], ['Shield regen', Math.trunc(ship.shieldRecharge * 40)], ['Mass', ship.mass]] },
    { title: 'Power', rows: [['Energy', ship.energy], ['Energy regen', Math.trunc(ship.energyRecharge * 40)], ['Gun mounts', ship.gunHardpoints.length], ['Equip slots', ship.equipmentSlots]] },
    { title: 'Flight', rows: [['Max speed', Math.trunc(ship.maxSpeed * 40)], ['Accel.', Math.trunc(ship.thrusterForce * 1000)], ['Braking', Math.trunc(ship.brakeForce * 1000)], ['Turn speed', Math.trunc(ship.turnSpeed * 40)]] },
  ] as const;
  return <div class="shipyard-stats">
    {groups.map(group => <div key={group.title} class="shipyard-stat-group">
      <h2>{group.title}</h2>
      <dl>{group.rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    </div>)}
  </div>;
}
