import { readFile } from 'node:fs/promises';

const ENTITIES = new Map([
  ['amp', '&'],
  ['apos', "'"],
  ['gt', '>'],
  ['lt', '<'],
  ['quot', '"'],
]);

function decodeXml(value) {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (_, entity) => {
    if (entity.startsWith('#x')) return String.fromCodePoint(Number.parseInt(entity.slice(2), 16));
    if (entity.startsWith('#')) return String.fromCodePoint(Number.parseInt(entity.slice(1), 10));
    const decoded = ENTITIES.get(entity);
    if (decoded === undefined) throw new Error(`Unsupported XML entity: &${entity};`);
    return decoded;
  });
}

function tokenize(xml) {
  const body = xml
    .replace(/^\uFEFF/, '')
    .replace(/<\?xml[\s\S]*?\?>/g, '')
    .replace(/<!DOCTYPE[\s\S]*?>/g, '')
    .replace(/<!--([\s\S]*?)-->/g, '');
  return body.match(/<[^>]+>|[^<]+/g) ?? [];
}

export function parsePlist(xml) {
  const tokens = tokenize(xml);
  let cursor = 0;

  const skipWhitespace = () => {
    while (cursor < tokens.length && !tokens[cursor].trim()) cursor += 1;
  };

  const expect = (expected) => {
    skipWhitespace();
    const actual = tokens[cursor];
    if (actual !== expected) throw new Error(`Expected ${expected}, found ${actual ?? 'end of input'}`);
    cursor += 1;
  };

  const readTextElement = (tag) => {
    expect(`<${tag}>`);
    const chunks = [];
    while (cursor < tokens.length && tokens[cursor] !== `</${tag}>`) {
      chunks.push(tokens[cursor]);
      cursor += 1;
    }
    expect(`</${tag}>`);
    return decodeXml(chunks.join(''));
  };

  const readValue = () => {
    skipWhitespace();
    const token = tokens[cursor];
    if (token === '<dict>') {
      cursor += 1;
      const result = {};
      skipWhitespace();
      while (tokens[cursor] !== '</dict>') {
        const key = readTextElement('key');
        result[key] = readValue();
        skipWhitespace();
      }
      cursor += 1;
      return result;
    }
    if (token === '<array>') {
      cursor += 1;
      const result = [];
      skipWhitespace();
      while (tokens[cursor] !== '</array>') {
        result.push(readValue());
        skipWhitespace();
      }
      cursor += 1;
      return result;
    }
    if (token === '<dict/>') { cursor += 1; return {}; }
    if (token === '<array/>') { cursor += 1; return []; }
    if (token === '<string/>') { cursor += 1; return ''; }
    if (token === '<true/>') { cursor += 1; return true; }
    if (token === '<false/>') { cursor += 1; return false; }
    if (token === '<string>') return readTextElement('string');
    if (token === '<integer>') return Number.parseInt(readTextElement('integer'), 10);
    if (token === '<real>') return Number.parseFloat(readTextElement('real'));
    throw new Error(`Unsupported plist value at token ${cursor}: ${token ?? 'end of input'}`);
  };

  skipWhitespace();
  if (!tokens[cursor]?.startsWith('<plist')) throw new Error('Expected a plist document');
  cursor += 1;
  const value = readValue();
  skipWhitespace();
  expect('</plist>');
  skipWhitespace();
  if (cursor !== tokens.length) throw new Error('Unexpected content after plist');
  return value;
}

export async function readPlist(path) {
  return parsePlist(await readFile(path, 'utf8'));
}
