import { GenericButton } from '../ui/GenericButton.tsx';
import { useState } from 'preact/hooks';
import { contentUrl } from '../content/manifest.ts';
import type { CombatContent } from './content.ts';
import type { StageStats } from './game.ts';
import type { PlayerState } from '../player/model.ts';

interface StageSummaryProps {
  readonly stats: StageStats;
  readonly player: PlayerState;
  readonly content: CombatContent;
  readonly onDismiss: () => void;
}

export function StageSummary({ stats, player, content, onDismiss }: StageSummaryProps) {
  const [leaving, setLeaving] = useState(false);
  const unlocked = Object.entries(content.shipTypes).reverse().find(([, ship]) =>
    ship.unlockStages?.includes(stats.stageName));
  const raceNames: Record<string, string> = { Cyber: 'Cykan', Crystal: 'Orthos', Organic: 'Wrethk', Energy: 'Lanaar' };
  const sections = [
    { title: 'Kills', color: 'red', rows: [{ text: String(stats.kills), icon: 'KillsIcon.png' }] },
    { title: 'Credits Earned', color: '#0f0', rows: [{ text: stats.credits.toLocaleString(), icon: 'MoneyIcon.png' }] },
    { title: 'New Ship Unlocked', color: '#9ef', rows: unlocked && !player.ownedShips.includes(unlocked[0]) ? [{
      text: `${raceNames[unlocked[0].split(' ')[0]!] ?? unlocked[0].split(' ')[0]} ${unlocked[1].name}`, icon: 'ShipyardTab.png',
    }] : [] },
    { title: 'Weapons Found', color: 'white', rows: stats.weapons.map((name) => ({ text: name, icon: `ItemIcon.${content.weapons[name]!.icon}.png` })) },
    { title: 'Equipment Found', color: 'white', rows: stats.equipment.map((name) => ({ text: name, icon: `ItemIcon.${content.equipment[name]!.icon}.png` })) },
  ];
  return (
    <section class={`stage-summary ${leaving ? 'stage-summary-leaving' : ''}`} role="dialog" aria-modal="true" aria-label="Stage complete"
      onAnimationEnd={() => { if (leaving) onDismiss(); }}>
      <h2>STAGE COMPLETE</h2>
      <div class="stage-summary-results">
        {sections.filter((section) => section.rows.length > 0).map((section) => <div key={section.title}>
          <h3>{section.title}</h3>
          {section.rows.map((row, index) => <div class="stage-summary-row" key={index} style={{ color: section.color }}>
            <img src={contentUrl(`textures/${row.icon}`)} alt="" />{row.text}
          </div>)}
        </div>)}
      </div>
      <GenericButton class="stage-summary-continue" onClick={() => setLeaving(true)}>Continue</GenericButton>
    </section>
  );
}
