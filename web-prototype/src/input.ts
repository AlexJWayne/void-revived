import type { Control } from './simulation.ts';
export const buttons: {control:Control;label:string;rect:[number,number,number,number]}[]=[
  {control:'thrust',label:'Thrust',rect:[0,176,56,81]},
  {control:'reverse',label:'Reverse',rect:[0,264,56,56]},
  {control:'brake',label:'Brake',rect:[56,264,81,56]},
  {control:'a',label:'Fire A: Vulcan Cannon',rect:[424,152,56,56]},
  {control:'b',label:'Fire B: Mass Driver',rect:[424,208,56,56]},
  {control:'c',label:'Fire C: both weapons',rect:[424,264,56,56]},
];
export class TouchControls {
  pointers=new Map<number,{x:number;y:number}>();
  update(id:number,x:number,y:number) {this.pointers.set(id,{x,y});}
  release(id:number){this.pointers.delete(id);}
  clear(){this.pointers.clear();}
  values():Set<Control> {
    const result=new Set<Control>();
    for(const p of this.pointers.values()) for(const b of buttons){
      const [x,y,w,h]=b.rect;
      if(p.x>=x&&p.x<x+w&&p.y>=y&&p.y<y+h)result.add(b.control);
    }
    return result;
  }
}
