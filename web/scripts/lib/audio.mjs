import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { copyFile, mkdir, readFile, readdir, rename, stat } from 'node:fs/promises';
import path from 'node:path';

const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');

export function loopingEffectNames(weapons, ships) {
  const names = new Set(['Select']); // Settings.xib loops Select while dragging the music slider.
  for (const weapon of Object.values(weapons)) {
    if (weapon.fireSoundLoops && weapon.soundsFire?.[0]) names.add(`Weapon.${weapon.soundsFire[0]}`);
  }
  for (const ship of Object.values(ships)) {
    if (!ship.thrusterSound) continue;
    names.add(`Thruster.${ship.thrusterSound}`);
    names.add(`Thruster.${ship.thrusterSound}.Reverse`);
  }
  return names;
}

async function audioFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await audioFiles(filename));
    else if (filename.endsWith('.caf')) files.push(filename);
  }
  return files.sort();
}

function cafFormat(bytes) {
  if (bytes.toString('ascii', 0, 4) !== 'caff') throw new Error('Expected a CAF audio source');
  for (let offset = 8; offset + 12 <= bytes.length;) {
    const length = Number(bytes.readBigInt64BE(offset + 4));
    if (bytes.toString('ascii', offset, offset + 4) === 'desc') {
      return { sampleRate: bytes.readDoubleBE(offset + 12), channels: bytes.readUInt32BE(offset + 36) };
    }
    if (length < 0) break;
    offset += 12 + length;
  }
  throw new Error('CAF source has no audio format description');
}

function convert(source, destination, format, sourceFormat) {
  const bitrate = sourceFormat.channels === 1 ? 64000 : 128000;
  // Conversion is a build tool only. macOS has afconvert; other hosts use FFmpeg.
  if (process.platform === 'darwin') {
    const options = format === 'wav' ? ['-f', 'WAVE', '-d', `LEI16@${sourceFormat.sampleRate}`]
      : ['-f', 'm4af', '-d', `aac@${sourceFormat.sampleRate}`, '-b', String(bitrate)];
    execFileSync('/usr/bin/afconvert', [...options, source, destination], { stdio: 'pipe' });
  } else {
    const options = format === 'wav' ? ['-c:a', 'pcm_s16le', '-f', 'wav']
      : ['-c:a', 'aac', '-b:a', String(bitrate), '-ar', String(sourceFormat.sampleRate), '-movflags', '+faststart', '-f', 'mp4'];
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', source, '-vn', ...options, destination], { stdio: 'pipe' });
  }
}

export async function buildAudio(repositoryRoot, outputRoot, data) {
  const cache = path.join(repositoryRoot, 'web', '.cache', 'audio');
  await mkdir(cache, { recursive: true });
  await mkdir(path.join(outputRoot, 'audio'), { recursive: true });
  const loops = loopingEffectNames(data.weapons, data.shipTypes);
  const manifest = {};
  for (const source of await audioFiles(path.join(repositoryRoot, 'Assets', 'Audio'))) {
    const name = path.basename(source, '.caf');
    const music = path.basename(path.dirname(source)) === 'Music';
    const format = loops.has(name) ? 'wav' : 'm4a';
    const sourceBytes = await readFile(source);
    const sourceFormat = cafFormat(sourceBytes);
    const sourceHash = hash(sourceBytes);
    const cacheKey = hash(`${sourceHash}:audio-v2:${format}:${process.platform}`);
    const cached = path.join(cache, `${cacheKey}.${format}`);
    if (!await stat(cached).catch(() => null)) {
      const temporary = `${cached}.tmp`;
      try {
        convert(source, temporary, format, sourceFormat);
        await rename(temporary, cached);
      } catch (error) {
        throw new Error(`Cannot convert ${name}. Audio assets require macOS afconvert or FFmpeg with AAC support. ${error.message}`);
      }
    }
    const bytes = await readFile(cached);
    const digest = hash(bytes);
    const filename = `${name}.${digest.slice(0, 12)}.${format}`;
    await copyFile(cached, path.join(outputRoot, 'audio', filename));
    manifest[name] = { url: `audio/${filename}`, source: path.relative(repositoryRoot, source),
      bytes: bytes.length, sha256: digest, kind: music ? 'music' : 'effect', format, ...sourceFormat };
  }
  const required = new Set(['MusicTheme', 'MusicHyperspace', 'MainSelect', 'SwitchTab', 'ChimeIn', 'ChimeOut',
    'Error', 'PlayStage', 'Sell', 'Mount', 'Dismount', 'BuyShip', 'WeaponSwap', 'Select',
    'Hypergate', 'HypergateOpen', 'Pickup.Money', 'Pickup.Weapon', 'Pickup.Equipment']);
  for (const stage of Object.values(data.stages)) if (stage.music) required.add(stage.music);
  for (const ship of Object.values(data.shipTypes)) {
    if (ship.explosionSound) required.add(`Explosion.${ship.explosionSound}`);
  }
  for (const weapon of Object.values(data.weapons)) {
    for (const sound of [...weapon.soundsFire, ...weapon.soundsHit]) required.add(`Weapon.${sound}`);
  }
  for (const name of [...required, ...loops]) {
    // The five inert Neutral Asteroids name these nonexistent sounds. Native loading returns nil.
    if (name === 'Thruster.Neutral' || name === 'Thruster.Neutral.Reverse') continue;
    if (!manifest[name]) throw new Error(`Missing audio asset: ${name}`);
  }
  return manifest;
}
