import { z } from "zod";

// Cấu hình tùy chọn + bảng giá của một sản phẩm, lưu ở cột Product.config.
// pricing = "per_unit": giá theo cái/tờ (size.price + chất liệu + gia công).
// pricing = "per_m2": giá theo m² (pricePerM2 + chất liệu + gia công, tất cả tính trên m²).
const optionSchema = z.object({
  code: z.string().min(1),
  label: z.string().min(1),
  price: z.number().int().min(0),
});

const sizeSchema = optionSchema.extend({
  widthMm: z.number().int().positive(),
  heightMm: z.number().int().positive(),
});

export const productConfigSchema = z.object({
  pricing: z.enum(["per_unit", "per_m2"]),
  pricePerM2: z.number().int().min(0).default(0),
  allowCustomSize: z.boolean().default(false),
  maxCustomMm: z.number().int().positive().default(5000),
  sizes: z.array(sizeSchema).min(1),
  materials: z.array(optionSchema).min(1),
  finishings: z.array(optionSchema).default([]),
  minQuantity: z.number().int().positive().default(1),
  quantityTiers: z
    .array(z.object({ min: z.number().int().positive(), discountPercent: z.number().min(0).max(90) }))
    .default([]),
  bleedMm: z.number().min(0).default(0),
  dpi: z.object({ recommended: z.number().positive(), minimum: z.number().positive() }),
  mockup: z.enum(["standee", "flyer", "banner"]),
});

export type ProductConfig = z.infer<typeof productConfigSchema>;
export type SizeOption = z.infer<typeof sizeSchema>;

export const CUSTOM_SIZE = "custom";

export interface OrderOptions {
  sizeCode: string;
  customWidthMm?: number;
  customHeightMm?: number;
  materialCode: string;
  finishingCodes: string[];
  quantity: number;
}

export interface PriceQuote {
  ok: true;
  widthMm: number;
  heightMm: number;
  sizeLabel: string;
  materialLabel: string;
  finishingLabels: string[];
  unitPrice: number;
  discountPercent: number;
  total: number;
}

export type PriceResult = PriceQuote | { ok: false; error: string };

export function parseConfig(raw: unknown): ProductConfig {
  return productConfigSchema.parse(raw);
}

export function calculatePrice(config: ProductConfig, opts: OrderOptions): PriceResult {
  let widthMm: number;
  let heightMm: number;
  let sizeLabel: string;
  let sizePrice = 0;

  if (opts.sizeCode === CUSTOM_SIZE) {
    if (!config.allowCustomSize) return { ok: false, error: "Sản phẩm này không hỗ trợ kích thước tùy chỉnh" };
    widthMm = Math.round(opts.customWidthMm ?? 0);
    heightMm = Math.round(opts.customHeightMm ?? 0);
    if (widthMm < 50 || heightMm < 50) return { ok: false, error: "Kích thước tối thiểu 50 mm mỗi chiều" };
    if (widthMm > config.maxCustomMm || heightMm > config.maxCustomMm)
      return { ok: false, error: `Kích thước tối đa ${config.maxCustomMm} mm mỗi chiều` };
    sizeLabel = `${widthMm / 10} x ${heightMm / 10} cm (tùy chỉnh)`;
  } else {
    const size = config.sizes.find((s) => s.code === opts.sizeCode);
    if (!size) return { ok: false, error: "Chưa chọn kích thước" };
    ({ widthMm, heightMm } = size);
    sizeLabel = size.label;
    sizePrice = size.price;
  }

  const material = config.materials.find((m) => m.code === opts.materialCode);
  if (!material) return { ok: false, error: "Chưa chọn chất liệu" };
  const finishings = config.finishings.filter((f) => opts.finishingCodes.includes(f.code));

  const quantity = Math.floor(opts.quantity);
  if (!Number.isFinite(quantity) || quantity < config.minQuantity)
    return { ok: false, error: `Số lượng tối thiểu ${config.minQuantity}` };

  const optionsPrice = material.price + finishings.reduce((sum, f) => sum + f.price, 0);
  let unitPrice: number;
  if (config.pricing === "per_m2") {
    const areaM2 = (widthMm / 1000) * (heightMm / 1000);
    unitPrice = Math.round(areaM2 * (config.pricePerM2 + optionsPrice));
  } else {
    unitPrice = sizePrice + optionsPrice;
  }

  const tier = [...config.quantityTiers].sort((a, b) => b.min - a.min).find((t) => quantity >= t.min);
  const discountPercent = tier?.discountPercent ?? 0;
  // Làm tròn tới 1.000đ
  const total = Math.round((unitPrice * quantity * (1 - discountPercent / 100)) / 1000) * 1000;

  return {
    ok: true,
    widthMm,
    heightMm,
    sizeLabel,
    materialLabel: material.label,
    finishingLabels: finishings.map((f) => f.label),
    unitPrice,
    discountPercent,
    total,
  };
}

export function formatVnd(amount: number): string {
  return amount.toLocaleString("vi-VN") + "đ";
}
