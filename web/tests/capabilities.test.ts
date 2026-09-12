import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { gateForCapabilities } from '../src/application/capabilities.ts';

describe('the Web Port capability gate', () => {
  it('rejects a browser without WebGL 2 before checking orientation', () => {
    assert.equal(gateForCapabilities({ webgl2: false, landscape: false }).kind, 'unsupported');
  });

  it('asks a supported phone in portrait to rotate', () => {
    assert.equal(gateForCapabilities({ webgl2: true, landscape: false }).kind, 'rotate');
  });

  it('admits a supported landscape viewport', () => {
    assert.deepEqual(gateForCapabilities({ webgl2: true, landscape: true }), { kind: 'ready' });
  });
});
