export const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
export const radians = (degrees: number) => degrees * Math.PI / 180;
export const wrap = (angle: number) => ((angle % 360) + 360) % 360;
export const angleDifference = (from: number, to: number) => ((to - from + 540) % 360 + 360) % 360 - 180;
export const angleTo = (x: number, y: number) => wrap(Math.atan2(-x, y) * 180 / Math.PI);
export const rotate = (x: number, y: number, angle: number) => {
  const c = Math.cos(radians(angle)), s = Math.sin(radians(angle));
  return { x: x*c-y*s, y: x*s+y*c };
};

// Motion coordinates stay in natural portrait orientation. A 90° screen angle
// means the device top points left, so screen-right is negative device Y.
// iOS WebKit passes Core Motion gravity through (face-up Z is negative).
// Negate screen-right gravity so lowering the right edge turns clockwise.
export function lateralGravity(x: number, y: number, screenAngle: number) {
  return -(x * Math.cos(radians(screenAngle)) - y * Math.sin(radians(screenAngle))) / 9.80665;
}
export class MotionFilter {
  last = 0;
  turn = 0;
  sample(gravity: number) {
    const tilt = clamp(gravity * 3, -1, 1);
    const current = Math.abs(tilt) < 0.2 ? 0 : Math.sign(tilt) * (Math.abs(tilt) - 0.2) / 0.8 * -3;
    this.turn = (current + this.last) / 2;
    this.last = current;
    return this.turn;
  }
  reset() { this.last = this.turn = 0; }
}

export class FixedClock {
  accumulator = 0;
  advance(milliseconds: number, tick: () => void) {
    // Drop suspension time; never fast-forward a battle on return from another app.
    this.accumulator += clamp(milliseconds, 0, 250);
    while (this.accumulator + 1e-8 >= 25) { tick(); this.accumulator -= 25; }
    return Math.max(0, this.accumulator / 25);
  }
  reset() { this.accumulator = 0; }
}

export function segmentDistance(ax:number, ay:number, bx:number, by:number, x:number, y:number) {
  const dx=bx-ax, dy=by-ay, square=dx*dx+dy*dy;
  const t=square ? clamp(((x-ax)*dx+(y-ay)*dy)/square,0,1) : 0;
  return Math.hypot(ax+t*dx-x, ay+t*dy-y);
}

export type Mat4 = Float32Array;
export function identity(): Mat4 { return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]); }
export function multiply(a:Mat4,b:Mat4):Mat4 {
  const out=new Float32Array(16);
  for(let c=0;c<4;c++) for(let r=0;r<4;r++) for(let k=0;k<4;k++) out[c*4+r]+=a[k*4+r]*b[c*4+k];
  return out;
}
export function translation(x:number,y:number,z:number) { const m=identity(); m[12]=x;m[13]=y;m[14]=z;return m; }
export function scaling(x:number,y=x,z=x) { const m=identity();m[0]=x;m[5]=y;m[10]=z;return m; }
export function rotation(angle:number,axis:'x'|'y'|'z'='z') {
  const m=identity(),c=Math.cos(radians(angle)),s=Math.sin(radians(angle));
  if(axis==='z'){m[0]=c;m[1]=s;m[4]=-s;m[5]=c;}
  if(axis==='x'){m[5]=c;m[6]=s;m[9]=-s;m[10]=c;}
  if(axis==='y'){m[0]=c;m[2]=-s;m[8]=s;m[10]=c;}
  return m;
}
export const compose=(...matrices:Mat4[])=>matrices.reduce(multiply,identity());
export function perspective() {
  const n=4,f=200;
  return new Float32Array([n/1.5,0,0,0, 0,n,0,0, 0,0,-(f+n)/(f-n),-1, 0,0,-2*f*n/(f-n),0]);
}
export function orthographic() { return new Float32Array([2/480,0,0,0, 0,-2/320,0,0, 0,0,-1,0, -1,1,0,1]); }
