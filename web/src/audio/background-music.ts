export interface MusicOutput {
  play(trackName: string, volume: number): void;
  stop(): void;
  setVolume(volume: number): void;
}

/** BackgroundMusic.m's current track and volume, with browser playback at the edge. */
export class BackgroundMusic {
  private static current: BackgroundMusic | undefined;
  private static output: MusicOutput | undefined;
  readonly trackName: string;
  private volume: number;

  constructor(trackName: string, volume = 0.5) {
    this.trackName = trackName;
    this.volume = volume;
  }

  static get globalMusic(): BackgroundMusic | undefined { return this.current; }

  static configure(output?: MusicOutput): void {
    this.output?.stop();
    this.output = output;
    if (this.current) output?.play(this.current.trackName, this.current.volume);
  }

  play(): void {
    BackgroundMusic.current = this;
    BackgroundMusic.output?.play(this.trackName, this.volume);
  }

  stop(): void {
    if (BackgroundMusic.current !== this) return;
    BackgroundMusic.output?.stop();
    BackgroundMusic.current = undefined;
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (BackgroundMusic.current === this) BackgroundMusic.output?.setVolume(this.volume);
  }
}
