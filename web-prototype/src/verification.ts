// Development-only, opt-in scripted input. This module is absent from production.
import type { Battle } from './simulation.ts';
import type { Renderer } from './renderer.ts';
import { lateralGravity, MotionFilter } from './math.ts';
export function runVerification(battle:Battle,renderer:Renderer,scenario:string,play:()=>void) {
  const output=document.createElement('output');output.id='verification';
  Object.assign(output.style,{position:'fixed',bottom:'0',left:'0',font:'11px monospace',color:'#9ce5bd',background:'#000c',padding:'4px',pointerEvents:'none',maxWidth:'100%'});
  document.body.append(output);
  if(scenario==='live'){let downs=0,ups=0;const surface=document.querySelector('#touch-controls')!;surface.addEventListener('pointerdown',()=>downs++);surface.addEventListener('pointerup',()=>ups++);play();setInterval(()=>{output.textContent=JSON.stringify({downs,ups,tick:battle.tick,controls:[...battle.controls],energy:Math.round(battle.player.energy),x:battle.player.x.toFixed(2),y:battle.player.y.toFixed(2),gl:renderer.gl.getError()});},200);return;}
  if(scenario==='combat') {
    battle.controls.add('thrust');battle.controls.add('c');
    for(let i=0;i<20;i++)battle.step();
    battle.damage(battle.player,12,18);
  }
  const motion=new MotionFilter();const turn=motion.sample(lateralGravity(0,-3,90));
  renderer.render(battle,1);
  const gl=renderer.gl,pixels=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4);
  gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
  let nonBlack=0;for(let i=0;i<pixels.length;i+=4)if(pixels[i]+pixels[i+1]+pixels[i+2]>40)nonBlack++;
  const report={scenario,meshes:renderer.meshes.size,textures:renderer.textures.size,drawCalls:renderer.drawCalls,gl:gl.getError(),nonBlack,clockwiseTilt:turn>0,tick:battle.tick,projectiles:battle.projectiles.length,enemies:battle.ships.slice(1).map(s=>({ai:s.ai,armor:s.armor})),energy:battle.player.energy};
  output.textContent=JSON.stringify(report);
}
