"use client";

import { useActionState, useState } from "react";
import { uploadFile } from "@/components/upload";
import { DESIGN_STATUS_LABEL, PAYMENT_STATUS_LABEL, PRINT_STATUS_LABEL } from "@/lib/labels";
import {
  attachDesignDraft,
  updateDesign,
  updateDesignPayment,
  updatePrintPayment,
  updatePrintPrice,
  updatePrintStatus,
} from "./actions";

type Result = { error?: string; ok?: boolean };
type BoundAction = (prev: Result, formData: FormData) => Promise<Result>;

function Feedback({ state }: { state: Result }) {
  if (state.error) return <p className="text-sm text-red-600">{state.error}</p>;
  if (state.ok) return <p className="text-sm text-emerald-700">Đã lưu</p>;
  return null;
}

function StatusForm({ action, labels, current, title }: { action: BoundAction; labels: Record<string, string>; current: string; title: string }) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="card space-y-3">
      <h2 className="font-semibold">{title}</h2>
      <select name="status" defaultValue={current} className="input">
        {Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <textarea name="note" rows={2} className="input" placeholder="Ghi chú cho khách (hiện trên dòng thời gian)" />
      <Feedback state={state} />
      <button className="btn-primary" disabled={pending}>Cập nhật tiến độ</button>
    </form>
  );
}

function PaymentForm({ action, current, paidAmount, total }: { action: BoundAction; current: string; paidAmount: number; total: number }) {
  const [state, formAction, pending] = useActionState(action, {});
  const [amount, setAmount] = useState(paidAmount);
  return (
    <form action={formAction} className="card space-y-3">
      <h2 className="font-semibold">Thanh toán</h2>
      <select name="paymentStatus" defaultValue={current} className="input" onChange={(e) => e.target.value === "PAID" && setAmount(total)}>
        {Object.entries(PAYMENT_STATUS_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <label className="block text-sm">
        Số tiền đã nhận (đ)
        <input name="paidAmount" type="number" min={0} className="input mt-1" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
      </label>
      <input name="note" className="input" placeholder="Ghi chú (VD: CK Vietcombank 10:30)" />
      <Feedback state={state} />
      <button className="btn-primary" disabled={pending}>Lưu thanh toán</button>
    </form>
  );
}

export function PrintOrderAdminForms({ id, status, paymentStatus, paidAmount, price }: { id: string; status: string; paymentStatus: string; paidAmount: number; price: number }) {
  const [priceState, priceAction, pricePending] = useActionState(updatePrintPrice.bind(null, id), {});
  return (
    <div className="space-y-4">
      <StatusForm action={updatePrintStatus.bind(null, id)} labels={PRINT_STATUS_LABEL} current={status} title="Tiến độ" />
      <PaymentForm action={updatePrintPayment.bind(null, id)} current={paymentStatus} paidAmount={paidAmount} total={price} />
      <form action={priceAction} className="card space-y-3">
        <h2 className="font-semibold">Điều chỉnh giá</h2>
        <input name="price" type="number" min={0} defaultValue={price} className="input" />
        <input name="note" className="input" placeholder="Lý do (VD: phụ phí chỉnh file)" />
        <Feedback state={priceState} />
        <button className="btn-outline" disabled={pricePending}>Lưu giá</button>
      </form>
    </div>
  );
}

export function DesignAdminForms({ id, status, price, paymentStatus, paidAmount }: { id: string; status: string; price: number | null; paymentStatus: string; paidAmount: number }) {
  const [state, formAction, pending] = useActionState(updateDesign.bind(null, id), {});
  const [upload, setUpload] = useState<{ busy: boolean; error?: string; done?: string }>({ busy: false });

  async function sendDraft(file: File) {
    setUpload({ busy: true });
    try {
      const fileId = await uploadFile(file, "DESIGN_DRAFT");
      const r = await attachDesignDraft(id, fileId);
      setUpload(r.error ? { busy: false, error: r.error } : { busy: false, done: file.name });
    } catch (e) {
      setUpload({ busy: false, error: (e as Error).message });
    }
  }

  return (
    <div className="space-y-4">
      <div className="card space-y-3">
        <h2 className="font-semibold">Gửi bản thiết kế cho khách duyệt</h2>
        <input type="file" disabled={upload.busy} onChange={(e) => e.target.files?.[0] && sendDraft(e.target.files[0])} className="text-sm" />
        {upload.busy && <p className="text-sm text-gray-500">Đang tải lên...</p>}
        {upload.error && <p className="text-sm text-red-600">{upload.error}</p>}
        {upload.done && <p className="text-sm text-emerald-700">Đã gửi {upload.done}</p>}
      </div>
      <form action={formAction} className="card space-y-3">
        <h2 className="font-semibold">Trạng thái & báo giá</h2>
        <select name="status" defaultValue={status} className="input">
          {Object.entries(DESIGN_STATUS_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <label className="block text-sm">
          Giá thiết kế (đ)
          <input name="price" type="number" min={0} defaultValue={price ?? ""} className="input mt-1" />
        </label>
        <textarea name="note" rows={2} className="input" placeholder="Ghi chú cho khách" />
        <Feedback state={state} />
        <button className="btn-primary" disabled={pending}>Cập nhật</button>
      </form>
      {price !== null && <PaymentForm action={updateDesignPayment.bind(null, id)} current={paymentStatus} paidAmount={paidAmount} total={price} />}
    </div>
  );
}
