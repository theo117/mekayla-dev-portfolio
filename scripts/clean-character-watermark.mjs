// One-time repair for the supplied Hailuo clip. Use character:extract afterward.
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
if (!process.argv[2]) throw new Error('Pass the original watermarked MP4 path as the first argument.');
const source = resolve(process.argv[2]);
const output = resolve(process.argv[3] ?? join(root, 'character-animation.mp4'));
if (source === output) throw new Error('Use separate input and output paths so the original remains available.');
const plate = join(root, 'scripts/assets/character-corner-clean.png');

function run(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr || `${command} failed`);
  return result.stdout;
}

function probe(path) {
  return JSON.parse(run('ffprobe', [
    '-v', 'error', '-select_streams', 'v:0', '-count_frames', '-show_entries',
    'stream=width,height,r_frame_rate,nb_read_frames,duration:format=duration', '-of', 'json', path,
  ]));
}

const before = probe(source);
if (before.streams[0].width !== 2944 || before.streams[0].height !== 1248) {
  throw new Error('This repair mask is calibrated only for the supplied 2944 × 1248 clip.');
}
const temp = mkdtempSync(join(tmpdir(), 'mekayla-watermark-'));
try {
  const mask = join(temp, 'mask.png');
  const cleaned = join(temp, 'cleaned.mp4');
  // The bright lettering is isolated inside its original corner. Three pixels
  // of dilation cover antialiasing; everything outside the glyph mask is kept.
  run('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-i', source,
    '-vf', "format=gray,crop=700:80:2216:1104,lut=y='if(gt(val,120),255,0)',dilation,dilation,dilation,pad=2944:1248:2216:1104:black",
    '-frames:v', '1', mask,
  ]);
  // Only masked pixels are filled from the repaired stationary corner plate.
  // No character frames, movement, timing, or camera position are synthesized.
  run('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-i', source, '-i', plate, '-i', mask,
    '-filter_complex', '[2:v]format=gray,crop=848:320:2096:928,gblur=sigma=1[mask];[1:v][mask]alphamerge[patch];[0:v][patch]overlay=x=2096:y=928:format=auto[out]',
    '-map', '[out]', '-map', '0:a?', '-c:v', 'libx264', '-crf', '16',
    '-preset', 'medium', '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-movflags', '+faststart', cleaned,
  ]);
  const after = probe(cleaned);
  for (const field of ['width', 'height', 'r_frame_rate', 'nb_read_frames', 'duration']) {
    if (after.streams[0][field] !== before.streams[0][field]) throw new Error(`Repair changed ${field}`);
  }
  if (Math.abs(Number(after.format.duration) - Number(before.format.duration)) > 0.001) {
    throw new Error('Repair changed video duration');
  }
  copyFileSync(cleaned, output);
  console.log(`Saved cleaned video to ${output}; dimensions, frame count, frame rate, and duration preserved.`);
} finally {
  rmSync(temp, { recursive: true, force: true });
}
