import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import sharp from "sharp";

const run = promisify(execFile);

export type CheckStatus = "pass" | "warn" | "fail";

export interface CheckItem {
  key: "resolution" | "size" | "bleed" | "color" | "fonts" | "pages";
  label: string;
  status: CheckStatus;
  message: string;
}

export interface FileCheckResult {
  items: CheckItem[];
  worst: CheckStatus;
  info: {
    format: "image" | "pdf";
    widthPx?: number;
    heightPx?: number;
    pageWidthMm?: number;
    pageHeightMm?: number;
    pages: number;
    colorSpace: string;
    effectiveDpi: number | null;
  };
  target: { widthMm: number; heightMm: number; bleedMm: number };
}

export interface CheckTarget {
  widthMm: number;
  heightMm: number;
  bleedMm: number;
  dpi: { recommended: number; minimum: number };
}

export const ACCEPTED_MIME = ["application/pdf", "image/jpeg", "image/png", "image/tiff", "image/webp"];

const MM_PER_INCH = 25.4;
const PT_TO_MM = 25.4 / 72;

// pdfimages: các giá trị không chứa khoảng trắng, tách theo khoảng trắng
function parseWhitespaceTable(output: string): Record<string, string>[] {
  const lines = output.split("\n").filter((l) => l.trim());
  const dashIndex = lines.findIndex((l) => /^-{5,}/.test(l));
  if (dashIndex < 1) return [];
  const names = lines[dashIndex - 1].trim().split(/\s+/);
  return lines.slice(dashIndex + 1).map((line) => {
    const values = line.trim().split(/\s+/);
    return Object.fromEntries(names.map((n, i) => [n, values[i] ?? ""]));
  });
}

// pdffonts: tên kiểu font có khoảng trắng, cột căn theo dòng gạch "----- ----"
function parseTable(output: string): Record<string, string>[] {
  const lines = output.split("\n");
  const dashIndex = lines.findIndex((l) => /^-+(\s+-+)+\s*$/.test(l));
  if (dashIndex < 1) return [];
  const header = lines[dashIndex - 1];
  const spans: [number, number][] = [];
  const re = /-+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(lines[dashIndex]))) spans.push([m.index, m.index + m[0].length]);
  const names = spans.map(([s], i) => header.slice(s, i === spans.length - 1 ? undefined : spans[i + 1][0]).trim());
  return lines
    .slice(dashIndex + 1)
    .filter((l) => l.trim())
    .map((line) => {
      const row: Record<string, string> = {};
      spans.forEach(([s], i) => {
        const end = i === spans.length - 1 ? undefined : spans[i + 1][0];
        row[names[i]] = line.slice(s, end).trim();
      });
      return row;
    });
}

// Chọn hướng (dọc/ngang) của khổ in sao cho khớp với hướng của file
function orientTarget(fileW: number, fileH: number, t: CheckTarget) {
  const fileLandscape = fileW > fileH;
  const targetLandscape = t.widthMm > t.heightMm;
  const rotated = fileLandscape !== targetLandscape && t.widthMm !== t.heightMm;
  const w = rotated ? t.heightMm : t.widthMm;
  const h = rotated ? t.widthMm : t.heightMm;
  return { w, h, rotated };
}

function checkSize(fileW: number, fileH: number, t: CheckTarget): CheckItem[] {
  const { w, h, rotated } = orientTarget(fileW, fileH, t);
  const ratio = fileW / fileH;
  const diffTrim = Math.abs(ratio / (w / h) - 1);
  const bw = w + 2 * t.bleedMm;
  const bh = h + 2 * t.bleedMm;
  const diffBleed = Math.abs(ratio / (bw / bh) - 1);
  const diff = Math.min(diffTrim, diffBleed);
  const items: CheckItem[] = [];
  const sizeText = `${t.widthMm / 10} x ${t.heightMm / 10} cm`;

  if (rotated) {
    items.push({
      key: "size",
      label: "Kích thước & tỷ lệ",
      status: "warn",
      message: `File đang theo hướng ${fileW > fileH ? "ngang" : "dọc"}, khác với khổ ${sizeText} bạn chọn. Hãy kiểm tra lại hướng trên mockup.`,
    });
  } else if (diff <= 0.01) {
    items.push({ key: "size", label: "Kích thước & tỷ lệ", status: "pass", message: `Tỷ lệ file khớp với khổ ${sizeText}.` });
  } else if (diff <= 0.05) {
    items.push({
      key: "size",
      label: "Kích thước & tỷ lệ",
      status: "warn",
      message: `Tỷ lệ file lệch ${(diff * 100).toFixed(1)}% so với khổ ${sizeText}. File sẽ được co giãn hoặc cắt bớt mép, xem phần bị cắt ở chế độ 2D.`,
    });
  } else {
    items.push({
      key: "size",
      label: "Kích thước & tỷ lệ",
      status: "fail",
      message: `Tỷ lệ file lệch ${(diff * 100).toFixed(0)}% so với khổ ${sizeText}. Nội dung sẽ bị méo hoặc mất nhiều, nên làm lại file đúng khổ.`,
    });
  }

  if (t.bleedMm > 0 && diff <= 0.05) {
    const hasBleed = diffBleed < diffTrim;
    items.push(
      hasBleed
        ? { key: "bleed", label: "Lề xén (bleed)", status: "pass", message: `File đã có lề xén ${t.bleedMm} mm mỗi cạnh.` }
        : {
            key: "bleed",
            label: "Lề xén (bleed)",
            status: "warn",
            message: `File chưa có lề xén ${t.bleedMm} mm mỗi cạnh. Khi xén, mép giấy có thể lộ viền trắng; nên kéo nền tràn ra ngoài khổ.`,
          },
    );
  }
  return items;
}

