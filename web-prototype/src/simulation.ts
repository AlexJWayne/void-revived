import legacy from './legacy-data.json' with { type: 'json' };
import { angleDifference, angleTo, clamp, rotate, segmentDistance, wrap } from './math.ts';

export type ShipName = keyof typeof legacy.ships;
export type WeaponName = keyof typeof legacy.weapons;
export type ShipDefinition = (typeof legacy.ships)[ShipName];
export type WeaponDefinition = (typeof legacy.weapons)[WeaponName];
export type Control = 'thrust'|'reverse'|'brake'|'a'|'b'|'c';
export interface Ship {
  id:number; type:ShipName; def:ShipDefinition; x:number;y:number;px:number;py:number;
  vx:number;vy:number;angle:number;previousAngle:number;targetAngle:number;bank:number;
  shields:number;armor:number;energy:number;mass:number;rechargeTicks:number;
  thrust:boolean;reverse:boolean;brake:boolean;firing:boolean;thruster:number;shieldFlash:number;
  ai:'player'|'Fighter'|'Stationary'; noticed:boolean;tendency:number;
  guns:{name:WeaponName; def:WeaponDefinition; cooldown:number; hardpoint:{x:number;y:number;z:number}}[];
}
export interface Projectile { owner:number;x:number;y:number;px:number;py:number;z:number;vx:number;vy:number;angle:number;age:number;def:WeaponDefinition }
export interface Effect {x:number;y:number;vx:number;vy:number;size:number;age:number;life:number;frames:number;texture:string;angle:number}
export const definitions=legacy;

