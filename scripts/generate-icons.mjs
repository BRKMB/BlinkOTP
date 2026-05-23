import { mkdir, writeFile } from 'node:fs/promises';
import { deflateSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '../public/icons');

/** Bolt in 48×48 space — scaled large for toolbar visibility */
const BOLT_48 = [
  [28, 2],
  [11, 31],
  [21, 31],
  [16, 46],
  [37, 17],
  [27, 17],
  [32, 2],
];

const BOLT_SCALE = 1.08;
const BOLT_ORIGIN = [24, 24];

function crc32(buf) {
  let c = ~0;
  for (const byte of buf) {
    c ^= byte;
    for (let k = 0; k < 8; k++) c = (c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1);
  }
  return ~c >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const chunk = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type), data])));
  return Buffer.concat([len, chunk, crc]);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function boltGradient(t) {
  const purple = [216, 180, 254];
  const indigo = [165, 180, 252];
  const blue = [96, 165, 250];
  if (t < 0.5) {
    const u = t / 0.5;
    return [lerp(purple[0], indigo[0], u), lerp(purple[1], indigo[1], u), lerp(purple[2], indigo[2], u)];
  }
  const u = (t - 0.5) / 0.5;
  return [lerp(indigo[0], blue[0], u), lerp(indigo[1], blue[1], u), lerp(indigo[2], blue[2], u)];
}

function inBolt(x, y, size) {
  const s = size / 48;
  const ox = BOLT_ORIGIN[0] * s;
  const oy = BOLT_ORIGIN[1] * s;
  const pts = BOLT_48.map(([px, py]) => {
    const bx = px * s;
    const by = py * s;
    return [ox + (bx - ox) * BOLT_SCALE, oy + (by - oy) * BOLT_SCALE];
  });
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-9) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function inRoundedSquare(x, y, size) {
  const cx = (x + 0.5) / size - 0.5;
  const cy = (y + 0.5) / size - 0.5;
  return Math.pow(Math.abs(cx) / 0.47, 2.1) + Math.pow(Math.abs(cy) / 0.47, 2.1) <= 1;
}

function pixelColor(x, y, size) {
  if (!inRoundedSquare(x, y, size)) return [0, 0, 0, 0];

  if (inBolt(x, y, size)) {
    const t = (x + y) / (size * 2);
    const [r, g, b] = boltGradient(t);
    return [r, g, b, 255];
  }

  const gx = (x - size * 0.2) / (size * 0.42);
  const gy = (y - size * 0.18) / (size * 0.42);
  const glow = Math.exp(-(gx * gx + gy * gy)) * 0.28;
  const base = [8, 8, 14];
  const tint = [16, 185, 129];
  return [
    Math.round(lerp(base[0], tint[0], glow)),
    Math.round(lerp(base[1], tint[1], glow)),
    Math.round(lerp(base[2], tint[2], glow)),
    255,
  ];
}

function renderAtSize(size) {
  const scale = size <= 16 ? 6 : size <= 32 ? 4 : 3;
  const big = size * scale;
  const buf = Buffer.alloc(big * big * 4);

  for (let y = 0; y < big; y++) {
    for (let x = 0; x < big; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let sy = 0; sy < scale; sy++) {
        for (let sx = 0; sx < scale; sx++) {
          const px = ((x * scale + sx + 0.5) / big) * size;
          const py = ((y * scale + sy + 0.5) / big) * size;
          const [cr, cg, cb, ca] = pixelColor(px, py, size);
          r += cr;
          g += cg;
          b += cb;
          a += ca;
        }
      }
      const n = scale * scale;
      const i = (y * big + x) * 4;
      buf[i] = Math.round(r / n);
      buf[i + 1] = Math.round(g / n);
      buf[i + 2] = Math.round(b / n);
      buf[i + 3] = Math.round(a / n);
    }
  }

  if (scale === 1) return buf;

  const out = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const si = ((y * scale + dy) * big + (x * scale + dx)) * 4;
          r += buf[si];
          g += buf[si + 1];
          b += buf[si + 2];
          a += buf[si + 3];
        }
      }
      const n = scale * scale;
      const oi = (y * size + x) * 4;
      out[oi] = Math.round(r / n);
      out[oi + 1] = Math.round(g / n);
      out[oi + 2] = Math.round(b / n);
      out[oi + 3] = Math.round(a / n);
    }
  }
  return out;
}

function rgbaToPng(size, rgba) {
  const row = 1 + size * 4;
  const raw = Buffer.alloc(row * size);
  for (let y = 0; y < size; y++) {
    const off = y * row;
    raw[off] = 0;
    for (let x = 0; x < size; x++) {
      const i = off + 1 + x * 4;
      const ri = (y * size + x) * 4;
      raw[i] = rgba[ri];
      raw[i + 1] = rgba[ri + 1];
      raw[i + 2] = rgba[ri + 2];
      raw[i + 3] = rgba[ri + 3];
    }
  }
  const compressed = deflateSync(raw);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

await mkdir(outDir, { recursive: true });
for (const size of [16, 32, 48, 128]) {
  const rgba = renderAtSize(size);
  await writeFile(join(outDir, `icon-${size}.png`), rgbaToPng(size, rgba));
}
console.log('Large bolt icons written to public/icons');
