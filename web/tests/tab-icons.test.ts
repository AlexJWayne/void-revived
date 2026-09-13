import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { tabIconStyle } from '../src/hyperspace/model.ts';

describe('hyperspace tab icon rendering', () => {
  it('uses source alpha as a tintable mask instead of displaying source RGB pixels', () => {
    const style = tabIconStyle('/content/GalaxyMapTab.png');

    assert.equal(style.maskImage, 'url("/content/GalaxyMapTab.png")');
    assert.equal(style.WebkitMaskImage, style.maskImage);
    assert.equal('backgroundImage' in style, false);
  });
});
