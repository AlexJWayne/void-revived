import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Battle } from '../src/simulation.ts';
import { angleDifference, angleTo, FixedClock, lateralGravity, MotionFilter, segmentDistance } from '../src/math.ts';
import { TouchControls } from '../src/input.ts';
const close=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);

test('the opening battle contains five enemies with unique ids',()=>{
  const b=new Battle(()=>0.5);
  assert.equal(b.ships.length,6);
  assert.deepEqual(b.ships.map(s=>s.id),[0,1,2,3,4,5]);
  assert.equal(b.ships.filter(s=>s.ai==='Fighter').length,3);
  assert.equal(b.ships.filter(s=>s.ai==='Stationary').length,2);
});

test('40 Hz simulation is identical at 60 and 120 Hz render rates',()=>{
  const run=(fps:number)=>{const b=new Battle(()=>0.5),c=new FixedClock();b.controls.add('thrust');for(let i=0;i<fps*10;i++)c.advance(1000/fps,()=>b.step());return b;};
  const a=run(60),b=run(120);assert.equal(a.tick,400);assert.equal(b.tick,400);assert.deepEqual(a.player,b.player);
  const c=new FixedClock();let ticks=0;c.advance(60000,()=>ticks++);assert.equal(ticks,10);
});
test('gravity normalization, orientation signs, dead zone, saturation and one-sample smoothing',()=>{
  close(lateralGravity(0,9.80665,90),1);close(lateralGravity(0,-9.80665,270),1);
  close(lateralGravity(0,9.80665,-90),-1);
  const f=new MotionFilter();close(f.sample(0.05),0);close(f.sample(1/3),-1.5);close(f.sample(1),-3);
  close(f.sample(0),-1.5);close(f.sample(0),0);f.reset();close(f.sample(-1),1.5);
  for(const [y,orientation] of [[-9.80665,90],[9.80665,270]]) {
    const motion=new MotionFilter(),b=new Battle(()=>0.5);
    b.turn=motion.sample(lateralGravity(0,y,orientation));b.step();
    assert.ok(b.cameraAngle>350, 'lowering right edge must turn clockwise');
  }
});
test('angles wrap by the shortest route and swept collision catches a fast projectile',()=>{
  close(angleDifference(359,1),2);close(angleDifference(1,359),-2);close(angleTo(1,0),270);
  close(segmentDistance(0,0,10,0,5,0),0);close(segmentDistance(0,0,10,0,5,2),2);
});
test('multitouch retains independent holds, slides between groups and cancels cleanly',()=>{
  const input=new TouchControls();input.update(1,28,230);input.update(2,450,180);
  assert.deepEqual([...input.values()].sort(),['a','thrust']);input.update(2,450,292);
  assert.deepEqual([...input.values()].sort(),['c','thrust']);input.release(1);assert.deepEqual([...input.values()],['c']);
  input.update(3,450,292);input.release(2);assert.deepEqual([...input.values()],['c']);input.clear();assert.equal(input.values().size,0);
});
test('thrust, reverse, braking and weapon mass use original values',()=>{
  const b=new Battle(()=>0.5);b.ships=b.ships.slice(0,1);const p=b.player;assert.equal(p.mass,111);
  b.controls.add('thrust');b.step();close(p.vy,0.75/111);
  for(let i=0;i<100;i++)b.step();close(Math.hypot(p.vx,p.vy),0.28);
  b.controls.clear();b.controls.add('brake');for(let i=0;i<60;i++)b.step();close(p.vy,0);
  b.controls.clear();b.controls.add('reverse');b.step();close(p.vy,-0.6/111);
});
test('camera keeps the four-entry lag and hull turn limit',()=>{
  const b=new Battle(()=>0.5);b.turn=-3;b.step();close(b.cameraAngle,3);close(b.player.angle,0);
  b.step();b.step();close(b.player.angle,0);b.step();close(b.player.angle,2.2);
});
test('shield overflow scales armor damage, delays recharge, and destruction is final',()=>{
  const b=new Battle(()=>0.5);b.ships=b.ships.slice(0,1);const p=b.player;p.shields=30;
  b.damage(p,90,130);close(p.armor,630-130*2/3);close(p.shields,0);
  for(let i=0;i<50;i++)b.step();close(p.shields,0);b.step();close(p.shields,1);
  b.damage(p,1000,10000);assert.equal(p.armor,0);const effects=b.effects.length;b.damage(p,1000,1000);assert.equal(b.effects.length,effects);
  const energy=p.energy;b.controls.add('c');b.step();assert.equal(p.energy,energy);
});
test('weapon groups consume energy and respect tick cooldowns',()=>{
  const b=new Battle(()=>0.5);b.ships=b.ships.slice(0,1);b.controls.add('a');b.step();assert.equal(b.projectiles.length,1);assert.equal(b.player.energy,286);
  for(let i=0;i<5;i++)b.step();assert.equal(b.projectiles.length,1);b.step();assert.equal(b.projectiles.length,2);
  b.controls.clear();b.controls.add('b');b.step();assert.equal(b.projectiles.at(-1)!.def.speed,0.9);
  b.player.energy=0;b.player.guns.forEach(g=>g.cooldown=0);const count=b.projectiles.length;b.step();assert.equal(b.projectiles.length,count);
});
test('both AI modes fire and can be destroyed through projectile collisions',()=>{
  const b=new Battle(()=>0.5);for(let i=0;i<10;i++)b.step();
  assert.ok(b.ships[1].noticed);assert.ok(b.projectiles.some(p=>p.owner===1));assert.ok(b.projectiles.some(p=>p.owner===2));
  for(const target of b.ships.slice(1)) {
    b.projectiles=[];target.x=0;target.y=5;target.vx=target.vy=0;
    const other=b.ships.find(s=>s.id!==0&&s!==target)!;other.x=30;other.y=30;
    b.player.x=0;b.player.y=0;b.player.vx=b.player.vy=0;b.player.angle=b.player.targetAngle=b.cameraAngle=0;b.angleHistory=[0,0,0,0];
    b.controls=new Set(['c']);
    for(let i=0;i<180&&target.armor>0;i++)b.step();
    assert.equal(target.armor,0,target.type+' must be destroyable');assert.ok(b.effects.some(e=>e.frames===16));
  }
});
test('arena boundary reflects outward velocity and reload creates clean state',()=>{
  const b=new Battle(()=>0.5);b.player.x=79.99;b.player.vx=0.28;b.step();assert.ok(Math.hypot(b.player.x,b.player.y)<80);assert.ok(b.player.vx<0);
  const fresh=new Battle(()=>0.5);assert.equal(fresh.tick,0);assert.equal(fresh.player.armor,630);assert.equal(fresh.projectiles.length,0);
});