export class Battle {
  tick=0; cameraAngle=0; previousCameraAngle=0;
  angleHistory=[0,0,0,0]; controls=new Set<Control>(); turn=0;
  ships:Ship[]=[]; projectiles:Projectile[]=[]; effects:Effect[]=[];
  random:()=>number;
  constructor(random:()=>number=Math.random) {
    this.random=random;
    this.ships=[this.createShip(0,'Cyber Frigate',0,0,'player',['Vulcan Cannon','Mass Driver']),
      this.createShip(1,'Cyber Light Fighter',-3,12,'Fighter',['Machine Gun']),
      this.createShip(2,'Cyber Gun',2,5,'Stationary',['Genjuro Blaster']),
      this.createShip(3,'Cyber Light Fighter',8,10,'Fighter',['Machine Gun']),
      this.createShip(4,'Cyber Light Fighter',-10,6,'Fighter',['Machine Gun']),
      this.createShip(5,'Cyber Gun',-6,-5,'Stationary',['Genjuro Blaster'])];
  }
  get player() { return this.ships[0]; }
  createShip(id:number,type:ShipName,x:number,y:number,ai:Ship['ai'],names:WeaponName[]):Ship {
    const def=structuredClone(legacy.ships[type]);
    // Selected enemy loadouts include the original Handicap 20 equipment.
    const bonuses:Record<string,number>={};
    if(ai!=='player') for(const effect of legacy.handicap) bonuses[effect.stat]=effect.amount;
    for(const key of Object.keys(def)) {
      const record=def as unknown as Record<string,unknown>;
      if(typeof record[key]==='number' && bonuses[key]) record[key]=(record[key] as number)*(1+bonuses[key]);
    }
    const guns=names.map((name,i)=>{
      const weapon=structuredClone(legacy.weapons[name]);
      weapon.shieldDmg*=1+(bonuses.shieldDmg??0);weapon.armorDmg*=1+(bonuses.armorDmg??0);
      return {name,def:weapon,cooldown:0,hardpoint:def.gunHardpoints[i]};
    });
    const angle=ai==='player'?0:180;
    return {id,type,def,x,y,px:x,py:y,vx:0,vy:0,angle,previousAngle:angle,targetAngle:angle,bank:0,
      shields:def.shields,armor:def.armor,energy:def.energy,mass:def.mass+guns.reduce((n,g)=>n+g.def.mass,0),
      rechargeTicks:0,thrust:false,reverse:false,brake:false,firing:false,thruster:0,shieldFlash:0,
      ai,noticed:false,tendency:this.random()*2-1,guns};
  }
  updateAI(s:Ship) {
    s.thrust=false;s.reverse=false;s.brake=false;s.firing=false;
    if(this.player.armor<=0) {s.brake=true;return;}
    const dx=this.player.x-s.x,dy=this.player.y-s.y,distance=Math.hypot(dx,dy),target=angleTo(dx,dy);
    const w=s.guns[0].def,range=w.lifetime*w.speed+w.accel*w.lifetime*w.lifetime/2;
    if(s.ai==='Stationary') {s.targetAngle=target;s.brake=true;s.firing=distance<range;return;}
    if(!s.noticed) { s.brake=true;if(distance<14+2*s.tendency)s.noticed=true;return; }
    if(distance>25+5*s.tendency){s.noticed=false;return;}
    const difference=Math.abs(angleDifference(s.angle,target));s.targetAngle=target;
    if(distance<range) s.firing=difference<20;
    else {
      const movingToward=Math.abs(angleDifference(angleTo(s.vx,s.vy),target))<20+10*s.tendency;
      const stopped=Math.hypot(s.vx,s.vy)<0.05+0.04*s.tendency;
      s.thrust=difference<15+10*s.tendency && (movingToward||stopped);s.brake=!s.thrust;
    }
  }
  step() {
    this.tick++;
    this.previousCameraAngle=this.cameraAngle;
    if(this.player.armor>0) this.cameraAngle=wrap(this.cameraAngle-this.turn);
    this.angleHistory.shift();this.angleHistory.push(this.cameraAngle);
    this.player.targetAngle=this.angleHistory[0];
    for(const p of this.projectiles) {
      p.px=p.x;p.py=p.y;p.age++;
      p.x+=p.vx;p.y+=p.vy;
    }
    this.projectiles=this.projectiles.filter(p=>p.age<p.def.lifetime);
    for(const s of this.ships) {
      s.px=s.x;s.py=s.y;s.previousAngle=s.angle;
      if(s.armor<=0) {s.thrust=s.reverse=s.brake=s.firing=false;continue;}
      if(s.ai==='player') {
        s.thrust=this.controls.has('thrust');s.reverse=this.controls.has('reverse');s.brake=this.controls.has('brake');
        s.firing=['a','b','c'].some(k=>this.controls.has(k as Control));
      } else this.updateAI(s);
      const turn=clamp(angleDifference(s.angle,s.targetAngle),-s.def.turnSpeed,s.def.turnSpeed);
      s.angle=wrap(s.angle+turn);s.bank=s.bank*0.95-turn/s.def.turnSpeed*0.05*30;
      if(s.brake&&!s.thrust) {
        const speed=Math.hypot(s.vx,s.vy),factor=speed?Math.max(0,speed-s.def.brakeForce/s.mass)/speed:0;
        s.vx*=factor;s.vy*=factor;
      }
      const force=s.thrust?s.def.thrusterForce:s.reverse?-s.def.brakeForce:0;
      const accel=rotate(0,force/s.mass,s.angle);s.vx+=accel.x;s.vy+=accel.y;
      const speed=Math.hypot(s.vx,s.vy);
      if(speed>s.def.maxSpeed){s.vx*=s.def.maxSpeed/speed;s.vy*=s.def.maxSpeed/speed;}
      s.x+=s.vx;s.y+=s.vy;
      const distance=Math.hypot(s.x,s.y);
      if(distance>80) {
        const nx=s.x/distance,ny=s.y/distance; s.x=nx*79.95;s.y=ny*79.95;
        const outward=s.vx*nx+s.vy*ny;if(outward>0){s.vx-=2*outward*nx;s.vy-=2*outward*ny;}
      }
      s.thruster=s.thrust?1:Math.max(0,s.thruster-0.1);
      s.shieldFlash=Math.max(0,s.shieldFlash-1/15);
      s.energy=Math.min(s.def.energy,s.energy+s.def.energyRecharge);
      if(++s.rechargeTicks>s.def.shieldRechargeDelay) s.shields=Math.min(s.def.shields,s.shields+s.def.shieldRecharge);
      // Alternate priority when both hardpoints compete for the remaining energy.
      const order=s.guns.map((_,i)=>i);if(this.tick%2)order.reverse();
      for(const i of order) {
        const g=s.guns[i];g.cooldown=Math.max(0,g.cooldown-1);
        const selected=s.ai!=='player'||this.controls.has('c')||this.controls.has(i===0?'a':'b');
        if(s.firing&&selected&&g.cooldown===0&&s.energy>=g.def.energy)this.fire(s,i);
      }
    }
    this.projectiles=this.projectiles.filter(p=>{
      for(const s of this.ships) {
        if(s.armor<=0 || (p.owner===0 ? s.id===0 : s.id!==0))continue;
        if(segmentDistance(p.px,p.py,p.x,p.y,s.x,s.y)<s.def.size+p.def.projectileCollisionSize) {
          this.damage(s,p.def.shieldDmg,p.def.armorDmg);
          const speed=Math.hypot(p.vx,p.vy)||1;
          s.vx+=p.vx/speed*p.def.forceHit/s.mass;s.vy+=p.vy/speed*p.def.forceHit/s.mass;
          this.effects.push({x:p.x,y:p.y,vx:0,vy:0,size:p.def.projectileCollisionSize/3,age:0,life:15,frames:4,texture:'Hit.png',angle:this.random()*360});
          return false;
        }
      }
      return true;
    });
    for(const e of this.effects){e.age++;e.x+=e.vx;e.y+=e.vy;}
    this.effects=this.effects.filter(e=>e.age<e.life);
  }
  fire(s:Ship,index:number) {
    const gun=s.guns[index],w=gun.def,offset=rotate(gun.hardpoint.x*s.def.size,gun.hardpoint.y*s.def.size,s.angle);
    const x=s.x+offset.x,y=s.y+offset.y;
    let angle=s.angle,closest=1000;
    if(w.targetingArc>0) for(const target of this.ships) {
      if(target.armor<=0||(s.id===0?target.id===0:target.id!==0))continue;
      const lead=Math.hypot(target.x-x,target.y-y)/w.speed;
      const dx=target.x-x-s.vx*lead,dy=target.y-y-s.vy*lead;
      const a=angleTo(dx,dy),distance=Math.hypot(dx,dy);
      if(Math.abs(angleDifference(s.angle,a))<w.targetingArc/2&&distance<closest){angle=a;closest=distance;}
    }
    angle+=(this.random()-0.5)*w.spread;
    const velocity=rotate(0,w.speed,angle);
    this.projectiles.push({owner:s.id,x,y,px:x,py:y,z:gun.hardpoint.z*s.def.size,vx:velocity.x+s.vx,vy:velocity.y+s.vy,angle,age:0,def:w});
    const recoil=rotate(0,-w.forceFire/s.mass,s.angle);s.vx+=recoil.x;s.vy+=recoil.y;
    s.energy-=w.energy;gun.cooldown=w.coolDown;
  }
  damage(s:Ship,shieldDamage:number,armorDamage:number) {
    if(s.armor<=0)return;
    s.noticed=true;s.rechargeTicks=0;
    if(s.shields>0) {
      s.shields-=shieldDamage;s.shieldFlash=1;
      if(s.shields<0){s.armor-=(-s.shields/shieldDamage)*armorDamage;s.shields=0;}
    } else s.armor-=armorDamage;
    if(s.armor<=0) {
      s.armor=0;s.thruster=0;
      this.effects.push({x:s.x,y:s.y,vx:s.vx,vy:s.vy,size:s.def.size*3,age:0,life:60,frames:16,texture:s.def.explosionSprite,angle:this.random()*360});
    }
  }
}
