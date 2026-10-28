import { notFound } from "next/navigation";
import { PaymentBox } from "@/components/PaymentBox";
import { StatusBadge } from "@/components/StatusBadge";
import { Timeline } from "@/components/Timeline";
import { db } from "@/lib/db";
import { DESIGN_STATUS_LABEL, formatDate } from "@/lib/labels";
import { formatVnd } from "@/lib/pricing";
import { requireUser } from "@/lib/session";
import { DraftResponse } from "./DraftResponse";

export default async function DesignDetailPage({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ moi?: string }> }) {
  const { code } = await params;
  const { moi } = await searchParams;
  const user = await requireUser(`/thiet-ke/${code}`);
  const request = await db.designRequest.findUnique({
    where: { code },
    include: { files: { orderBy: { createdAt: "desc" } }, history: { orderBy: { createdAt: "desc" } } },
  });
  if (!request || (request.userId !== user.id && user.role !== "ADMIN")) notFound();
  const drafts = request.files.filter((f) => f.kind === "DESIGN_DRAFT");
  const refs = request.files.filter((f) => f.kind === "DESIGN_REFERENCE");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {moi && <p className="mb-6 rounded-lg bg-emerald-50 px-4 py-3 text-emerald-800">Đã gửi yêu cầu! Đội thiết kế sẽ liên hệ báo giá sớm.</p>}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold">Đơn thiết kế {request.code}</h1>
        <StatusBadge status={request.status} label={DESIGN_STATUS_LABEL[request.status]} />
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {request.status === "WAITING_APPROVAL" && request.userId === user.id && <DraftResponse code={request.code} />}
          {drafts.length > 0 && (
            <div className="card">
              <h2 className="mb-3 font-semibold">Bản thiết kế</h2>
              <ul className="space-y-2 text-sm">
                {drafts.map((f) => (
                  <li key={f.id} className="flex justify-between gap-3">
                    <a className="text-brand-700 underline" href={`/api/files/${f.id}/original`}>{f.originalName}</a>
                    <span className="text-gray-500">{formatDate(f.createdAt)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="card">
            <h2 className="mb-3 font-semibold">Yêu cầu</h2>
            <dl className="grid grid-cols-[140px_1fr] gap-y-1.5 text-sm">
              <dt className="text-gray-500">Loại ấn phẩm</dt><dd>{request.productType}</dd>
              <dt className="text-gray-500">Kích thước</dt><dd>{request.sizeLabel}</dd>
              {request.deadline && (<><dt className="text-gray-500">Cần xong trước</dt><dd>{request.deadline.toLocaleDateString("vi-VN")}</dd></>)}
              {request.budget && (<><dt className="text-gray-500">Ngân sách</dt><dd>{formatVnd(request.budget)}</dd></>)}
              <dt className="text-gray-500">Brief</dt><dd className="whitespace-pre-line">{request.brief}</dd>
              {refs.length > 0 && (
                <>
                  <dt className="text-gray-500">Tài liệu</dt>
                  <dd>{refs.map((f) => <a key={f.id} href={`/api/files/${f.id}/original`} className="block text-brand-700 underline">{f.originalName}</a>)}</dd>
                </>
              )}
            </dl>
          </div>
        </div>
        <div className="space-y-6">
          {request.price ? (
            <PaymentBox code={request.code} amount={request.price} paidAmount={request.paidAmount} status={request.paymentStatus} />
          ) : (
            <div className="card text-sm text-gray-600">Đội thiết kế sẽ báo giá sau khi xem brief.</div>
          )}
          <div className="card">
            <h2 className="mb-4 font-semibold">Tiến độ</h2>
            <Timeline events={request.history} />
          </div>
        </div>
      </div>
    </div>
  );
}
