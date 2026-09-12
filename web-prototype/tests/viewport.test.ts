import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { fitGame, isLandscapeViewport, resolveViewport } from '../src/layout.ts';

test('the game letterboxes inside the visible iPhone landscape area',()=>{
  // The supplied screenshot is 2622x1206 physical pixels: 874x402 CSS px at 3x.
  const size=fitGame(874,402);
  assert.equal(size.width,603);
  assert.equal(size.height,402);
  assert.equal((874-size.width)/2,135.5);
});

test('a relaunched standalone app ignores a stale square layout viewport',()=>{
  const viewport=resolveViewport({
    layout:{width:874,height:874},
    visual:{width:874,height:402},
    screen:{width:874,height:402},
    standalone:true,
    landscape:true
  });
  const size=fitGame(viewport.width,viewport.height);
  assert.deepEqual(viewport,{width:874,height:402});
  assert.deepEqual(size,{width:603,height:402});
});

test('the physical screen still caps a stale visual viewport after relaunch',()=>{
  const viewport=resolveViewport({
    layout:{width:874,height:874},
    visual:{width:874,height:874},
    // Some WebKit versions expose screen dimensions in natural portrait order.
    screen:{width:402,height:874},
    standalone:true,
    landscape:true
  });
  assert.deepEqual(viewport,{width:874,height:402});
});

test('orientation identifies landscape while restored dimensions are stale',()=>{
  assert.equal(isLandscapeViewport(874,874,90),true);
  assert.equal(isLandscapeViewport(874,874,-90),true);
});

test('an installed iOS web app opts into the correct full-screen viewport',()=>{
  const index=readFileSync(fileURLToPath(new URL('../index.html',import.meta.url)),'utf8');
  assert.match(index,/<meta\s+name="apple-mobile-web-app-capable"\s+content="yes"\s*\/?>/i);
  assert.match(index,/<meta\s+name="apple-mobile-web-app-status-bar-style"\s+content="black-translucent"\s*\/?>/i);
});

test('the game exposes an always-available restart button',()=>{
  const index=readFileSync(fileURLToPath(new URL('../index.html',import.meta.url)),'utf8');
  assert.match(index,/<button\s+id="restart"\s+type="button">Restart<\/button>/i);
});
