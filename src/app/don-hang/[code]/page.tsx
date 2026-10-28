import { notFound } from "next/navigation";
import { CheckList } from "@/components/CheckList";
import { PaymentBox } from "@/components/PaymentBox";
import { PrintOrderSummary } from "@/components/PrintOrderSummary";
import { ProofViewer } from "@/components/ProofViewer";
import { StatusBadge } from "@/components/StatusBadge";
import { Timeline } from "@/components/Timeline";
import { db } from "@/lib/db";
import type { FileCheckResult } from "@/lib/filecheck";
import { PRINT_STATUS_FLOW, PRINT_STATUS_LABEL } from "@/lib/labels";
import { requireUser } from "@/lib/session";
import { CancelOrderButton } from "./CancelOrderButton";

export default async function OrderDetailPage({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ moi?: string }> }) {
  const { code } = await params;
  const { moi } = await searchParams;
  const user = await requireUser(`/don-hang/${code}`);
  const order = await db.printOrder.findUnique({
    where: { code },
    include: { product: true, files: true, history: { orderBy: { createdAt: "desc" } } },
  });
  if (!order || (order.userId !== user.id && user.role !== "ADMIN")) notFound();
  const file = order.files[0];
  const check = file?.check as FileCheckResult | null;
  const currentIndex = PRINT_STATUS_FLOW.indexOf(order.status);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {moi && <p className="mb-6 rounded-lg bg-emerald-50 px-4 py-3 text-emerald-800">Đặt in thành công! Xưởng sẽ xác nhận đơn sớm. Bạn có thể chuyển khoản bằng mã QR bên dưới.</p>}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold">Đơn {order.code}</h1>
        <StatusBadge status={order.status} label={PRINT_STATUS_LABEL[order.status]} />
      </div>

      {order.status !== "CANCELLED" && (
        <ol className="mt-6 grid grid-cols-7 gap-1 text-center text-[11px] sm:text-xs">
          {PRINT_STATUS_FLOW.map((s, i) => (
            <li key={s}>
              <span className={`mb-1 block h-1.5 rounded-full ${i <= currentIndex ? "bg-brand-600" : "bg-gray-200"}`} />
              <span className={i <= currentIndex ? "font-semibold text-brand-700" : "text-gray-400"}>{PRINT_STATUS_LABEL[s]}</span>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {file && check && (
            <div className="card">
              <ProofViewer mockupUrl={`/api/files/${file.id}/mockup?v=1`} previewUrl={`/api/files/${file.id}/preview?v=1`} check={check} />
            </div>
          )}
          <div className="card">
            <h2 className="mb-3 font-semibold">Chi tiết đơn</h2>
            <PrintOrderSummary order={order} />
          </div>
          {check && (
            <div>
              <h2 className="mb-3 font-semibold">Kết quả kiểm tra file</h2>
              <CheckList items={check.items} />
            </div>
          )}
        </div>
        <div className="space-y-6">
          <PaymentBox code={order.code} amount={order.price} paidAmount={order.paidAmount} status={order.paymentStatus} />
          {order.status === "PENDING" && order.userId === user.id && <CancelOrderButton code={order.code} />}
          <div className="card">
            <h2 className="mb-4 font-semibold">Tiến độ</h2>
            <Timeline events={order.history} />
          </div>
        </div>
      </div>
    </div>
  );
}
