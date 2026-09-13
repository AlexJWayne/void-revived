import type { Vector3Value } from '../combat/math.ts';

/** SoundEffect.m: cached named effects and independently owned ship/weapon players. */
export class SoundEffect {
  private static readonly effects = new Map<string, SoundEffect>();
  private static readonly active = new Set<SoundEffect>();
  private static listener = { x: 0, y: 0 };
  private static context: AudioContext | undefined;
  private static buffers: ReadonlyMap<string, AudioBuffer> = new Map();
  static enabled = false;

  readonly effectName: string;
  readonly looping: boolean;
  private source: AudioBufferSourceNode | undefined;
  private gain: GainNode | undefined;
  private volume = 1;
  private offset = 0;
  private startedAt = 0;

  constructor(name: string, looping = false) {
    this.effectName = name;
    this.looping = looping;
  }

  static configure(context?: AudioContext, buffers: ReadonlyMap<string, AudioBuffer> = new Map()): void {
    this.stopAll();
    this.drainCache();
    this.context = context;
    this.buffers = buffers;
    this.enabled = false;
  }

  static effectNamed(name: string, looping = false): SoundEffect {
    let effect = this.effects.get(name);
    if (!effect) {
      effect = new SoundEffect(name, looping);
      this.effects.set(name, effect);
    }
    return effect;
  }

  static setListenerPos(position: Vector3Value): void {
    this.listener.x = position.x;
    this.listener.y = position.y;
  }

  static resetListenerPos(): void { this.listener = { x: 0, y: 0 }; }

  static stopAll(): void {
    for (const effect of this.active) effect.stop();
  }

  static drainCache(): void {
    // Let navigation one-shots finish when their screen changes.
    for (const effect of this.active) if (effect.looping) effect.stop();
    this.effects.clear();
    this.resetListenerPos();
  }

  get playing(): boolean { return this.source !== undefined; }

  play(): void {
    const context = SoundEffect.context;
    const buffer = SoundEffect.buffers.get(this.effectName);
    // A missed, unloaded one-shot must never arrive late during another action.
    if (this.playing || !SoundEffect.enabled || !context || !buffer) return;
    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = buffer;
    source.loop = this.looping;
    gain.gain.value = this.volume;
    source.connect(gain).connect(context.destination);
    this.source = source;
    this.gain = gain;
    this.startedAt = context.currentTime;
    SoundEffect.active.add(this);
    source.onended = () => {
      if (this.source !== source) return;
      this.disconnect();
      this.offset = 0;
    };
    source.start(0, this.offset % buffer.duration);
  }

  stop(): void {
    if (!this.source) return;
    // AVAudioPlayer.stop preserves its playback position; natural completion resets it.
    this.offset += (SoundEffect.context?.currentTime ?? this.startedAt) - this.startedAt;
    this.source.onended = null;
    this.source.stop();
    this.disconnect();
  }

  stopAndDecay(): void { this.stop(); } // The active Objective-C implementation stops immediately.

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.gain) this.gain.gain.value = this.volume;
  }

  setPosition(position: Vector3Value): void {
    const distance = Math.hypot(position.x - SoundEffect.listener.x, position.y - SoundEffect.listener.y);
    this.setVolume(effectVolumeAtDistance(distance));
  }

  private disconnect(): void {
    this.source?.disconnect();
    this.gain?.disconnect();
    this.source = undefined;
    this.gain = undefined;
    SoundEffect.active.delete(this);
  }
}

export function effectVolumeAtDistance(distance: number): number {
  // Preserve SoundEffect.m's unusual rising middle range for source fidelity.
  if (distance < 8) return 1;
  if (distance > 20) return 0;
  return (distance - 8) / (20 - 8);
}
