"use client";

import { useState, useTransition } from "react";
import { cancelPrintOrder } from "../actions";

export function CancelOrderButton({ code }: { code: string }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!confirming)
    return (
      <button type="button" className="btn-outline w-full" onClick={() => setConfirming(true)}>
        Hủy đơn
      </button>
    );
  return (
    <div className="card space-y-3">
      <p className="text-sm">Hủy đơn {code}? Thao tác này không hoàn tác được.</p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          className="btn bg-red-600 text-white hover:bg-red-700"
          disabled={pending}
          onClick={() => start(async () => setError((await cancelPrintOrder(code)).error ?? null))}
        >
          {pending ? "Đang hủy..." : "Xác nhận hủy"}
        </button>
        <button type="button" className="btn-outline" onClick={() => setConfirming(false)} disabled={pending}>
          Giữ đơn
        </button>
      </div>
    </div>
  );
}
