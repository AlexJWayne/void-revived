export interface VmdlMesh {
  readonly faceCount: number;
  readonly positions: Float32Array;
  readonly normals: Float32Array;
  readonly textureCoordinates: Float32Array;
}

function components(line: string, expected: number, label: string): Float32Array {
  const values = Float32Array.from(line.split(','), Number);
  if (values.length !== expected || values.some((value) => !Number.isFinite(value))) {
    throw new Error(`Invalid VMdl ${label}: expected ${expected} finite components`);
  }
  return values;
}

export function parseVmdl(source: string): VmdlMesh {
  const lines = source.trim().split(/\r?\n/);
  if (lines.length !== 4) throw new Error('Invalid VMdl: expected four lines');
  const faceCount = Number.parseInt(lines[0] ?? '', 10);
  if (!Number.isInteger(faceCount) || faceCount < 0) throw new Error('Invalid VMdl face count');
  return {
    faceCount,
    positions: components(lines[1] ?? '', faceCount * 9, 'positions'),
    normals: components(lines[2] ?? '', faceCount * 9, 'normals'),
    textureCoordinates: components(lines[3] ?? '', faceCount * 6, 'texture coordinates'),
  };
}
