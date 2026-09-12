import './style.css';
import { Battle } from './simulation.ts';
import { FixedClock, lateralGravity, MotionFilter } from './math.ts';
import { buttons, TouchControls } from './input.ts';
import { fitGame, isLandscapeViewport, resolveViewport } from './layout.ts';
import { Renderer } from './renderer.ts';

const canvas=document.querySelector<HTMLCanvasElement>('#game')!;
const flight=document.querySelector<HTMLDivElement>('#flight')!;
const viewport=document.querySelector<HTMLElement>('#viewport')!;
const gate=document.querySelector<HTMLElement>('#gate')!;
const message=document.querySelector<HTMLElement>('#message')!;
const start=document.querySelector<HTMLButtonElement>('#start')!;
const restart=document.querySelector<HTMLButtonElement>('#restart')!;
const notice=document.querySelector<HTMLElement>('#notice')!;
const controls=document.querySelector<HTMLElement>('#touch-controls')!;
const battle=new Battle(), clock=new FixedClock(), motion=new MotionFilter(), touch=new TouchControls();
let renderer:Renderer,ready=false,started=false,pending=false,blocked=false,contextLost=false;
let lastFrame=performance.now(),lastMotion=0,motionSamples=0,devMotion=false,debugPaused=false;
let currentOrientation=screenAngle();
let lastAvailableWidth=-1,lastAvailableHeight=-1;
function screenAngle() { return screen.orientation?.angle ?? (window as Window & {orientation?:number}).orientation ?? 0; }
const landscape=()=>isLandscapeViewport(window.innerWidth,window.innerHeight,screenAngle());
function clearInput() {touch.clear();battle.controls.clear();motion.reset();battle.turn=0;clock.reset();}
function resize() {
  const isLandscape=landscape();
  const bounds=resolveViewport({
    layout:{width:document.documentElement.clientWidth,height:document.documentElement.clientHeight},
    visual:window.visualViewport?{width:window.visualViewport.width,height:window.visualViewport.height}:undefined,
    screen:{width:window.screen.width,height:window.screen.height},
    standalone:matchMedia('(display-mode: standalone)').matches||(navigator as Navigator & {standalone?:boolean}).standalone===true,
    landscape:isLandscape
  });
  viewport.style.width=`${bounds.width}px`;viewport.style.height=`${bounds.height}px`;
  const style=getComputedStyle(viewport);
  const w=bounds.width-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight);
  const h=bounds.height-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom);
  const size=fitGame(w,h);flight.style.width=`${size.width}px`;flight.style.height=`${size.height}px`;
  if(w!==lastAvailableWidth||h!==lastAvailableHeight) {
    lastAvailableWidth=w;lastAvailableHeight=h;clearInput();
  }
  if(started&&!blocked) {
    gate.hidden=landscape();start.hidden=true;
    message.textContent='Rotate to landscape to continue flying.';
  } else if(ready&&!pending&&!blocked) {
    start.disabled=!landscape();message.textContent=landscape()?'Hold your phone comfortably. Tilt left or right to turn.':'Rotate to landscape, then enable motion to fly.';
  }
}
function settleResize() {
  resize();
  requestAnimationFrame(()=>requestAnimationFrame(resize));
  setTimeout(resize,250);setTimeout(resize,1000);
}
for(const item of buttons) {
  const button=document.createElement('button');button.className='flight-button';button.type='button';
  button.setAttribute('aria-label',item.label);button.tabIndex=-1;button.dataset.control=item.control;
  const [x,y,w,h]=item.rect;
  Object.assign(button.style,{left:`${x/480*100}%`,top:`${y/320*100}%`,width:`${w/480*100}%`,height:`${h/320*100}%`});controls.append(button);
}
function updatePointer(event:PointerEvent) {
  const r=flight.getBoundingClientRect();touch.update(event.pointerId,(event.clientX-r.left)/r.width*480,(event.clientY-r.top)/r.height*320);
  battle.controls=touch.values();
}
controls.addEventListener('pointerdown',event=>{
  if(!started||blocked||!landscape()||battle.player.armor<=0)return;
  event.preventDefault();controls.setPointerCapture(event.pointerId);updatePointer(event);
});
controls.addEventListener('pointermove',event=>{if(touch.pointers.has(event.pointerId)){event.preventDefault();updatePointer(event);}});
for(const type of ['pointerup','pointercancel','lostpointercapture'])controls.addEventListener(type,event=>{
  touch.release((event as PointerEvent).pointerId);battle.controls=touch.values();
});
window.addEventListener('blur',clearInput);
document.addEventListener('visibilitychange',()=>{clearInput();lastFrame=performance.now();if(!document.hidden)settleResize();});
window.addEventListener('pagehide',clearInput);
window.addEventListener('resize',resize);window.visualViewport?.addEventListener('resize',resize);
window.addEventListener('pageshow',settleResize);
window.addEventListener('orientationchange',()=>{clearInput();currentOrientation=screenAngle();});
controls.addEventListener('contextmenu',event=>event.preventDefault());
canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();contextLost=true;block('Graphics were interrupted. Reload this page to fly again.');});

