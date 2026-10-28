import Link from "next/link";
import { db } from "@/lib/db";

export default async function AdminHome() {
  const startOfDay = new Date(new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }) + "T00:00:00+07:00");
  const [newToday, pending, inProgress, unpaid, designsOpen] = await Promise.all([
    db.printOrder.count({ where: { createdAt: { gte: startOfDay } } }),
    db.printOrder.count({ where: { status: "PENDING" } }),
    db.printOrder.count({ where: { status: { in: ["CONFIRMED", "PREPRESS", "PRINTING", "FINISHING"] } } }),
    db.printOrder.count({ where: { paymentStatus: { in: ["UNPAID", "DEPOSITED"] }, status: { not: "CANCELLED" } } }),
    db.designRequest.count({ where: { status: { notIn: ["APPROVED", "CANCELLED"] } } }),
  ]);
  const stats = [
    { label: "Đơn in mới hôm nay", value: newToday, href: "/admin/don-in" },
    { label: "Chờ xác nhận", value: pending, href: "/admin/don-in?status=PENDING" },
    { label: "Đang sản xuất", value: inProgress, href: "/admin/don-in?status=active" },
    { label: "Chưa thanh toán đủ", value: unpaid, href: "/admin/don-in?payment=open" },
    { label: "Đơn thiết kế đang mở", value: designsOpen, href: "/admin/thiet-ke" },
  ];
  return (
    <div>
      <h1 className="text-2xl font-bold">Tổng quan</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="card hover:border-brand-500">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className="mt-1 text-3xl font-bold">{s.value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
