export type AppRoute =
  | { readonly name: 'title' }
  | { readonly name: 'hyperspace' }
  | { readonly name: 'combat'; readonly stage: string };

export type MusicTrack = 'MusicTheme' | 'MusicHyperspace' | null;

export function musicForRoute(route: AppRoute): MusicTrack {
  if (route.name === 'title') return 'MusicTheme';
  if (route.name === 'hyperspace') return 'MusicHyperspace';
  return null;
}
