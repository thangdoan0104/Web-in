import sharp from "sharp";
import type { Placement } from "./placement";

export type MockupKind = "standee" | "flyer" | "banner";

// Mockup dựng bằng SVG + ghép ảnh, không cần ảnh nền chụp sẵn.
// Khung ảnh ôm sát sản phẩm để sản phẩm chiếm phần lớn khung hình; tờ rơi đặt thẳng.
// Khi có ảnh nền thật, thay hàm cảnh bên dưới bằng ảnh và tọa độ vùng in.

interface Scene {
  bg: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

function fitBox(maxW: number, maxH: number, ratio: number) {
  let w = maxW;
  let h = w / ratio;
  if (h > maxH) {
    h = maxH;
    w = h * ratio;
  }
  return { w: Math.round(w), h: Math.round(h) };
}

function standee(ratio: number): Scene {
  const { w, h } = fitBox(640, 1280, ratio);
  const W = Math.max(w + 360, 1000);
  const H = h + 220;
  const x = Math.round((W - w) / 2);
  const y = 60;
  const by = y + h;
  const bg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eceff1"/><stop offset="1" stop-color="#cfd8dc"/></linearGradient>
      <linearGradient id="metal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b0b6ba"/><stop offset=".5" stop-color="#eef1f3"/><stop offset="1" stop-color="#8d9499"/></linearGradient>
      <filter id="blur"><feGaussianBlur stdDeviation="16"/></filter>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#wall)"/>
    <rect y="${by + 44}" width="${W}" height="${H - by - 44}" fill="#b9c2c7"/>
    <ellipse cx="${W / 2}" cy="${by + 58}" rx="${w * 0.75}" ry="20" fill="#000" opacity=".35" filter="url(#blur)"/>
    <rect x="${x + 18}" y="${y + 22}" width="${w}" height="${h}" fill="#000" opacity=".22" filter="url(#blur)"/>
    <rect x="${x - 8}" y="${y - 12}" width="${w + 16}" height="16" rx="5" fill="url(#metal)"/>
    <rect x="${x - 24}" y="${by - 4}" width="${w + 48}" height="48" rx="12" fill="url(#metal)"/>
    <path d="M ${x + 12} ${by + 44} l -30 20 h 20 l 30 -20 z M ${x + w - 12} ${by + 44} l 30 20 h -20 l -30 -20 z" fill="#7d858a"/>
  </svg>`;
  return { bg, x, y, w, h };
}

function flyer(ratio: number): Scene {
  const landscape = ratio >= 1;
  const { w, h } = fitBox(landscape ? 1200 : 860, landscape ? 860 : 1200, ratio);
  const W = w + 220;
  const H = h + 220;
  const x = Math.round((W - w) / 2) - 8;
  const y = Math.round((H - h) / 2) - 8;
  // Xấp giấy phía sau đặt thẳng, lệch nhẹ để thấy độ dày
  const bg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <linearGradient id="desk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d7b98e"/><stop offset="1" stop-color="#b48a5a"/></linearGradient>
      <filter id="blur"><feGaussianBlur stdDeviation="14"/></filter>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#desk)"/>
    <rect x="${x + 22}" y="${y + 26}" width="${w}" height="${h}" fill="#000" opacity=".35" filter="url(#blur)"/>
    <rect x="${x + 14}" y="${y + 14}" width="${w}" height="${h}" fill="#e4e4e4"/>
    <rect x="${x + 7}" y="${y + 7}" width="${w}" height="${h}" fill="#efefef"/>
  </svg>`;
  return { bg, x, y, w, h };
}

function banner(ratio: number): Scene {
  const { w, h } = fitBox(1200, 760, ratio);
  const W = w + 200;
  const H = h + 340;
  const x = Math.round((W - w) / 2);
  const y = 90;
  const bricks = Array.from({ length: Math.ceil(H / 36) }, (_, r) =>
    Array.from({ length: Math.ceil(W / 96) + 1 }, (_, c) => `<rect x="${c * 96 - (r % 2) * 48}" y="${r * 36}" width="92" height="32" fill="#c9b8a6"/>`).join(""),
  ).join("");
  const bg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs><filter id="blur"><feGaussianBlur stdDeviation="12"/></filter></defs>
    <rect width="${W}" height="${H}" fill="#b5a291"/>
    ${bricks}
    <rect y="${H - 120}" width="${W}" height="120" fill="#6f7377"/>
    <rect x="${x + 10}" y="${y + 16}" width="${w}" height="${h}" fill="#000" opacity=".4" filter="url(#blur)"/>
    <rect x="${x - 14}" y="${y - 14}" width="${w + 28}" height="${h + 28}" fill="#3a3f44"/>
    <rect x="${x + 40}" y="${y - 34}" width="${w - 80}" height="10" fill="#2b2f33"/>
  </svg>`;
  return { bg, x, y, w, h };
}

// Đặt file vào vùng in đúng như khi in: phóng theo cách khách chọn, cắt phần dư hoặc thêm nền trắng
async function artwork(preview: Buffer, w: number, h: number, p: Placement) {
  const s = w / p.w;
  const iw = Math.max(1, Math.round(p.imageW * s));
  const ih = Math.max(1, Math.round(p.imageH * s));
  let img = await sharp(preview).resize(iw, ih, { fit: "fill" }).toBuffer();
  if (iw > w || ih > h) {
    const cw = Math.min(iw, w);
    const ch = Math.min(ih, h);
    img = await sharp(img).extract({ left: Math.round((iw - cw) / 2), top: Math.round((ih - ch) / 2), width: cw, height: ch }).toBuffer();
  }
  const meta = await sharp(img).metadata();
  const padX = w - (meta.width ?? w);
  const padY = h - (meta.height ?? h);
  return sharp(img)
    .flatten({ background: "#ffffff" })
    .extend({ left: Math.floor(padX / 2), right: Math.ceil(padX / 2), top: Math.floor(padY / 2), bottom: Math.ceil(padY / 2), background: "#ffffff" })
    .png()
    .toBuffer();
}

export async function renderMockup(kind: MockupKind, preview: Buffer, p: Placement): Promise<Buffer> {
  const ratio = p.w / p.h;
  const scene = kind === "standee" ? standee(ratio) : kind === "flyer" ? flyer(ratio) : banner(ratio);
  const art = await artwork(preview, scene.w, scene.h, p);
  return sharp(Buffer.from(scene.bg))
    .composite([{ input: art, left: scene.x, top: scene.y }])
    .jpeg({ quality: 90 })
    .toBuffer();
}
