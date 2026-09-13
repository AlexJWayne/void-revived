import type { Game } from '../combat/game.ts';

export const TITLE_EFFECTS = ['MainSelect', 'Select'] as const;
export const HYPERSPACE_EFFECTS = [...TITLE_EFFECTS, 'SwitchTab', 'ChimeIn', 'ChimeOut', 'Error',
  'PlayStage', 'Sell', 'Mount', 'Dismount', 'BuyShip', 'WeaponSwap', 'Select', 'SelectSell', 'DeselectSell'] as const;

/** Follow the actual stage's loadouts, including an interrupted stage's projectiles. */
export function effectsForGame(game: Game): string[] {
  const names = new Set(['Hypergate', 'HypergateOpen', 'WeaponSwap', 'Pickup.Money', 'Pickup.Weapon', 'Pickup.Equipment']);
  const weapons = [];
  for (const ship of game.targets) {
    const template = game.content.shipTypes[ship.type];
    if (template?.explosionSound) names.add(`Explosion.${template.explosionSound}`);
    // Neutral Asteroids reference an absent thruster recording in the Original Game.
    if (template?.thrusterSound && template.thrusterSound !== 'Neutral') {
      names.add(`Thruster.${template.thrusterSound}`);
      if (ship === game.ship) names.add(`Thruster.${template.thrusterSound}.Reverse`);
    }
    for (const gun of ship.guns) if (gun) weapons.push(gun.template);
  }
  for (const projectile of game.projectiles) if (projectile.template) weapons.push(projectile.template);
  for (const weapon of weapons) {
    for (const name of [...weapon.soundsFire, ...weapon.soundsHit]) names.add(`Weapon.${name}`);
  }
  return [...names];
}
