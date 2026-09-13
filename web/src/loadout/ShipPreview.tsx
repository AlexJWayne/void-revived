import { useEffect, useRef } from 'preact/hooks';

import { parseVmdl } from '../assets/vmdl.ts';
import {
  chooseTexture,
  contentUrl,
  resolveModelAsset,
  resolveTextureAsset,
  type ContentManifest,
} from '../content/manifest.ts';
import type { ShipDefinition } from './model.ts';

interface ShipPreviewProps {
  readonly manifest: ContentManifest;
  readonly ship: ShipDefinition;
}

interface Drawable {
  readonly count: number;
  readonly position: WebGLBuffer;
  readonly normal: WebGLBuffer;
  readonly uv: WebGLBuffer;
  readonly texture: WebGLTexture;
  readonly style: string;
}

export function ShipPreview({ manifest, ship }: ShipPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl2', { alpha: false, antialias: true, depth: true });
    if (!gl) return;

    let stopped = false;
    let frame = 0;
    let drawables: Drawable[] = [];
    const program = createProgram(gl);
    const positionLocation = gl.getAttribLocation(program, 'aPosition');
    const normalLocation = gl.getAttribLocation(program, 'aNormal');
    const uvLocation = gl.getAttribLocation(program, 'aUv');
    const matrixLocation = gl.getUniformLocation(program, 'uMatrix');
    const modelLocation = gl.getUniformLocation(program, 'uModel');
    const opacityLocation = gl.getUniformLocation(program, 'uOpacity');
    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(canvas.clientWidth * ratio));
      const height = Math.max(1, Math.round(canvas.clientHeight * ratio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, width, height);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    void Promise.all(ship.model.map(async (part) => {
      const modelAsset = resolveModelAsset(manifest, part.modelName);
      const textureAsset = chooseTexture(resolveTextureAsset(manifest, part.texture));
      const [modelResponse, image] = await Promise.all([
        fetch(contentUrl(modelAsset.url)).then((response) => {
          if (!response.ok) throw new Error(`Unable to load ${part.modelName}`);
          return response.text();
        }),
        loadImage(contentUrl(textureAsset.url)),
      ]);
      if (stopped) return null;
      const mesh = parseVmdl(modelResponse);
      return {
        count: mesh.faceCount * 3,
        position: buffer(gl, mesh.positions),
        normal: buffer(gl, mesh.normals),
        uv: buffer(gl, mesh.textureCoordinates),
        texture: texture(gl, image),
        style: part.style,
      } satisfies Drawable;
    })).then((parts) => {
      if (!stopped) drawables = parts.filter((part): part is Drawable => Boolean(part));
    }).catch(() => {
      drawables = [];
    });

    const draw = (time: number) => {
      resize();
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);
      gl.useProgram(program);
      const aspect = canvas.width / canvas.height;
      const model = multiply(rotationX(-Math.PI / 4), multiply(rotationZ(-time / 2600), scaling(1 / Math.max(ship.size, 0.01))));
      const matrix = multiply(perspective(Math.PI / 3, aspect, 0.1, 50), multiply(translation(0, 0, -5), model));
      gl.uniformMatrix4fv(matrixLocation, false, matrix);
      gl.uniformMatrix4fv(modelLocation, false, model);

      for (const drawable of drawables) {
        attribute(gl, positionLocation, drawable.position, 3);
        attribute(gl, normalLocation, drawable.normal, 3);
        attribute(gl, uvLocation, drawable.uv, 2);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, drawable.texture);
        if (drawable.style === 'opaque') {
          gl.disable(gl.BLEND);
          gl.depthMask(true);
        } else {
          gl.enable(gl.BLEND);
          gl.blendFunc(gl.SRC_ALPHA, drawable.style === 'add' ? gl.ONE : gl.ONE_MINUS_SRC_ALPHA);
          gl.depthMask(false);
        }
        gl.uniform1f(opacityLocation, drawable.style === 'pulse' ? 0.55 + Math.sin(time / 240) * 0.35 : 1);
        gl.drawArrays(gl.TRIANGLES, 0, drawable.count);
      }
      gl.depthMask(true);
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);

    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      for (const drawable of drawables) {
        gl.deleteBuffer(drawable.position);
        gl.deleteBuffer(drawable.normal);
        gl.deleteBuffer(drawable.uv);
        gl.deleteTexture(drawable.texture);
      }
      gl.deleteProgram(program);
    };
  }, [manifest, ship]);

  return <canvas ref={canvasRef} class="ship-preview" aria-label="Rotating ship preview" />;
}

