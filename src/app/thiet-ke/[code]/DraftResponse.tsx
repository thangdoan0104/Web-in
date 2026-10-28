"use client";

import { useState, useTransition } from "react";
import { respondToDraft } from "../actions";

export function DraftResponse({ code }: { code: string }) {
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const send = (approve: boolean) =>
    start(async () => {
      const r = await respondToDraft(code, approve, feedback);
      setError(r.error ?? null);
    });
  return (
    <div className="space-y-3 rounded-lg bg-amber-50 p-4">
      <p className="font-semibold text-amber-900">Bản thiết kế đang chờ bạn duyệt</p>
      <textarea rows={3} className="input" placeholder="Góp ý chỉnh sửa (nếu có)" value={feedback} onChange={(e) => setFeedback(e.target.value)} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button className="btn-primary" disabled={pending} onClick={() => send(true)}>Duyệt thiết kế</button>
        <button className="btn-outline" disabled={pending} onClick={() => send(false)}>Yêu cầu sửa</button>
      </div>
    </div>
  );
}
