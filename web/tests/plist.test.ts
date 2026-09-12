import assert from 'node:assert/strict';
import test from 'node:test';
// The build-time parser is plain JavaScript so the asset command can run before TypeScript compilation.
// @ts-expect-error No declaration file is needed by the production application.
import { parsePlist } from '../scripts/lib/plist.mjs';

test('parses the XML plist value types used by the Original Game', () => {
  const value = parsePlist(`<?xml version="1.0"?><plist version="1.0"><dict>
    <key>name</key><string>A &amp; B</string>
    <key>count</key><integer>3</integer>
    <key>ratio</key><real>1.5</real>
    <key>flags</key><array><true/><false/></array>
    <key>empty</key><string/>
  </dict></plist>`);
  assert.deepEqual(value, { name: 'A & B', count: 3, ratio: 1.5, flags: [true, false], empty: '' });
});
