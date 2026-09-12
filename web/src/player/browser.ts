import { PlayerStore } from './storage.ts';

export function createBrowserPlayerStore(): PlayerStore {
  return new PlayerStore(window.localStorage);
}
