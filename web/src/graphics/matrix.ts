/** Column-major OpenGL matrices, with operations applied in source-code order. */
export class Matrix4 {
  readonly values: Float32Array;

  constructor(values = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]) {
    this.values = new Float32Array(values);
  }

  multiply(other: Matrix4): this {
    const left = this.values.slice();
    const right = other.values;
    for (let column = 0; column < 4; column += 1) {
      for (let row = 0; row < 4; row += 1) {
        this.values[column * 4 + row] = left[row]! * right[column * 4]!
          + left[4 + row]! * right[column * 4 + 1]!
          + left[8 + row]! * right[column * 4 + 2]!
          + left[12 + row]! * right[column * 4 + 3]!;
      }
    }
    return this;
  }

  translate(x: number, y: number, z = 0): this {
    return this.multiply(new Matrix4([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]));
  }

  scale(x: number, y = x, z = x): this {
    return this.multiply(new Matrix4([x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1]));
  }

  rotateX(degrees: number): this {
    const cosine = Math.cos(degrees * Math.PI / 180);
    const sine = Math.sin(degrees * Math.PI / 180);
    return this.multiply(new Matrix4([1, 0, 0, 0, 0, cosine, sine, 0, 0, -sine, cosine, 0, 0, 0, 0, 1]));
  }

  rotateY(degrees: number): this {
    const cosine = Math.cos(degrees * Math.PI / 180);
    const sine = Math.sin(degrees * Math.PI / 180);
    return this.multiply(new Matrix4([cosine, 0, -sine, 0, 0, 1, 0, 0, sine, 0, cosine, 0, 0, 0, 0, 1]));
  }

  rotateZ(degrees: number): this {
    const cosine = Math.cos(degrees * Math.PI / 180);
    const sine = Math.sin(degrees * Math.PI / 180);
    return this.multiply(new Matrix4([cosine, sine, 0, 0, -sine, cosine, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]));
  }

  static frustum(left: number, right: number, bottom: number, top: number, near: number, far: number): Matrix4 {
    return new Matrix4([
      2 * near / (right - left), 0, 0, 0,
      0, 2 * near / (top - bottom), 0, 0,
      (right + left) / (right - left), (top + bottom) / (top - bottom), -(far + near) / (far - near), -1,
      0, 0, -2 * far * near / (far - near), 0,
    ]);
  }

  static orthographic(left: number, right: number, bottom: number, top: number): Matrix4 {
    return new Matrix4([
      2 / (right - left), 0, 0, 0,
      0, 2 / (top - bottom), 0, 0,
      0, 0, -1, 0,
      -(right + left) / (right - left), -(top + bottom) / (top - bottom), 0, 1,
    ]);
  }
}
