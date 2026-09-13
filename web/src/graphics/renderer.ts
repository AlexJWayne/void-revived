import { parseVmdl, type VmdlMesh } from '../assets/vmdl.ts';
import { chooseTexture, contentUrl, resolveModelAsset, resolveTextureAsset, type ContentManifest } from '../content/manifest.ts';
import { Matrix4 } from './matrix.ts';

export type Color = readonly [number, number, number, number];
export type TextureFrame = readonly [number, number, number, number];
export type Blend = 'alpha' | 'add' | 'light';

interface Model3D {
  readonly vertexArray: WebGLVertexArrayObject;
  readonly count: number;
}

const vertexSource = `#version 300 es
layout(location = 0) in vec3 position;
layout(location = 1) in vec3 normal;
layout(location = 2) in vec2 textureCoordinate;
uniform mat4 projection;
uniform mat4 model;
uniform vec4 textureFrame;
uniform bool lit;
uniform vec3 lightDirection;
out vec2 uv;
out vec3 illumination;
void main() {
  gl_Position = projection * model * vec4(position, 1.0);
  uv = textureFrame.xy + textureCoordinate * textureFrame.zw;
  illumination = vec3(1.0);
  if (lit) {
    vec3 n = normalize(mat3(model) * normal);
    vec3 light = normalize(lightDirection);
    float diffuse = max(dot(n, light), 0.0);
    vec3 halfVector = normalize(light + vec3(0.0, 0.0, 1.0));
    float specular = diffuse > 0.0 ? pow(max(dot(n, halfVector), 0.0), 90.0) : 0.0;
    illumination = min(vec3(1.0), vec3(0.3 + diffuse + specular));
  }
}`;

const fragmentSource = `#version 300 es
precision highp float;
uniform sampler2D surface;
uniform vec4 tint;
in vec2 uv;
in vec3 illumination;
out vec4 color;
void main() {
  color = texture(surface, uv) * tint * vec4(illumination, 1.0);
}`;

const pointVertexSource = `#version 300 es
layout(location = 0) in vec3 position;
layout(location = 1) in vec4 pointColor;
layout(location = 2) in float pointSize;
uniform mat4 projection;
uniform float scale;
out vec4 tint;
void main() {
  gl_Position = projection * vec4(position, 1.0);
  gl_PointSize = pointSize * scale;
  tint = pointColor;
}`;

const pointFragmentSource = `#version 300 es
precision highp float;
in vec4 tint;
out vec4 color;
void main() {
  float radius = length(gl_PointCoord - vec2(0.5));
  float coverage = 1.0 - smoothstep(0.5 - fwidth(radius), 0.5, radius);
  color = vec4(tint.rgb, tint.a * coverage);
}`;

/** Owns one WebGL context's shaders, meshes, textures, and draw state. */
export class Renderer {
  readonly canvas: HTMLCanvasElement;
  readonly gl: WebGL2RenderingContext;
  readonly manifest: ContentManifest;
  projection = new Matrix4();
  lightDirection: readonly [number, number, number] = [-1, 0, 0.75];
  private readonly program: WebGLProgram;
  private readonly pointProgram: WebGLProgram;
  private readonly uniforms: Record<string, WebGLUniformLocation | null>;
  private readonly pointProjection: WebGLUniformLocation | null;
  private readonly pointScale: WebGLUniformLocation | null;
  private readonly quad: Model3D;
  private readonly pointArray: WebGLVertexArrayObject;
  private readonly pointBuffer: WebGLBuffer;
  private readonly models = new Map<string, Model3D>();
  private readonly textures = new Map<string, WebGLTexture>();
  private readonly pending = new Map<string, Promise<void>>();
  private readonly buffers: WebGLBuffer[] = [];
  private readonly vertexArrays: WebGLVertexArrayObject[] = [];
  private disposed = false;