function block(text:string) {
  clearInput();blocked=true;gate.hidden=false;message.textContent=text;start.hidden=true;pending=false;
}
window.addEventListener('devicemotion',event=>{
  const acceleration=event.accelerationIncludingGravity;
  if(!acceleration||acceleration.x===null||acceleration.y===null||!Number.isFinite(acceleration.x)||!Number.isFinite(acceleration.y))return;
  // Zero on every axis is a common no-sensor placeholder, not a useful gravity reading.
  if(Math.hypot(acceleration.x,acceleration.y,acceleration.z??0)<0.1)return;
  const angle=screenAngle();if(angle!==currentOrientation){motion.reset();currentOrientation=angle;}
  motion.sample(lateralGravity(acceleration.x,acceleration.y,angle));lastMotion=performance.now();motionSamples++;
});
async function enableMotion() {
  if(pending||!ready||!landscape())return;
  pending=true;start.disabled=true;
  if(!window.isSecureContext){block('Motion needs a trusted HTTPS connection. Open the secure local address on your iPhone.');return;}
  if(typeof DeviceMotionEvent==='undefined'){block('Motion is unavailable here. Open this page in Safari on your iPhone.');return;}
  try {
    const api=DeviceMotionEvent as typeof DeviceMotionEvent & {requestPermission?:()=>Promise<string>};
    // This call must precede all awaits unrelated to permission to preserve the tap gesture.
    if(api.requestPermission && await api.requestPermission()!=='granted'){
      block('Motion access was denied. Allow Motion & Orientation for this site in Safari, then reload.');return;
    }
    const since=performance.now();message.textContent='Waiting for motion from your iPhone…';
    while(lastMotion<since && performance.now()-since<4000)await new Promise(resolve=>setTimeout(resolve,50));
    if(lastMotion<since){block('No motion data arrived. Check Safari’s motion permission and reload on your iPhone.');return;}
    started=true;pending=false;gate.hidden=landscape();start.hidden=true;clearInput();lastFrame=performance.now();
    if(!landscape())message.textContent='Rotate to landscape to continue flying.';
  }catch(error){block('Motion access could not be enabled. Check the certificate and Safari permissions, then reload.');console.error(error);}
}
start.addEventListener('click',enableMotion);
restart.addEventListener('click',()=>location.reload());
function frame(now:number) {
  requestAnimationFrame(frame);
  if(!ready||contextLost)return;
  const active=started&&!blocked&&landscape()&&!document.hidden&&!debugPaused;
  let alpha=1;
  if(active) {
    if(!devMotion&&now-lastMotion>2000){
      clearInput();notice.hidden=false;notice.textContent='Motion paused. Keep Safari in the foreground.';
    }else{
      battle.turn=motion.turn;alpha=clock.advance(now-lastFrame,()=>battle.step());
      notice.hidden=battle.player.armor>0;
      if(!notice.hidden)notice.textContent='Ship destroyed. Reload to fly again.';
    }
  }else clock.reset();
  lastFrame=now;renderer.render(battle,alpha);
}
async function boot() {
  try {
    settleResize();renderer=new Renderer(canvas);await renderer.load();ready=true;
    start.textContent='Enable motion & fly';settleResize();renderer.render(battle,1);
    // The hook is opt-in and entirely removed by Vite's production build.
    if(import.meta.env.DEV&&new URLSearchParams(location.search).get('dev')==='1') {
      Object.assign(window,{__void:{battle,renderer,touch,motion,
        start(){devMotion=true;started=true;gate.hidden=true;clearInput();},
        sample(x:number,y:number,angle:number){motion.sample(lateralGravity(x,y,angle));},
        pause(value=true){debugPaused=value;clearInput();},
        step(ticks=1){for(let i=0;i<ticks;i++){battle.turn=motion.turn;battle.step();}renderer.render(battle,1);},
        state(){return {tick:battle.tick,motionSamples,turn:motion.turn,camera:battle.cameraAngle,player:{x:battle.player.x,y:battle.player.y,angle:battle.player.angle,energy:battle.player.energy,shields:battle.player.shields,armor:battle.player.armor},enemies:battle.ships.slice(1).map(s=>({type:s.type,armor:s.armor,shields:s.shields})),projectiles:battle.projectiles.length,controls:[...battle.controls],drawCalls:renderer.drawCalls,glError:renderer.gl.getError()};}
      }});
      const scenario=new URLSearchParams(location.search).get('scenario');
      if(scenario) {
        devMotion=true;started=true;gate.hidden=true;debugPaused=true;
        const { runVerification }=await import('./verification.ts');
        runVerification(battle,renderer,scenario,()=>{debugPaused=false;});
      }
    }
    requestAnimationFrame(frame);
  }catch(error){block(error instanceof Error?error.message:'Flight systems could not load. Reload to try again.');console.error(error);}
}
void boot();
