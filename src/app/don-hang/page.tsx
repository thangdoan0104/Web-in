import Link from "next/link";
import { db } from "@/lib/db";
import { DESIGN_STATUS_LABEL, formatDate, PAYMENT_STATUS_LABEL, PRINT_STATUS_LABEL } from "@/lib/labels";
import { formatVnd } from "@/lib/pricing";
import { requireUser } from "@/lib/session";
import { StatusBadge } from "@/components/StatusBadge";

export default async function MyOrdersPage() {
  const user = await requireUser("/don-hang");
  const [prints, designs] = await Promise.all([
    db.printOrder.findMany({ where: { userId: user.id }, include: { product: true }, orderBy: { createdAt: "desc" } }),
    db.designRequest.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold">Đơn của tôi</h1>

      <h2 className="mt-8 text-lg font-semibold">Đơn in</h2>
      {prints.length === 0 ? (
        <p className="mt-2 text-gray-600">Chưa có đơn in. <Link href="/dat-in" className="text-brand-700 underline">Đặt in ngay</Link></p>
      ) : (
        <ul className="mt-3 space-y-3">
          {prints.map((o) => (
            <li key={o.id}>
              <Link href={`/don-hang/${o.code}`} className="card flex flex-wrap items-center justify-between gap-3 hover:border-brand-500">
                <div>
                  <p className="font-semibold">{o.code} · {o.product.name}</p>
                  <p className="text-sm text-gray-500">{formatDate(o.createdAt)} · {o.quantity} cái · {formatVnd(o.price)}</p>
                </div>
                <div className="flex gap-2">
                  <StatusBadge status={o.status} label={PRINT_STATUS_LABEL[o.status]} />
                  <StatusBadge status={o.paymentStatus} label={PAYMENT_STATUS_LABEL[o.paymentStatus]} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-10 text-lg font-semibold">Đơn thiết kế</h2>
      {designs.length === 0 ? (
        <p className="mt-2 text-gray-600">Chưa có đơn thiết kế. <Link href="/thiet-ke" className="text-brand-700 underline">Đặt thiết kế</Link></p>
      ) : (
        <ul className="mt-3 space-y-3">
          {designs.map((d) => (
            <li key={d.id}>
              <Link href={`/thiet-ke/${d.code}`} className="card flex flex-wrap items-center justify-between gap-3 hover:border-brand-500">
                <div>
                  <p className="font-semibold">{d.code} · {d.productType}</p>
                  <p className="text-sm text-gray-500">{formatDate(d.createdAt)} · {d.sizeLabel}</p>
                </div>
                <div className="flex gap-2">
                  <StatusBadge status={d.status} label={DESIGN_STATUS_LABEL[d.status]} />
                  <StatusBadge status={d.paymentStatus} label={PAYMENT_STATUS_LABEL[d.paymentStatus]} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
