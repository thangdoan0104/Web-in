import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import sharp from "sharp";
import { formatCm, placement, ratioDiff, type FitMode, type PlacementTarget } from "./placement";

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
  fit: FitMode;
  info: {
    format: "image" | "pdf";
    widthPx?: number;
    heightPx?: number;
    pageWidthMm?: number;
    pageHeightMm?: number;
    pages: number;
    colorSpace: string;
    effectiveDpi: number | null;
    // dpi ghi trong file (Photoshop...), chỉ để giải thích cho khách
    metaDpi?: number | null;
  };
  target: PlacementTarget;
}

export interface CheckTarget extends PlacementTarget {
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
function checkSize(fileW: number, fileH: number, t: CheckTarget, fit: FitMode): CheckItem[] {
  const p = placement(fileW, fileH, t, fit);
  const diff = ratioDiff(fileW, fileH, t);
  const sizeText = `${formatCm(p.w)} x ${formatCm(p.h)} cm`;
  const turned = p.rotated ? ` Tờ rơi được in theo hướng ${fileW > fileH ? "ngang" : "dọc"} như file.` : "";
  const items: CheckItem[] = [];

  if (diff.min <= 0.01) {
    items.push({ key: "size", label: "Kích thước & tỷ lệ", status: "pass", message: `Tỷ lệ file khớp với khổ ${sizeText}.${turned}` });
  } else {
    // File khác tỷ lệ: không đổi hình sản phẩm, mà phóng file cho kín khổ (cắt mép) hoặc giữ trọn file (thêm nền trắng)
    const wide = fileW / fileH > p.frameW / p.frameH;
    const message =
      fit === "contain"
        ? `File khác tỷ lệ khổ ${sizeText}. Giữ trọn file thì khổ in có dải nền trắng khoảng ${formatCm(((wide ? p.frameH - p.imageH : p.frameW - p.imageW)) / 2)} cm ở ${wide ? "mép trên và mép dưới" : "mép trái và mép phải"}.`
        : `File khác tỷ lệ khổ ${sizeText}. File được phóng cho kín khổ, phần dư khoảng ${formatCm(((wide ? p.imageW - p.frameW : p.imageH - p.frameH)) / 2)} cm ở ${wide ? "mép trái và mép phải" : "mép trên và mép dưới"} sẽ bị cắt.`;
    items.push({ key: "size", label: "Kích thước & tỷ lệ", status: "warn", message: `${message}${turned} Xem chế độ 2D để thấy rõ, hoặc đổi cách đặt ảnh.` });
  }

  if (t.bleedMm > 0 && diff.min <= 0.05) {
    const hasBleed = diff.bleed < diff.trim;
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

// Độ phân giải thật khi in = số điểm ảnh / kích thước in ra; con số dpi ghi trong file không quyết định độ nét
function imageResolutionItem(widthPx: number, heightPx: number, metaDpi: number | null, t: CheckTarget, fit: FitMode) {
  const p = placement(widthPx, heightPx, t, fit);
  const dpi = MM_PER_INCH / p.k;
  const item = resolutionItem(dpi, t);
  const value = Math.round(dpi);
  const sizeText = `${formatCm(p.w)} x ${formatCm(p.h)} cm`;
  if (item.status === "pass") {
    item.message = `Ảnh ${widthPx} x ${heightPx} px, in ở khổ ${sizeText} đạt khoảng ${value} dpi, đủ sắc nét.`;
  } else {
    const rec = t.dpi.recommended;
    const needW = Math.ceil((p.frameW / MM_PER_INCH) * rec).toLocaleString("vi-VN");
    const needH = Math.ceil((p.frameH / MM_PER_INCH) * rec).toLocaleString("vi-VN");
    const meta =
      metaDpi && Math.abs(metaDpi - value) > value * 0.1
        ? ` File ghi ${metaDpi} dpi, nhưng con số đó chỉ đúng khi in ở khổ ${formatCm((widthPx / metaDpi) * MM_PER_INCH)} x ${formatCm((heightPx / metaDpi) * MM_PER_INCH)} cm.`
        : "";
    item.message =
      `Ảnh ${widthPx} x ${heightPx} px, phóng lên khổ ${sizeText} chỉ còn khoảng ${value} dpi (khuyến nghị ${rec}, tối thiểu ${t.dpi.minimum}).${meta}` +
      ` Để đạt ${rec} dpi ở khổ này, ảnh cần khoảng ${needW} x ${needH} px. ${item.status === "fail" ? "Bản in sẽ bị vỡ hạt." : "Bản in có thể hơi mờ khi nhìn gần."}`;
  }
  return { item, dpi };
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

async function checkImage(filePath: string, t: CheckTarget, fit: FitMode): Promise<{ result: FileCheckResult; preview: Buffer }> {
  const image = sharp(filePath, { limitInputPixels: false, failOn: "none" });
  const meta = await image.metadata();
  // Ảnh có thể chứa cờ xoay EXIF; dùng kích thước sau khi xoay
  const swap = (meta.orientation ?? 1) >= 5;
  const widthPx = (swap ? meta.height : meta.width) ?? 0;
  const heightPx = (swap ? meta.width : meta.height) ?? 0;
  const metaDpi = meta.density && meta.density > 1 ? Math.round(meta.density) : null;
  const { item: resolution, dpi } = imageResolutionItem(widthPx, heightPx, metaDpi, t, fit);
  const space = meta.space === "cmyk" ? "cmyk" : meta.space === "b-w" ? "gray" : "rgb";

  const items: CheckItem[] = [
    resolution,
    ...checkSize(widthPx, heightPx, t, fit),
    colorItem(space),
    { key: "fonts", label: "Font chữ", status: "pass", message: "File ảnh, chữ đã nằm sẵn trong ảnh." },
  ];
  const preview = await sharp(filePath, { limitInputPixels: false, failOn: "none" })
    .rotate()
    .resize(2000, 2000, { fit: "inside", withoutEnlargement: true })
    .toColourspace("srgb")
    .png()
    .toBuffer();

  return {
    result: {
      items,
      worst: worstOf(items),
      fit,
      info: { format: "image", widthPx, heightPx, pages: 1, colorSpace: meta.space ?? "unknown", effectiveDpi: Math.round(dpi), metaDpi },
      target: { widthMm: t.widthMm, heightMm: t.heightMm, bleedMm: t.bleedMm, rotatable: t.rotatable },
    },
    preview,
  };
}

async function checkPdf(filePath: string, t: CheckTarget, fit: FitMode): Promise<{ result: FileCheckResult; preview: Buffer }> {
  const { stdout: infoOut } = await run("pdfinfo", [filePath]);
  const pages = Number(/Pages:\s+(\d+)/.exec(infoOut)?.[1] ?? 1);
  const sizeMatch = /Page size:\s+([\d.]+) x ([\d.]+) pts/.exec(infoOut);
  if (!sizeMatch) throw new Error("Không đọc được kích thước trang PDF");
  const pageWidthMm = Number(sizeMatch[1]) * PT_TO_MM;
  const pageHeightMm = Number(sizeMatch[2]) * PT_TO_MM;

  // Trang PDF sẽ được phóng/thu về khổ in; DPI thực của ảnh = DPI trong PDF / tỷ lệ phóng
  const scale = placement(pageWidthMm, pageHeightMm, t, fit).k;

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
    ...checkSize(pageWidthMm, pageHeightMm, t, fit),
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
    await run("pdftoppm", ["-f", "1", "-l", "1", "-png", "-scale-to", "2000", "-singlefile", filePath, out]);
    const preview = await readFile(out + ".png");
    return {
      result: {
        items,
        worst: worstOf(items),
        fit,
        info: {
          format: "pdf",
          pageWidthMm: Math.round(pageWidthMm * 10) / 10,
          pageHeightMm: Math.round(pageHeightMm * 10) / 10,
          pages,
          colorSpace: space,
          effectiveDpi: dpi === null ? null : Math.round(dpi),
        },
        target: { widthMm: t.widthMm, heightMm: t.heightMm, bleedMm: t.bleedMm, rotatable: t.rotatable },
      },
      preview,
    };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

export async function checkPrintFile(filePath: string, mime: string, target: CheckTarget, fit: FitMode = "cover") {
  if (mime === "application/pdf") return checkPdf(filePath, target, fit);
  return checkImage(filePath, target, fit);
}
