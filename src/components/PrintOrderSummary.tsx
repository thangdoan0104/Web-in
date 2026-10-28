import type { PrintOrder, Product } from "@prisma/client";
import { formatVnd } from "@/lib/pricing";

export interface StoredOptions {
  sizeLabel: string;
  materialLabel: string;
  finishingLabels: string[];
  unitPrice: number;
  discountPercent: number;
}

export function PrintOrderSummary({ order }: { order: PrintOrder & { product: Product } }) {
  const opts = order.options as unknown as StoredOptions;
  return (
    <dl className="grid grid-cols-[140px_1fr] gap-y-1.5 text-sm">
      <dt className="text-gray-500">Sản phẩm</dt><dd>{order.product.name}</dd>
      <dt className="text-gray-500">Kích thước</dt><dd>{opts.sizeLabel}</dd>
      <dt className="text-gray-500">Chất liệu</dt><dd>{opts.materialLabel}</dd>
      {opts.finishingLabels.length > 0 && (<><dt className="text-gray-500">Gia công</dt><dd>{opts.finishingLabels.join(", ")}</dd></>)}
      <dt className="text-gray-500">Số lượng</dt><dd>{order.quantity}</dd>
      <dt className="text-gray-500">Đơn giá</dt><dd>{formatVnd(opts.unitPrice)}{opts.discountPercent > 0 ? ` (giảm ${opts.discountPercent}%)` : ""}</dd>
      <dt className="text-gray-500">Nhận hàng</dt><dd>{order.deliveryMethod === "SHIP" ? `Giao tới: ${order.address}` : "Nhận tại xưởng"}</dd>
      <dt className="text-gray-500">Liên hệ</dt><dd>{order.contactName} · {order.contactPhone}</dd>
      {order.note && (<><dt className="text-gray-500">Ghi chú</dt><dd className="whitespace-pre-line">{order.note}</dd></>)}
    </dl>
  );
}
