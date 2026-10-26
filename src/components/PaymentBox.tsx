import type { PaymentStatus } from "@prisma/client";
import { PAYMENT_STATUS_LABEL } from "@/lib/labels";
import { formatVnd } from "@/lib/pricing";
import { StatusBadge } from "./StatusBadge";

// Mã VietQR: khách quét bằng app ngân hàng, số tiền + nội dung (mã đơn) điền sẵn
export function PaymentBox({ code, amount, paidAmount, status }: { code: string; amount: number; paidAmount: number; status: PaymentStatus }) {
  const remaining = Math.max(0, amount - paidAmount);
  const bank = process.env.BANK_BIN;
  const account = process.env.BANK_ACCOUNT_NO;
  const qr =
    bank && account && remaining > 0 && status !== "PAID" && status !== "REFUNDED"
      ? `https://img.vietqr.io/image/${bank}-${account}-compact2.png?amount=${remaining}&addInfo=${encodeURIComponent(code)}&accountName=${encodeURIComponent(process.env.BANK_ACCOUNT_NAME ?? "")}`
      : null;
  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Thanh toán</h2>
        <StatusBadge status={status} label={PAYMENT_STATUS_LABEL[status]} />
      </div>
      <dl className="space-y-1 text-sm">
        <div className="flex justify-between"><dt>Tổng tiền</dt><dd className="font-semibold">{formatVnd(amount)}</dd></div>
        <div className="flex justify-between"><dt>Đã thanh toán</dt><dd>{formatVnd(paidAmount)}</dd></div>
        {remaining > 0 && <div className="flex justify-between text-brand-700"><dt>Còn lại</dt><dd className="font-semibold">{formatVnd(remaining)}</dd></div>}
      </dl>
      {qr && (
        <div className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="Mã QR chuyển khoản" className="mx-auto w-56" />
          <p className="text-xs text-gray-500">Nội dung chuyển khoản: <b>{code}</b>. Xưởng sẽ xác nhận sau khi nhận tiền.</p>
        </div>
      )}
    </div>
  );
}
