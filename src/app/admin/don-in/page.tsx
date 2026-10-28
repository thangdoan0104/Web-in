import type { Prisma, PrintStatus } from "@prisma/client";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { db } from "@/lib/db";
import { formatDate, PAYMENT_STATUS_LABEL, PRINT_STATUS_LABEL } from "@/lib/labels";
import { formatVnd } from "@/lib/pricing";

const FILTERS: { key: string; label: string; where: Prisma.PrintOrderWhereInput }[] = [
  { key: "", label: "Tất cả", where: {} },
  { key: "PENDING", label: "Chờ xác nhận", where: { status: "PENDING" } },
  { key: "active", label: "Đang sản xuất", where: { status: { in: ["CONFIRMED", "PREPRESS", "PRINTING", "FINISHING"] as PrintStatus[] } } },
  { key: "READY", label: "Sẵn sàng giao", where: { status: "READY" } },
  { key: "done", label: "Đã xong / hủy", where: { status: { in: ["COMPLETED", "CANCELLED"] as PrintStatus[] } } },
];

export default async function AdminPrintOrders({ searchParams }: { searchParams: Promise<{ status?: string; payment?: string; q?: string }> }) {
  const { status = "", payment, q } = await searchParams;
  const filter = FILTERS.find((f) => f.key === status) ?? FILTERS[0];
  const where: Prisma.PrintOrderWhereInput = {
    ...filter.where,
    ...(payment === "open" ? { paymentStatus: { in: ["UNPAID", "DEPOSITED"] }, status: { not: "CANCELLED" } } : {}),
    ...(q ? { OR: [{ code: { contains: q, mode: "insensitive" } }, { contactPhone: { contains: q } }, { contactName: { contains: q, mode: "insensitive" } }] } : {}),
  };
  const orders = await db.printOrder.findMany({ where, include: { product: true }, orderBy: { createdAt: "desc" }, take: 200 });

  return (
    <div>
      <h1 className="text-2xl font-bold">Đơn in</h1>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <Link key={f.key} href={f.key ? `/admin/don-in?status=${f.key}` : "/admin/don-in"} className={`rounded-full px-3 py-1 text-sm ${f.key === filter.key && !payment ? "bg-ink text-white" : "bg-white ring-1 ring-gray-300"}`}>
            {f.label}
          </Link>
        ))}
        <form className="ml-auto">
          <input name="q" defaultValue={q} placeholder="Tìm mã đơn, tên, SĐT" className="input w-56" />
        </form>
      </div>
      <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr><th className="px-4 py-3">Mã</th><th className="px-4 py-3">Khách</th><th className="px-4 py-3">Sản phẩm</th><th className="px-4 py-3">Tổng</th><th className="px-4 py-3">Tiến độ</th><th className="px-4 py-3">Thanh toán</th><th className="px-4 py-3">Ngày đặt</th></tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-semibold"><Link href={`/admin/don-in/${o.id}`} className="text-brand-700">{o.code}</Link>{o.acceptedWarnings && <span title="Khách bỏ qua cảnh báo file" className="ml-1 text-amber-500">⚠</span>}</td>
                <td className="px-4 py-3">{o.contactName}<br /><span className="text-gray-500">{o.contactPhone}</span></td>
                <td className="px-4 py-3">{o.product.name}<br /><span className="text-gray-500">{o.widthMm / 10}x{o.heightMm / 10} cm · SL {o.quantity}</span></td>
                <td className="px-4 py-3">{formatVnd(o.price)}</td>
                <td className="px-4 py-3"><StatusBadge status={o.status} label={PRINT_STATUS_LABEL[o.status]} /></td>
                <td className="px-4 py-3"><StatusBadge status={o.paymentStatus} label={PAYMENT_STATUS_LABEL[o.paymentStatus]} /></td>
                <td className="px-4 py-3 text-gray-500">{formatDate(o.createdAt)}</td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Không có đơn nào</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