  constructor(canvas: HTMLCanvasElement, manifest: ContentManifest) {
    this.canvas = canvas;
    this.manifest = manifest;
    const gl = canvas.getContext('webgl2', { alpha: false, antialias: true, depth: true });
    if (!gl) throw new Error('WebGL 2 is unavailable.');
    this.gl = gl;
    this.program = createProgram(gl, vertexSource, fragmentSource);
    this.pointProgram = createProgram(gl, pointVertexSource, pointFragmentSource);
    this.uniforms = Object.fromEntries(['projection', 'model', 'textureFrame', 'lit', 'lightDirection', 'tint']
      .map((name) => [name, gl.getUniformLocation(this.program, name)]));
    this.pointProjection = gl.getUniformLocation(this.pointProgram, 'projection');
    this.pointScale = gl.getUniformLocation(this.pointProgram, 'scale');
    this.quad = this.createModel({ faceCount: 0,
      positions: new Float32Array([0, 1, 0, 1, 1, 0, 0, 0, 0, 1, 0, 0]),
      normals: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]),
      textureCoordinates: new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]),
    }, 4);
    this.pointArray = this.createVertexArray();
    gl.bindVertexArray(this.pointArray);
    this.pointBuffer = this.createBuffer(new Float32Array());
    for (const [location, size, offset] of [[0, 3, 0], [1, 4, 12], [2, 1, 28]]) {
      gl.enableVertexAttribArray(location!);
      gl.vertexAttribPointer(location!, size!, gl.FLOAT, false, 32, offset!);
    }
    gl.bindVertexArray(null);
    gl.enable(gl.BLEND);
  }

  loadModel(name: string): Promise<void> {
    return this.loadOnce(`model:${name}`, async () => {
      const asset = resolveModelAsset(this.manifest, name);
      const response = await fetch(contentUrl(asset.url));
      if (!response.ok) throw new Error(`Unable to load model ${name}`);
      const mesh = parseVmdl(await response.text());
      if (!this.disposed) this.models.set(name, this.createModel(mesh));
    });
  }

  loadTexture(name: string): Promise<void> {
    return this.loadOnce(`texture:${name}`, async () => {
      const fileName = name.endsWith('.png') ? name : `${name}.png`;
      const asset = chooseTexture(resolveTextureAsset(this.manifest, fileName));
      const image = new Image();
      image.src = contentUrl(asset.url);
      await image.decode();
      if (this.disposed) return;
      const gl = this.gl;
      const texture = gl.createTexture();
      if (!texture) throw new Error(`Unable to allocate texture ${name}`);
      this.textures.set(name, texture);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      // VMdl UVs are already flipped by convert_model.rb. HUD frames use top-left PNG coordinates.
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    });
  }

  private loadOnce(key: string, load: () => Promise<void>): Promise<void> {
    let pending = this.pending.get(key);
    if (!pending) { pending = load(); this.pending.set(key, pending); }
    return pending;
  }

  resize(): void {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.round(this.canvas.clientWidth * ratio));
    const height = Math.max(1, Math.round(this.canvas.clientHeight * ratio));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    this.gl.viewport(0, 0, width, height);
  }

  clear(red = 0, green = 0, blue = 0): void {
    this.gl.depthMask(true);
    this.gl.clearColor(red, green, blue, 1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  }

  depthTest(enabled: boolean): void {
    if (enabled) { this.gl.enable(this.gl.DEPTH_TEST); this.gl.enable(this.gl.CULL_FACE); }
    else { this.gl.disable(this.gl.DEPTH_TEST); this.gl.disable(this.gl.CULL_FACE); }
  }

  drawModel(name: string, texture: string, model: Matrix4, lit: boolean, alpha = 1, blend: Blend = 'alpha'): void {
    const mesh = this.models.get(name);
    if (!mesh) throw new Error(`Model was not loaded: ${name}`);
    this.prepareDraw(texture, model, [0, 0, 1, 1], [1, 1, 1, alpha], lit, blend);
    this.gl.bindVertexArray(mesh.vertexArray);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, mesh.count);
  }

  drawQuad(texture: string, model: Matrix4, frame: TextureFrame = [0, 0, 1, 1], tint: Color = [1, 1, 1, 1], blend: Blend = 'alpha'): void {
    this.prepareDraw(texture, model, frame, tint, false, blend);
    this.gl.bindVertexArray(this.quad.vertexArray);
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
  }

  drawPoints(points: Float32Array | readonly number[]): void {
    if (points.length === 0) return;
    const gl = this.gl;
    gl.useProgram(this.pointProgram);
    gl.uniformMatrix4fv(this.pointProjection, false, this.projection.values);
    gl.uniform1f(this.pointScale, this.canvas.width / 480);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.bindVertexArray(this.pointArray);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.pointBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, points instanceof Float32Array ? points : new Float32Array(points), gl.DYNAMIC_DRAW);
    gl.drawArrays(gl.POINTS, 0, points.length / 8);
  }

  private prepareDraw(textureName: string, model: Matrix4, frame: TextureFrame, tint: Color, lit: boolean, blend: Blend): void {
    const gl = this.gl;
    const texture = this.textures.get(textureName);
    if (!texture) throw new Error(`Texture was not loaded: ${textureName}`);
    gl.useProgram(this.program);
    gl.uniformMatrix4fv(this.uniforms.projection!, false, this.projection.values);
    gl.uniformMatrix4fv(this.uniforms.model!, false, model.values);
    gl.uniform4f(this.uniforms.textureFrame!, ...frame);
    gl.uniform4f(this.uniforms.tint!, ...tint);
    gl.uniform1i(this.uniforms.lit!, lit ? 1 : 0);
    gl.uniform3f(this.uniforms.lightDirection!, ...this.lightDirection);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.blendFunc(blend === 'add' ? gl.ONE : gl.SRC_ALPHA, blend === 'alpha' ? gl.ONE_MINUS_SRC_ALPHA : gl.ONE);
  }

  private createModel(mesh: VmdlMesh, count = mesh.faceCount * 3): Model3D {
    const gl = this.gl;
    const vertexArray = this.createVertexArray();
    gl.bindVertexArray(vertexArray);
    const attributes = [mesh.positions, mesh.normals, mesh.textureCoordinates];
    attributes.forEach((data, location) => {
      this.createBuffer(data);
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, location === 2 ? 2 : 3, gl.FLOAT, false, 0, 0);
    });
    gl.bindVertexArray(null);
    return { vertexArray, count };
  }

  private createBuffer(data: Float32Array): WebGLBuffer {
    const buffer = this.gl.createBuffer();
    if (!buffer) throw new Error('Unable to allocate graphics buffer');
    this.buffers.push(buffer);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.STATIC_DRAW);
    return buffer;
  }

  private createVertexArray(): WebGLVertexArrayObject {
    const array = this.gl.createVertexArray();
    if (!array) throw new Error('Unable to allocate vertex array');
    this.vertexArrays.push(array);
    return array;
  }

  dispose(): void {
    this.disposed = true;
    for (const buffer of this.buffers) this.gl.deleteBuffer(buffer);
    for (const array of this.vertexArrays) this.gl.deleteVertexArray(array);
    for (const texture of this.textures.values()) this.gl.deleteTexture(texture);
    this.gl.deleteProgram(this.program);
    this.gl.deleteProgram(this.pointProgram);
  }
}

function createProgram(gl: WebGL2RenderingContext, vertexSource: string, fragmentSource: string): WebGLProgram {
  const program = gl.createProgram();
  if (!program) throw new Error('Unable to allocate shader program');
  for (const [type, source] of [[gl.VERTEX_SHADER, vertexSource], [gl.FRAGMENT_SHADER, fragmentSource]] as const) {
    const shader = gl.createShader(type);
    if (!shader) throw new Error('Unable to allocate shader');
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const message = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      gl.deleteProgram(program);
      throw new Error(message ?? 'Unable to compile shader');
    }
    gl.attachShader(program, shader);
    gl.deleteShader(shader);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(message ?? 'Unable to link shader');
  }
  return program;
}
