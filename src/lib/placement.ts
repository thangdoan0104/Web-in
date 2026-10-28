// Cách đặt file vào khổ in. Dùng chung cho kiểm tra file (server), mockup và màn xem 2D (client).
export type FitMode = "cover" | "contain";

export interface PlacementTarget {
  widthMm: number;
  heightMm: number;
  bleedMm: number;
  // Chỉ tờ rơi được xoay khổ theo hướng của file; standee, biển giữ nguyên hướng khách chọn
  rotatable?: boolean;
}

export const FIT_LABELS: Record<FitMode, string> = {
  cover: "Phóng kín khổ, cắt mép",
  contain: "Giữ trọn ảnh, thêm nền trắng",
};

export function orientTarget(fileW: number, fileH: number, t: PlacementTarget) {
  const rotated = !!t.rotatable && fileW > fileH !== t.widthMm > t.heightMm && t.widthMm !== t.heightMm;
  return { w: rotated ? t.heightMm : t.widthMm, h: rotated ? t.widthMm : t.heightMm, rotated };
}

// fileW/fileH: px với ảnh, mm với PDF. k = số mm in ra cho mỗi đơn vị đó.
// cover: phóng kín khổ (kể cả lề xén), phần dư bị cắt; contain: giữ trọn file, phần thiếu là nền trắng.
export function placement(fileW: number, fileH: number, t: PlacementTarget, fit: FitMode) {
  const { w, h, rotated } = orientTarget(fileW, fileH, t);
  const b = t.bleedMm;
  const frameW = w + 2 * b;
  const frameH = h + 2 * b;
  const kx = frameW / fileW;
  const ky = frameH / fileH;
  const k = fit === "contain" ? Math.min(kx, ky) : Math.max(kx, ky);
  return { w, h, bleed: b, frameW, frameH, rotated, k, imageW: fileW * k, imageH: fileH * k };
}

export type Placement = ReturnType<typeof placement>;

// Lệch tỷ lệ so với khổ xén và khổ có lề xén (lấy cái gần hơn)
export function ratioDiff(fileW: number, fileH: number, t: PlacementTarget) {
  const p = placement(fileW, fileH, t, "cover");
  const r = fileW / fileH;
  const trim = Math.abs(r / (p.w / p.h) - 1);
  const bleed = Math.abs(r / (p.frameW / p.frameH) - 1);
  return { trim, bleed, min: Math.min(trim, bleed) };
}

export const formatCm = (mm: number) => (Math.round(mm) / 10).toLocaleString("vi-VN");
