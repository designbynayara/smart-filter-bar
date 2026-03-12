const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const W = 20, H = 20;
const raw = Buffer.alloc(H * (1 + W * 4), 0);

function px(x, y, r, g, b, a) {
    if (x < 0 || x >= W || y < 0 || y >= H) return;
    const off = y * (1 + W * 4) + 1 + x * 4;
    raw[off] = r; raw[off+1] = g; raw[off+2] = b; raw[off+3] = a;
}

function hLine(x1, x2, y, r, g, b, a) {
    for (let x = x1; x <= x2; x++) px(x, y, r, g, b, a || 255);
}

// Colors
const B = [68, 114, 196];   // #4472C4 Power BI blue
const D = [47, 82, 143];    // darker blue for depth
const L = [100, 140, 210];  // lighter blue highlight

// === FILTER FUNNEL ICON ===
// Design: Clean funnel with 3 filter lines inside

// -- Funnel outline --
// Top edge (wide)
hLine(1, 18, 1, ...B, 255);
hLine(1, 18, 2, ...B, 255);

// Taper left side
hLine(2, 17, 3, ...B, 255);
hLine(3, 16, 4, ...B, 255);
hLine(4, 15, 5, ...B, 255);
hLine(5, 14, 6, ...B, 255);
hLine(6, 13, 7, ...B, 255);
hLine(7, 12, 8, ...B, 255);
hLine(8, 11, 9, ...B, 255);

// Stem
hLine(9, 10, 10, ...B, 255);
hLine(9, 10, 11, ...B, 255);
hLine(9, 10, 12, ...B, 255);
hLine(9, 10, 13, ...B, 255);
hLine(9, 10, 14, ...B, 255);
hLine(9, 10, 15, ...B, 255);
hLine(9, 10, 16, ...B, 255);

// Droplet
hLine(9, 10, 17, ...B, 180);

// -- 3 horizontal filter lines inside the funnel --
// Line 1 (top, wide)
hLine(3, 16, 3, ...D, 255);
// Line 2 (middle)
hLine(5, 14, 5, ...D, 255);
// Line 3 (narrow)
hLine(7, 12, 7, ...D, 255);

// Left edge highlight (subtle 3D)
for (let y = 1; y <= 9; y++) {
    const indent = Math.floor((y - 1) * 0.95);
    px(1 + indent, y, ...L, 160);
}

// Build PNG
function crc32(buf) {
    let c = 0xFFFFFFFF;
    const table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
        let val = n;
        for (let k = 0; k < 8; k++) val = (val & 1) ? (0xEDB88320 ^ (val >>> 1)) : (val >>> 1);
        table[n] = val;
    }
    for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const typeAndData = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(typeAndData));
    return Buffer.concat([len, typeAndData, crc]);
}

const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
const compressed = zlib.deflateSync(raw, { level: 9 });
const png = Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))]);

const outPath = path.join(__dirname, 'assets', 'icon.png');
fs.writeFileSync(outPath, png);
console.log(`Icon saved: ${outPath} (${png.length} bytes)`);