function resolutionItem(dpi: number | null, t: CheckTarget, isVectorOnly = false): CheckItem {
  const label = "Độ phân giải";
  if (isVectorOnly)
    return { key: "resolution", label, status: "pass", message: "File dạng vector, in sắc nét ở mọi kích thước." };
  if (dpi === null) return { key: "resolution", label, status: "warn", message: "Không đọc được độ phân giải của file." };
  const value = Math.round(dpi);
  // Cho phép lệch 3% do làm tròn khi xuất file (VD: 299,4 dpi vẫn tính là 300)
  if (dpi >= t.dpi.recommended * 0.97)
    return { key: "resolution", label, status: "pass", message: `Độ phân giải khi in khoảng ${value} dpi, đủ sắc nét.` };
  if (dpi >= t.dpi.minimum * 0.97)
    return {
      key: "resolution",
      label,
      status: "warn",
      message: `Độ phân giải khi in chỉ khoảng ${value} dpi (khuyến nghị ${t.dpi.recommended} dpi). Bản in có thể hơi mờ khi nhìn gần.`,
    };
  return {
    key: "resolution",
    label,
    status: "fail",
    message: `Độ phân giải khi in chỉ khoảng ${value} dpi, thấp hơn mức tối thiểu ${t.dpi.minimum} dpi. Bản in sẽ bị vỡ hạt, bạn nên dùng file gốc chất lượng cao hơn.`,
  };
}

function colorItem(space: "cmyk" | "rgb" | "gray" | "unknown"): CheckItem {
  const label = "Hệ màu";
  switch (space) {
    case "cmyk":
      return { key: "color", label, status: "pass", message: "File dùng hệ màu CMYK, phù hợp để in." };
    case "gray":
      return { key: "color", label, status: "pass", message: "File đen trắng (grayscale)." };
    case "rgb":
      return {
        key: "color",
        label,
        status: "warn",
        message: "File dùng hệ màu RGB. Màu tươi (xanh lá, cam, hồng) có thể nhạt hơn khi in CMYK; hãy xuất file CMYK nếu cần màu chuẩn.",
      };
    default:
      return { key: "color", label, status: "pass", message: "Không phát hiện ảnh RGB. Màu sẽ được kiểm tra lại khi chế bản." };
  }
}

function worstOf(items: CheckItem[]): CheckStatus {
  if (items.some((i) => i.status === "fail")) return "fail";
  if (items.some((i) => i.status === "warn")) return "warn";
  return "pass";
}

async function checkImage(filePath: string, t: CheckTarget): Promise<{ result: FileCheckResult; preview: Buffer }> {
  const image = sharp(filePath, { limitInputPixels: false, failOn: "none" });
  const meta = await image.metadata();
  // Ảnh có thể chứa cờ xoay EXIF; dùng kích thước sau khi xoay
  const swap = (meta.orientation ?? 1) >= 5;
  const widthPx = (swap ? meta.height : meta.width) ?? 0;
  const heightPx = (swap ? meta.width : meta.height) ?? 0;
  const { w, h } = orientTarget(widthPx, heightPx, t);
  const dpi = Math.min(widthPx / ((w + 2 * t.bleedMm) / MM_PER_INCH), heightPx / ((h + 2 * t.bleedMm) / MM_PER_INCH));
  const space = meta.space === "cmyk" ? "cmyk" : meta.space === "b-w" ? "gray" : "rgb";

  const items: CheckItem[] = [
    resolutionItem(dpi, t),
    ...checkSize(widthPx, heightPx, t),
    colorItem(space),
    { key: "fonts", label: "Font chữ", status: "pass", message: "File ảnh, chữ đã nằm sẵn trong ảnh." },
  ];
  const preview = await sharp(filePath, { limitInputPixels: false, failOn: "none" })
    .rotate()
    .resize(1400, 1400, { fit: "inside", withoutEnlargement: true })
    .toColourspace("srgb")
    .png()
    .toBuffer();

  return {
    result: {
      items,
      worst: worstOf(items),
      info: { format: "image", widthPx, heightPx, pages: 1, colorSpace: meta.space ?? "unknown", effectiveDpi: Math.round(dpi) },
      target: { widthMm: t.widthMm, heightMm: t.heightMm, bleedMm: t.bleedMm },
    },
    preview,
  };
}

