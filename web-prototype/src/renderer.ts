import { angleDifference, compose, identity, orthographic, perspective, rotate, rotation, scaling, translation } from './math.ts';
import type { Mat4 } from './math.ts';
import type { Battle } from './simulation.ts';

type Mesh={vao:WebGLVertexArrayObject;count:number};
type Color=[number,number,number,number];
const white:Color=[1,1,1,1];
export class Renderer {
  gl:WebGL2RenderingContext;
  program:WebGLProgram;
  uniforms:Record<string,WebGLUniformLocation>={};
  meshes=new Map<string,Mesh>();textures=new Map<string,WebGLTexture>();
  quad:Mesh;stars:Mesh;
  drawCalls=0;
  constructor(public canvas:HTMLCanvasElement) {
    const gl=canvas.getContext('webgl2',{alpha:false,antialias:true,powerPreference:'high-performance'});
    if(!gl)throw new Error('This browser cannot run WebGL 2. Open this page in current Safari.');
    this.gl=gl;
    const vertex=`#version 300 es
      layout(location=0) in vec3 aPosition;
      layout(location=1) in vec3 aNormal;
      layout(location=2) in vec2 aUV;
      uniform mat4 uProjection; uniform mat4 uModel;
      uniform vec4 uUV; uniform float uLighting; uniform float uPoints; uniform float uPixelRatio;
      out vec2 vUV; out vec3 vLight;
      void main(){
        gl_Position=uProjection*uModel*vec4(aPosition,1.0);
        vec3 normal=normalize(mat3(uModel)*aNormal);
        float diffuse=max(dot(normal,normalize(vec3(-0.3,0.5,1.0))),0.0);
        vLight=mix(vec3(1.0),vec3(0.3+0.85*diffuse),uLighting);
        if(uPoints>0.5) vLight=aNormal;
        gl_PointSize=(1.5+aUV.x)*uPixelRatio;
        vUV=uUV.xy+aUV*uUV.zw;
      }`;
    const fragment=`#version 300 es
      precision highp float;
      uniform sampler2D uTexture; uniform vec4 uColor; uniform float uPoints;
      in vec2 vUV; in vec3 vLight; out vec4 color;
      void main(){
        vec4 tex=uPoints>0.5?vec4(1.0):texture(uTexture,vUV);
        color=tex*uColor*vec4(vLight,1.0);
        if(color.a<0.005)discard;
      }`;
    const shader=(type:number,source:string)=>{
      const s=gl.createShader(type)!;gl.shaderSource(s,source);gl.compileShader(s);
      if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s)??'Shader failed');return s;
    };
    this.program=gl.createProgram()!;
    const vs=shader(gl.VERTEX_SHADER,vertex),fs=shader(gl.FRAGMENT_SHADER,fragment);
    gl.attachShader(this.program,vs);gl.attachShader(this.program,fs);gl.linkProgram(this.program);
    if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(this.program)??'Shader link failed');
    gl.deleteShader(vs);gl.deleteShader(fs);gl.useProgram(this.program);
    for(const name of ['Projection','Model','UV','Lighting','Points','PixelRatio','Texture','Color'])this.uniforms[name]=gl.getUniformLocation(this.program,'u'+name)!;
    gl.uniform1i(this.uniforms.Texture,0);
    this.quad=this.makeMesh([-0.5,0.5,0, -0.5,-0.5,0, 0.5,0.5,0, 0.5,0.5,0, -0.5,-0.5,0, 0.5,-0.5,0],Array(6).fill([0,0,1]).flat(),[0,0,0,1,1,0,1,0,0,1,1,1]);
    const positions:number[]=[],colors:number[]=[],sizes:number[]=[];
    let seed=5671;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
    for(let i=0;i<1500;i++) {
      let x=0,y=0;do{x=(random()*2-1)*80;y=(random()*2-1)*80;}while(Math.hypot(x,y)>80);
      positions.push(x,y,-random()*12);
      const brightness=random()*0.78;colors.push(brightness+random()*0.21,brightness+random()*0.21,brightness+random()*0.21);sizes.push(random()>0.5?1:0,0);
    }
    this.stars=this.makeMesh(positions,colors,sizes);
    const texture=gl.createTexture()!;gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([255,255,255,255]));
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);this.textures.set('white',texture);
    gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  }
  makeMesh(positions:number[],normals:number[],uv:number[]):Mesh {
    const gl=this.gl,vao=gl.createVertexArray()!;gl.bindVertexArray(vao);
    for(const [index,data,size] of [[0,positions,3],[1,normals,3],[2,uv,2]] as [number,number[],number][]) {
      const buffer=gl.createBuffer()!;gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);
      gl.enableVertexAttribArray(index);gl.vertexAttribPointer(index,size,gl.FLOAT,false,0,0);
    }
    return {vao,count:positions.length/3};
  }
  async load() {
    const assetBase=import.meta.env.BASE_URL+'assets/';
    const manifest=await fetch(assetBase+'manifest.json').then(r=>{if(!r.ok)throw new Error('Asset manifest unavailable');return r.json();}) as {file:string}[];
    await Promise.all(manifest.map(async({file})=>{
      if(file.endsWith('.vmdl')){
        const response=await fetch(assetBase+file);if(!response.ok)throw new Error('Missing mesh: '+file);
        const lines=(await response.text()).trim().split(/\r?\n/),faces=Number(lines[0]);
        const numbers=(line:string,count:number)=>line.split(',').slice(0,count).map(Number);
        const p=numbers(lines[1],faces*9),n=numbers(lines[2],faces*9),uv=numbers(lines[3],faces*6);
        if(p.length!==faces*9||n.length!==faces*9||uv.length!==faces*6||[...p,...n,...uv].some(v=>!Number.isFinite(v)))throw new Error('Invalid mesh: '+file);
        this.meshes.set(file.slice(0,-5),this.makeMesh(p,n,uv));
      }else{
        const img=new Image();img.src=assetBase+file;await img.decode();
        const gl=this.gl,texture=gl.createTexture()!;gl.bindTexture(gl.TEXTURE_2D,texture);
        // .vmdl UVs already have V inverted by Tools/convert_model.rb.
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);
        gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.generateMipmap(gl.TEXTURE_2D);
        this.textures.set(file,texture);
      }
    }));
  }
  draw(mesh:Mesh,texture:string,projection:Mat4,model:Mat4,color:Color=white,uv:Color=[0,0,1,1],lit=false,add=false,points=false) {
    const gl=this.gl;
    gl.uniformMatrix4fv(this.uniforms.Projection,false,projection);gl.uniformMatrix4fv(this.uniforms.Model,false,model);
    gl.uniform4fv(this.uniforms.Color,color);gl.uniform4fv(this.uniforms.UV,uv);
    gl.uniform1f(this.uniforms.Lighting,lit?1:0);gl.uniform1f(this.uniforms.Points,points?1:0);
    gl.bindTexture(gl.TEXTURE_2D,this.textures.get(texture)!);gl.bindVertexArray(mesh.vao);
    gl.blendFunc(gl.SRC_ALPHA,add?gl.ONE:gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArrays(points?gl.POINTS:gl.TRIANGLES,0,mesh.count);this.drawCalls++;
  }
  sprite(texture:string,projection:Mat4,x:number,y:number,z:number,size:number,angle=0,color:Color=white,uv:Color=[0,0,1,1],add=false) {
    this.draw(this.quad,texture,projection,compose(translation(x,y,z),rotation(angle),scaling(size,size,1)),color,uv,false,add);
  }
  hudRect(x:number,y:number,w:number,h:number,tx=0,ty=0,tw=256,th=256,color:Color=white,texture='UIAtlas@2x.png') {
    this.draw(this.quad,texture,orthographic(),compose(translation(x+w/2,y+h/2,0),scaling(w,-h,1)),color,[tx/256,ty/256,tw/256,th/256]);
  }
  render(battle:Battle,alpha:number) {
    const gl=this.gl,canvas=this.canvas,dpr=Math.min(devicePixelRatio||1,3);
    const width=Math.round(canvas.clientWidth*dpr),height=Math.round(canvas.clientHeight*dpr);
    if(width!==canvas.width||height!==canvas.height){canvas.width=width;canvas.height=height;}
    gl.viewport(0,0,width,height);gl.clearColor(0,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.useProgram(this.program);gl.uniform1f(this.uniforms.PixelRatio,dpr);this.drawCalls=0;
    const p=battle.player,x=p.px+(p.x-p.px)*alpha,y=p.py+(p.y-p.py)*alpha;
    const camera=battle.previousCameraAngle+angleDifference(battle.previousCameraAngle,battle.cameraAngle)*alpha;
    const heightZ=32,tilt=25+(1-(heightZ-8)/32)*10;
    const projection=compose(perspective(),translation(0,-0.08*heightZ,-heightZ),rotation(-tilt,'x'),rotation(-camera),translation(-x,-y,0));
    gl.disable(gl.DEPTH_TEST);gl.depthMask(false);
    this.draw(this.stars,'white',projection,identity(),white,[0,0,1,1],false,false,true);
    gl.enable(gl.DEPTH_TEST);gl.depthMask(true);
    for(const s of battle.ships) {
      if(s.armor<=0)continue;
      const sx=s.px+(s.x-s.px)*alpha,sy=s.py+(s.y-s.py)*alpha;
      const angle=s.previousAngle+angleDifference(s.previousAngle,s.angle)*alpha;
      const model=compose(translation(sx,sy,0),rotation(angle),rotation(s.bank,'y'),scaling(s.def.size));
      for(const part of s.def.model)this.draw(this.meshes.get(part.modelName)!,part.texture,projection,model,white,[0,0,1,1],true);
      gl.depthMask(false);
      if(s.def.thrusterModelName&&s.thruster>0)this.draw(this.meshes.get(s.def.thrusterModelName)!,s.def.thrusterTexture,projection,model,[1,1,1,s.thruster],[0,0,1,1],false,true);
      gl.depthMask(true);
    }
    gl.disable(gl.DEPTH_TEST);gl.depthMask(false);
    for(const s of battle.ships)if(s.armor>0&&s.shieldFlash>0){
      const ratio=s.shields/s.def.shields;
      this.sprite('ShieldBubble.png',projection,s.px+(s.x-s.px)*alpha,s.py+(s.y-s.py)*alpha,0.2,s.def.size*4,s.angle,[1,ratio,ratio,s.shieldFlash]);
    }
    for(const p of battle.projectiles) {
      const [u,v]=p.def.projectileImage.split(',').map(Number);
      const opacity=Math.min(1,2*(1-p.age/p.def.lifetime));
      this.sprite('Projectiles.png',projection,p.px+(p.x-p.px)*alpha,p.py+(p.y-p.py)*alpha,p.z,p.def.projectileSize,p.angle,[1,1,1,opacity],[u/4,v/4,0.25,0.25],true);
    }
    for(const e of battle.effects) {
      const progress=e.age/e.life,span=1/Math.sqrt(e.frames),frame=progress*e.frames,first=Math.floor(frame),blend=frame-first;
      const size=e.size*(1+2*(1-(1-progress)**2));
      for(let i=0;i<2;i++) {
        const f=first+i;if(f>=e.frames)continue;
        this.sprite(e.texture,projection,e.x,e.y,0.3,size,e.angle,[1,1,1,i?1-(blend-1)**2:1-blend**2],[(f%Math.sqrt(e.frames))*span,Math.floor(f/Math.sqrt(e.frames))*span,span,span],true);
      }
    }
    this.hud(battle,camera);gl.depthMask(true);
  }
  hud(battle:Battle,camera:number) {
    this.hudRect(0,208,112,112,0,144,112,112);
    this.hudRect(422,146,58,174,198,82,58,174);
    this.hudRect(0,0,81,81,0,50,81,81);
    this.hudRect(431,4,43,126,112,98,43,126);
    const gauge=(x:number,y:number,w:number,h:number,tx:number,ty:number,tw:number,th:number,value:number)=>{
      const v=Math.max(0,Math.min(1,value));if(v)this.hudRect(x,y+h*(1-v),w,h*v,tx,ty+th*(1-v),tw,th*v);
    };
    const p=battle.player;
    gauge(435,12,10,90,147,0,10,90,p.energy/p.def.energy);
    gauge(452,8,18,98,167,0,18,98,p.shields/p.def.shields);
    this.hudRect(454,10,14,93,157,98,14,93);
    gauge(456,12,10,90,157,0,10,90,p.armor/p.def.armor);
    const feedback:Record<string,[number,number]>={thrust:[28,236],reverse:[28,292],brake:[84,292],a:[452,180],b:[452,236],c:[452,292]};
    if(p.armor>0)for(const control of battle.controls){const [x,y]=feedback[control];this.hudRect(x-64,y-64,128,128,41,0,50,50);}
    this.hudRect(39.5,39.5,2,2,0,0,256,256,[0.5,0.8,1,1],'white');
    for(const s of battle.ships) {
      if(s.id===0||s.armor<=0)continue;
      let dx=(s.x-p.x)*0.5,dy=(s.y-p.y)*0.5;const d=Math.hypot(dx,dy);if(d>32){dx*=32/d;dy*=32/d;}
      const q=rotate(dx,dy,-camera);this.hudRect(39.5+q.x,39.5-q.y,2,2,0,0,256,256,[1,0.15,0.05,1],'white');
    }
  }
}