function createProgram(gl: WebGL2RenderingContext): WebGLProgram {
  const vertex = shader(gl, gl.VERTEX_SHADER, `#version 300 es
    in vec3 aPosition;
    in vec3 aNormal;
    in vec2 aUv;
    uniform mat4 uMatrix;
    uniform mat4 uModel;
    out vec3 vNormal;
    out vec2 vUv;
    void main() {
      gl_Position = uMatrix * vec4(aPosition, 1.0);
      vNormal = mat3(uModel) * aNormal;
      vUv = aUv;
    }
  `);
  const fragment = shader(gl, gl.FRAGMENT_SHADER, `#version 300 es
    precision mediump float;
    in vec3 vNormal;
    in vec2 vUv;
    uniform sampler2D uTexture;
    uniform float uOpacity;
    out vec4 color;
    void main() {
      vec4 surface = texture(uTexture, vUv);
      float light = 0.45 + 0.75 * max(dot(normalize(vNormal), normalize(vec3(1.0, -0.5, 0.5))), 0.0);
      color = vec4(surface.rgb * light, surface.a * uOpacity);
    }
  `);
  const program = gl.createProgram();
  if (!program) throw new Error('Unable to create ship preview program');
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? 'Unable to link ship preview');
  return program;
}

function shader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const result = gl.createShader(type);
  if (!result) throw new Error('Unable to create ship preview shader');
  gl.shaderSource(result, source);
  gl.compileShader(result);
  if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(result) ?? 'Unable to compile ship preview shader');
  return result;
}

function buffer(gl: WebGL2RenderingContext, values: Float32Array): WebGLBuffer {
  const result = gl.createBuffer();
  if (!result) throw new Error('Unable to create ship preview buffer');
  gl.bindBuffer(gl.ARRAY_BUFFER, result);
  gl.bufferData(gl.ARRAY_BUFFER, values, gl.STATIC_DRAW);
  return result;
}

function texture(gl: WebGL2RenderingContext, image: HTMLImageElement): WebGLTexture {
  const result = gl.createTexture();
  if (!result) throw new Error('Unable to create ship preview texture');
  gl.bindTexture(gl.TEXTURE_2D, result);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  return result;
}

function attribute(gl: WebGL2RenderingContext, location: number, value: WebGLBuffer, size: number) {
  gl.bindBuffer(gl.ARRAY_BUFFER, value);
  gl.enableVertexAttribArray(location);
  gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Unable to load ${url}`));
    image.src = url;
  });
}

type Matrix = Float32Array;

function multiply(a: Matrix, b: Matrix): Matrix {
  const result = new Float32Array(16);
  for (let column = 0; column < 4; column++) {
    for (let row = 0; row < 4; row++) {
      result[column * 4 + row] = a[row]! * b[column * 4]!
        + a[4 + row]! * b[column * 4 + 1]!
        + a[8 + row]! * b[column * 4 + 2]!
        + a[12 + row]! * b[column * 4 + 3]!;
    }
  }
  return result;
}

function perspective(fov: number, aspect: number, near: number, far: number): Matrix {
  const f = 1 / Math.tan(fov / 2);
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) / (near - far), -1,
    0, 0, (2 * far * near) / (near - far), 0,
  ]);
}

function translation(x: number, y: number, z: number): Matrix {
  return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]);
}

function scaling(value: number): Matrix {
  return new Float32Array([value, 0, 0, 0, 0, value, 0, 0, 0, 0, value, 0, 0, 0, 0, 1]);
}

function rotationX(angle: number): Matrix {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]);
}

function rotationZ(angle: number): Matrix {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return new Float32Array([c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
}
