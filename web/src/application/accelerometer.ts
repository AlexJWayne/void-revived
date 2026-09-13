type MotionConstructor = typeof DeviceMotionEvent & { requestPermission?: () => Promise<string> };

/** Adapts the browser sensor to the original UIAccelerometer's units and 30 Hz cadence. */
export class Accelerometer {
  private lastSampleTime = -Infinity;
  private lastAcceleration: number | null = null;
  private sampleReceived: (() => void) | undefined;
  private readonly isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  readonly onAcceleration: (y: number) => void;

  constructor(onAcceleration: (y: number) => void) {
    this.onAcceleration = onAcceleration;
    window.addEventListener('devicemotion', this.motion);
  }

  get current(): number | null { return this.lastAcceleration; }
  get hasRecentSample(): boolean { return performance.now() - this.lastSampleTime < 500; }

  async requestPermission(): Promise<void> {
    // The native simulator also had no accelerometer and used the center touch region.
    if (navigator.maxTouchPoints === 0) return;
    if (!window.isSecureContext) throw new Error('Motion steering needs a trusted HTTPS connection.');
    if (typeof DeviceMotionEvent === 'undefined') throw new Error('Motion steering is unavailable in this browser.');
    if (this.hasRecentSample) return;
    const api = DeviceMotionEvent as MotionConstructor;
    if (api.requestPermission && await api.requestPermission() !== 'granted') {
      throw new Error('Allow motion access for this site in your browser settings, then try again.');
    }
    await new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        this.sampleReceived = undefined;
        reject(new Error('No motion data arrived. Check the browser’s motion permission and try again.'));
      }, 4000);
      this.sampleReceived = () => { clearTimeout(timeout); this.sampleReceived = undefined; resolve(); };
    });
  }

  private readonly motion = (event: DeviceMotionEvent): void => {
    const acceleration = event.accelerationIncludingGravity;
    if (!acceleration || acceleration.x === null || acceleration.y === null
      || !Number.isFinite(acceleration.x) || !Number.isFinite(acceleration.y)) return;
    if (Math.hypot(acceleration.x, acceleration.y, acceleration.z ?? 0) < 0.1) return;
    const now = performance.now();
    if (now - this.lastSampleTime < 1000 / 30 - 1) return;
    const orientation = screen.orientation?.angle ?? (window as Window & { orientation?: number }).orientation ?? 0;
    this.lastAcceleration = nativeAccelerationY(acceleration.x, acceleration.y, orientation, this.isIOS);
    this.lastSampleTime = now;
    this.onAcceleration(this.lastAcceleration);
    this.sampleReceived?.();
  };

  dispose(): void { window.removeEventListener('devicemotion', this.motion); }
}

export function nativeAccelerationY(x: number, y: number, screenAngle: number, isIOS: boolean): number {
  const angle = screenAngle * Math.PI / 180;
  const lateralAcceleration = x * Math.cos(angle) - y * Math.sin(angle);
  // WebCoreMotionManager.mm passes Core Motion gravity through. Android follows the
  // opposite gravity sign in the W3C event. Return UIAcceleration units (g), with
  // the original LandscapeRight direction preserved on either landscape side.
  return lateralAcceleration / 9.80665 * (isIOS ? -1 : 1);
}
