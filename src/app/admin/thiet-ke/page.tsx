import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { db } from "@/lib/db";
import { DESIGN_STATUS_LABEL, formatDate, PAYMENT_STATUS_LABEL } from "@/lib/labels";

export default async function AdminDesigns() {
  const requests = await db.designRequest.findMany({ include: { user: true }, orderBy: { createdAt: "desc" }, take: 200 });
  return (
    <div>
      <h1 className="text-2xl font-bold">Đơn thiết kế</h1>
      <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr><th className="px-4 py-3">Mã</th><th className="px-4 py-3">Khách</th><th className="px-4 py-3">Ấn phẩm</th><th className="px-4 py-3">Hạn</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3">Thanh toán</th><th className="px-4 py-3">Ngày gửi</th></tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-semibold"><Link href={`/admin/thiet-ke/${r.id}`} className="text-brand-700">{r.code}</Link></td>
                <td className="px-4 py-3">{r.user.name ?? r.user.email}<br /><span className="text-gray-500">{r.contactPhone}</span></td>
                <td className="px-4 py-3">{r.productType}<br /><span className="text-gray-500">{r.sizeLabel}</span></td>
                <td className="px-4 py-3">{r.deadline ? r.deadline.toLocaleDateString("vi-VN") : "–"}</td>
                <td className="px-4 py-3"><StatusBadge status={r.status} label={DESIGN_STATUS_LABEL[r.status]} /></td>
                <td className="px-4 py-3"><StatusBadge status={r.paymentStatus} label={PAYMENT_STATUS_LABEL[r.paymentStatus]} /></td>
                <td className="px-4 py-3 text-gray-500">{formatDate(r.createdAt)}</td>
              </tr>
            ))}
            {requests.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Chưa có đơn thiết kế</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
