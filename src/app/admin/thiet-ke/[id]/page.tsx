import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { Timeline } from "@/components/Timeline";
import { db } from "@/lib/db";
import { DESIGN_STATUS_LABEL, formatDate, PAYMENT_STATUS_LABEL } from "@/lib/labels";
import { formatVnd } from "@/lib/pricing";
import { DesignAdminForms } from "../../AdminForms";

export default async function AdminDesignDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await db.designRequest.findUnique({
    where: { id },
    include: { user: true, files: { orderBy: { createdAt: "desc" } }, history: { orderBy: { createdAt: "desc" } } },
  });
  if (!r) notFound();
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">Đơn thiết kế {r.code}</h1>
        <StatusBadge status={r.status} label={DESIGN_STATUS_LABEL[r.status]} />
        <StatusBadge status={r.paymentStatus} label={PAYMENT_STATUS_LABEL[r.paymentStatus]} />
      </div>
      <p className="mt-1 text-sm text-gray-500">Gửi lúc {formatDate(r.createdAt)} bởi {r.user.name ?? r.user.email} · {r.contactPhone}</p>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <div className="card">
            <dl className="grid grid-cols-[140px_1fr] gap-y-1.5 text-sm">
              <dt className="text-gray-500">Ấn phẩm</dt><dd>{r.productType}</dd>
              <dt className="text-gray-500">Kích thước</dt><dd>{r.sizeLabel}</dd>
              <dt className="text-gray-500">Hạn</dt><dd>{r.deadline ? r.deadline.toLocaleDateString("vi-VN") : "Không yêu cầu"}</dd>
              <dt className="text-gray-500">Ngân sách</dt><dd>{r.budget ? formatVnd(r.budget) : "Không nêu"}</dd>
              <dt className="text-gray-500">Brief</dt><dd className="whitespace-pre-line">{r.brief}</dd>
            </dl>
          </div>
          <div className="card">
            <h2 className="mb-3 font-semibold">File</h2>
            <ul className="space-y-1 text-sm">
              {r.files.map((f) => (
                <li key={f.id} className="flex justify-between gap-3">
                  <a href={`/api/files/${f.id}/original`} className="text-brand-700 underline">{f.originalName}</a>
                  <span className="text-gray-500">{f.kind === "DESIGN_DRAFT" ? "Bản thiết kế" : "Khách gửi"} · {formatDate(f.createdAt)}</span>
                </li>
              ))}
              {r.files.length === 0 && <li className="text-gray-500">Chưa có file</li>}
            </ul>
          </div>
          <div className="card"><h2 className="mb-4 font-semibold">Dòng thời gian</h2><Timeline events={r.history} /></div>
        </div>
        <DesignAdminForms id={r.id} status={r.status} price={r.price} paymentStatus={r.paymentStatus} paidAmount={r.paidAmount} />
      </div>
    </div>
  );
}
