import { notFound } from "next/navigation";
import { CheckList } from "@/components/CheckList";
import { PrintOrderSummary } from "@/components/PrintOrderSummary";
import { ProofViewer } from "@/components/ProofViewer";
import { StatusBadge } from "@/components/StatusBadge";
import { Timeline } from "@/components/Timeline";
import { db } from "@/lib/db";
import type { FileCheckResult } from "@/lib/filecheck";
import { formatDate, PAYMENT_STATUS_LABEL, PRINT_STATUS_LABEL } from "@/lib/labels";
import { formatVnd } from "@/lib/pricing";
import { PrintOrderAdminForms } from "../../AdminForms";

export default async function AdminPrintOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await db.printOrder.findUnique({
    where: { id },
    include: { product: true, files: true, user: true, history: { orderBy: { createdAt: "desc" } } },
  });
  if (!order) notFound();
  const file = order.files[0];
  const check = file?.check as FileCheckResult | null;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">Đơn {order.code}</h1>
        <StatusBadge status={order.status} label={PRINT_STATUS_LABEL[order.status]} />
        <StatusBadge status={order.paymentStatus} label={PAYMENT_STATUS_LABEL[order.paymentStatus]} />
        <span className="text-lg font-semibold">{formatVnd(order.price)}</span>
      </div>
      <p className="mt-1 text-sm text-gray-500">Đặt lúc {formatDate(order.createdAt)} bởi {order.user.name ?? order.user.email} ({order.user.email})</p>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {file && (
            <div className="card">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm">File: <b>{file.originalName}</b> · {(file.sizeBytes / 1024 / 1024).toFixed(1)} MB</p>
                <a href={`/api/files/${file.id}/original`} className="btn-primary py-1.5">Tải file gốc</a>
              </div>
              {check && <ProofViewer mockupUrl={`/api/files/${file.id}/mockup?v=1`} previewUrl={`/api/files/${file.id}/preview?v=1`} check={check} />}
            </div>
          )}
          {check && (
            <div>
              <h2 className="mb-2 font-semibold">
                Kiểm tra file {order.acceptedWarnings && <span className="ml-2 text-sm font-normal text-amber-700">Khách đã xác nhận bỏ qua cảnh báo</span>}
              </h2>
              <CheckList items={check.items} />
            </div>
          )}
          <div className="card"><h2 className="mb-3 font-semibold">Chi tiết</h2><PrintOrderSummary order={order} /></div>
          <div className="card"><h2 className="mb-4 font-semibold">Dòng thời gian</h2><Timeline events={order.history} /></div>
        </div>
        <PrintOrderAdminForms id={order.id} status={order.status} paymentStatus={order.paymentStatus} paidAmount={order.paidAmount} price={order.price} />
      </div>
    </div>
  );
}
