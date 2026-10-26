import sharp from "sharp";

export type MockupKind = "standee" | "flyer" | "banner";

// Mockup dựng bằng SVG + ghép ảnh, không cần ảnh nền chụp sẵn.
// Khi có ảnh nền thật, thay hàm background*() bằng ảnh và tọa độ vùng in.
const W = 1200;
const H = 1000;

function fitBox(maxW: number, maxH: number, ratio: number) {
  let w = maxW;
  let h = w / ratio;
  if (h > maxH) {
    h = maxH;
    w = h * ratio;
  }
  return { w: Math.round(w), h: Math.round(h) };
}

async function artwork(preview: Buffer, w: number, h: number) {
  return sharp(preview).resize(w, h, { fit: "cover" }).png().toBuffer();
}

async function standee(ratio: number) {
  const { w, h } = fitBox(420, 780, ratio);
  const x = Math.round((W - w) / 2);
  const y = 70;
  const baseY = y + h;
  const bg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eceff1"/><stop offset="1" stop-color="#cfd8dc"/></linearGradient>
      <linearGradient id="metal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b0b6ba"/><stop offset=".5" stop-color="#eef1f3"/><stop offset="1" stop-color="#8d9499"/></linearGradient>
      <filter id="blur"><feGaussianBlur stdDeviation="14"/></filter>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#wall)"/>
    <rect y="${baseY + 40}" width="${W}" height="${H - baseY - 40}" fill="#b9c2c7"/>
    <ellipse cx="${W / 2}" cy="${baseY + 52}" rx="${w * 0.75}" ry="18" fill="#000" opacity=".35" filter="url(#blur)"/>
    <rect x="${x + 16}" y="${y + 20}" width="${w}" height="${h}" fill="#000" opacity=".25" filter="url(#blur)"/>
    <rect x="${x - 6}" y="${y - 10}" width="${w + 12}" height="14" rx="4" fill="url(#metal)"/>
    <rect x="${x - 20}" y="${baseY - 4}" width="${w + 40}" height="42" rx="10" fill="url(#metal)"/>
    <path d="M ${x + 10} ${baseY + 38} l -26 18 h 18 l 26 -18 z M ${x + w - 10} ${baseY + 38} l 26 18 h -18 l -26 -18 z" fill="#7d858a"/>
  </svg>`;
  return { bg, w, h, x, y, rotate: 0 };
}

async function flyer(ratio: number) {
  const { w, h } = fitBox(560, 760, ratio);
  const x = Math.round((W - w) / 2);
  const y = Math.round((H - h) / 2);
  const bg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <linearGradient id="desk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d7b98e"/><stop offset="1" stop-color="#b48a5a"/></linearGradient>
      <filter id="blur"><feGaussianBlur stdDeviation="16"/></filter>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#desk)"/>
    <g transform="rotate(-4 ${W / 2} ${H / 2})">
      <rect x="${x + 70}" y="${y + 30}" width="${w}" height="${h}" fill="#f5f5f5" transform="rotate(7 ${W / 2} ${H / 2})"/>
      <rect x="${x + 14}" y="${y + 22}" width="${w}" height="${h}" fill="#000" opacity=".35" filter="url(#blur)"/>
    </g>
  </svg>`;
  return { bg, w, h, x, y, rotate: -4 };
}

async function banner(ratio: number) {
  const { w, h } = fitBox(980, 560, ratio);
  const x = Math.round((W - w) / 2);
  const y = 120 + Math.round((560 - h) / 2);
  const bricks = Array.from({ length: 30 }, (_, r) =>
    Array.from({ length: 14 }, (_, c) => {
      const bx = c * 96 - (r % 2) * 48;
      return `<rect x="${bx}" y="${r * 36}" width="92" height="32" fill="#c9b8a6"/>`;
    }).join(""),
  ).join("");
  const bg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs><filter id="blur"><feGaussianBlur stdDeviation="12"/></filter></defs>
    <rect width="${W}" height="${H}" fill="#b5a291"/>
    ${bricks}
    <rect y="${H - 140}" width="${W}" height="140" fill="#6f7377"/>
    <rect x="${x + 10}" y="${y + 16}" width="${w}" height="${h}" fill="#000" opacity=".4" filter="url(#blur)"/>
    <rect x="${x - 14}" y="${y - 14}" width="${w + 28}" height="${h + 28}" fill="#3a3f44"/>
    <rect x="${x - 30}" y="${y - 40}" width="12" height="12" fill="#555"/>
    <rect x="${x + 40}" y="${y - 34}" width="${w - 80}" height="10" fill="#2b2f33"/>
  </svg>`;
  return { bg, w, h, x, y, rotate: 0 };
}

// ratio = rộng / cao của khổ in
export async function renderMockup(kind: MockupKind, preview: Buffer, ratio: number): Promise<Buffer> {
  const scene = kind === "standee" ? await standee(ratio) : kind === "flyer" ? await flyer(ratio) : await banner(ratio);
  let art = await artwork(preview, scene.w, scene.h);
  let left = scene.x;
  let top = scene.y;
  if (scene.rotate) {
    const rotated = sharp(art).rotate(scene.rotate, { background: { r: 0, g: 0, b: 0, alpha: 0 } });
    const meta = await rotated.toBuffer({ resolveWithObject: true });
    art = meta.data;
    left = Math.round(W / 2 - meta.info.width / 2);
    top = Math.round(H / 2 - meta.info.height / 2);
  }
  return sharp(Buffer.from(scene.bg))
    .composite([{ input: art, left, top }])
    .jpeg({ quality: 85 })
    .toBuffer();
}
