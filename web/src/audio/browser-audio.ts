import { contentUrl, type ContentManifest } from '../content/manifest.ts';
import { BackgroundMusic } from './background-music.ts';
import { SoundEffect } from './sound-effect.ts';

/** One output for the app. Downloads and browser interruptions stay out of game objects. */
export class BrowserAudio {
  private readonly context = new AudioContext({ latencyHint: 'interactive' });
  private readonly music = new Audio();
  private readonly musicSource: MediaElementAudioSourceNode;
  private readonly musicGain = this.context.createGain();
  private readonly manifest: ContentManifest;
  private readonly buffers = new Map<string, AudioBuffer>();
  private readonly loading = new Map<string, Promise<AudioBuffer>>();
  private desiredEffects = new Set<string>();
  private trackName: string | undefined;
  private musicUrl: string | undefined;
  private activated = false;
  private disposed = false;
  onInterruption: (() => void) | undefined;

  constructor(manifest: ContentManifest) {
    this.manifest = manifest;
    this.music.loop = true;
    this.music.preload = 'none';
    this.musicSource = this.context.createMediaElementSource(this.music);
    this.musicSource.connect(this.musicGain).connect(this.context.destination);
    SoundEffect.configure(this.context, this.buffers);
    BackgroundMusic.configure({
      play: (name, volume) => this.playMusic(name, volume),
      stop: () => { this.trackName = undefined; this.music.pause(); },
      setVolume: (volume) => { this.musicGain.gain.value = volume; },
    });
    document.addEventListener('click', this.unlock, true);
    document.addEventListener('touchend', this.unlock, true);
    document.addEventListener('keydown', this.unlock, true);
    document.addEventListener('visibilitychange', this.visibilityChanged);
    window.addEventListener('pagehide', this.suspend);
    window.addEventListener('pageshow', this.visibilityChanged);
    this.context.addEventListener('statechange', this.contextChanged);
  }

  // Invoke both operations within the gesture, before motion permission or any other await.
  readonly unlock = (): void => {
    if (this.disposed || document.hidden) return;
    this.activated = true;
    SoundEffect.enabled = true;
    if (this.context.state !== 'running') void this.context.resume().catch(this.reportError);
    this.resumeMusic();
  };

  async preloadEffects(names: readonly string[]): Promise<void> {
    this.desiredEffects = new Set(names);
    for (const name of this.buffers.keys()) if (!this.desiredEffects.has(name)) this.buffers.delete(name);
    await Promise.all(names.map(async (name) => {
      if (this.buffers.has(name)) return;
      let request = this.loading.get(name);
      if (!request) {
        request = this.loadEffect(name);
        this.loading.set(name, request);
      }
      try {
        const buffer = await request;
        if (!this.disposed && this.desiredEffects.has(name)) this.buffers.set(name, buffer);
      } finally { this.loading.delete(name); }
    }));
  }

  private async loadEffect(name: string): Promise<AudioBuffer> {
    const asset = this.manifest.audio[name];
    if (!asset || asset.kind !== 'effect') throw new Error(`Sound effect not found: ${name}`);
    const response = await fetch(contentUrl(asset.url));
    if (!response.ok) throw new Error(`Unable to load ${name} (${response.status})`);
    return this.context.decodeAudioData(await response.arrayBuffer());
  }

  private playMusic(name: string, volume: number): void {
    const asset = this.manifest.audio[name];
    if (!asset || asset.kind !== 'music') { this.reportError(new Error(`Music not found: ${name}`)); return; }
    const changedTrack = this.trackName !== name;
    this.trackName = name;
    this.musicGain.gain.value = volume;
    const url = contentUrl(asset.url);
    if (this.musicUrl !== url) {
      this.music.pause();
      this.music.src = url;
      this.musicUrl = url;
    } else if (changedTrack) {
      this.music.currentTime = 0;
    }
    this.resumeMusic();
  }

  private resumeMusic(): void {
    if (!this.activated || !this.trackName || document.hidden || this.disposed || !this.music.paused) return;
    // A single media element keeps the mobile browser's playback permission across tracks.
    void this.music.play().catch((error: unknown) => {
      if (error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'AbortError')) return;
      this.reportError(error);
    });
  }

  private readonly suspend = (): void => {
    SoundEffect.enabled = false;
    SoundEffect.stopAll();
    this.music.pause();
    if (this.context.state === 'running') void this.context.suspend().catch(this.reportError);
  };

  private readonly visibilityChanged = (): void => {
    if (document.hidden) this.suspend();
    else if (this.activated) this.unlock();
  };

  private readonly contextChanged = (): void => {
    // Safari can interrupt audio independently of document visibility (for example a call).
    if (this.context.state !== 'running') {
      SoundEffect.enabled = false;
      SoundEffect.stopAll();
      this.music.pause();
      if (this.activated) this.onInterruption?.();
    } else if (this.activated && !document.hidden) {
      SoundEffect.enabled = true;
      this.resumeMusic();
    }
  };

  private readonly reportError = (error: unknown): void => {
    if (!this.disposed) console.warn('Audio playback:', error);
  };

  dispose(): void {
    this.disposed = true;
    document.removeEventListener('click', this.unlock, true);
    document.removeEventListener('touchend', this.unlock, true);
    document.removeEventListener('keydown', this.unlock, true);
    document.removeEventListener('visibilitychange', this.visibilityChanged);
    window.removeEventListener('pagehide', this.suspend);
    window.removeEventListener('pageshow', this.visibilityChanged);
    this.context.removeEventListener('statechange', this.contextChanged);
    SoundEffect.configure();
    BackgroundMusic.configure();
    this.music.removeAttribute('src');
    this.music.load();
    this.musicSource.disconnect();
    this.musicGain.disconnect();
    this.buffers.clear();
    void this.context.close();
  }
}