async function checkPdf(filePath: string, t: CheckTarget): Promise<{ result: FileCheckResult; preview: Buffer }> {
  const { stdout: infoOut } = await run("pdfinfo", [filePath]);
  const pages = Number(/Pages:\s+(\d+)/.exec(infoOut)?.[1] ?? 1);
  const sizeMatch = /Page size:\s+([\d.]+) x ([\d.]+) pts/.exec(infoOut);
  if (!sizeMatch) throw new Error("Không đọc được kích thước trang PDF");
  const pageWidthMm = Number(sizeMatch[1]) * PT_TO_MM;
  const pageHeightMm = Number(sizeMatch[2]) * PT_TO_MM;

  // Trang PDF sẽ được phóng/thu về khổ in; DPI thực của ảnh = DPI trong PDF / tỷ lệ phóng
  const { w } = orientTarget(pageWidthMm, pageHeightMm, t);
  const scale = (w + 2 * t.bleedMm) / pageWidthMm;

  const { stdout: imagesOut } = await run("pdfimages", ["-f", "1", "-l", "1", "-list", filePath]);
  const images = parseWhitespaceTable(imagesOut).filter((r) => r.type === "image" && Number(r.width) > 16 && Number(r.height) > 16);
  let dpi: number | null = null;
  let space: "cmyk" | "rgb" | "gray" | "unknown" = "unknown";
  if (images.length) {
    dpi = Math.min(...images.map((r) => Math.min(Number(r["x-ppi"]), Number(r["y-ppi"])) / scale));
    const comps = images.map((r) => Number(r.comp));
    if (comps.includes(3)) space = "rgb";
    else if (comps.includes(4)) space = "cmyk";
    else space = "gray";
  }

  const { stdout: fontsOut } = await run("pdffonts", ["-f", "1", "-l", "1", filePath]);
  const fonts = parseTable(fontsOut);
  const missing = fonts.filter((f) => f.emb === "no").map((f) => f.name.replace(/^[A-Z]{6}\+/, ""));

  const resolution = resolutionItem(dpi, t, images.length === 0);
  if (images.length > 1 && resolution.status !== "pass") resolution.message += " (tính theo ảnh có độ phân giải thấp nhất trong file)";

  const items: CheckItem[] = [
    resolution,
    ...checkSize(pageWidthMm, pageHeightMm, t),
    colorItem(space),
    missing.length
      ? {
          key: "fonts",
          label: "Font chữ",
          status: "fail",
          message: `Font chưa được nhúng: ${missing.join(", ")}. Chữ có thể bị lỗi hoặc mất dấu tiếng Việt; hãy nhúng font hoặc chuyển chữ thành outline.`,
        }
      : { key: "fonts", label: "Font chữ", status: "pass", message: fonts.length ? "Tất cả font đã được nhúng." : "File không chứa chữ dạng font (đã outline)." },
  ];
  if (pages > 2)
    items.push({ key: "pages", label: "Số trang", status: "warn", message: `File có ${pages} trang; chỉ trang 1 (và trang 2 nếu in 2 mặt) được dùng.` });

  const dir = await mkdtemp(path.join(os.tmpdir(), "webin-"));
  try {
    const out = path.join(dir, "page");
    await run("pdftoppm", ["-f", "1", "-l", "1", "-png", "-scale-to", "1400", "-singlefile", filePath, out]);
    const preview = await readFile(out + ".png");
    return {
      result: {
        items,
        worst: worstOf(items),
        info: {
          format: "pdf",
          pageWidthMm: Math.round(pageWidthMm),
          pageHeightMm: Math.round(pageHeightMm),
          pages,
          colorSpace: space,
          effectiveDpi: dpi === null ? null : Math.round(dpi),
        },
        target: { widthMm: t.widthMm, heightMm: t.heightMm, bleedMm: t.bleedMm },
      },
      preview,
    };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

export async function checkPrintFile(filePath: string, mime: string, target: CheckTarget) {
  if (mime === "application/pdf") return checkPdf(filePath, target);
  return checkImage(filePath, target);
}
