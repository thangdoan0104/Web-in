"use client";

import { useState } from "react";
import type { FileCheckResult } from "@/lib/filecheck";

// Mockup thực tế + chế độ 2D có đường xén (đỏ) và vùng an toàn (xanh)
export function ProofViewer({ mockupUrl, previewUrl, check }: { mockupUrl: string; previewUrl: string; check: FileCheckResult }) {
  const [mode, setMode] = useState<"mockup" | "2d">("mockup");
  const { widthMm, heightMm, bleedMm } = check.target;
  const fileW = check.info.widthPx ?? check.info.pageWidthMm ?? widthMm;
  const fileH = check.info.heightPx ?? check.info.pageHeightMm ?? heightMm;
  const rotate = fileW > fileH !== widthMm > heightMm && widthMm !== heightMm;
  const w = rotate ? heightMm : widthMm;
  const h = rotate ? widthMm : heightMm;
  const fullW = w + 2 * bleedMm;
  const fullH = h + 2 * bleedMm;
  const safeMm = Math.max(3, Math.min(w, h) * 0.03);
  const pct = (mm: number, total: number) => `${(mm / total) * 100}%`;

  return (
    <div className="flex gap-4">
      <div className="flex flex-col gap-3">
        {(
          [
            ["mockup", "Mockup"],
            ["2d", "Xem 2D"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setMode(key)}
            className={`w-20 rounded-lg px-2 py-2 text-xs font-semibold ${mode === key ? "bg-ink text-white" : "bg-white text-ink ring-1 ring-gray-300"}`}
          >
            {label}
          </button>
        ))}
        <a href={`${mode === "mockup" ? mockupUrl : previewUrl}&download`} className="w-20 rounded-lg bg-white px-2 py-2 text-center text-xs font-semibold ring-1 ring-gray-300">
          Tải về
        </a>
      </div>
      <div className="flex min-h-[420px] flex-1 items-center justify-center rounded-xl bg-gray-100 p-4">
        {mode === "mockup" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mockupUrl} alt="Mockup sản phẩm" className="max-h-[560px] w-auto rounded-lg object-contain" />
        ) : (
          <div className="w-full">
            <div
              className="relative mx-auto max-h-[520px] bg-white shadow"
              style={{ aspectRatio: `${fullW} / ${fullH}`, height: fullH >= fullW ? 520 : undefined, width: fullH >= fullW ? undefined : "100%" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="Bản in 2D" className="absolute inset-0 h-full w-full object-cover" />
              <div
                className="absolute border-2 border-dashed border-red-500"
                style={{ left: pct(bleedMm, fullW), right: pct(bleedMm, fullW), top: pct(bleedMm, fullH), bottom: pct(bleedMm, fullH) }}
              />
              <div
                className="absolute border border-dashed border-sky-500"
                style={{ left: pct(bleedMm + safeMm, fullW), right: pct(bleedMm + safeMm, fullW), top: pct(bleedMm + safeMm, fullH), bottom: pct(bleedMm + safeMm, fullH) }}
              />
            </div>
            <p className="mt-3 text-center text-xs text-gray-600">
              <span className="text-red-600">Nét đỏ</span>: đường xén {bleedMm > 0 ? `(phần ngoài sẽ bị cắt bỏ, ${bleedMm} mm)` : ""} ·{" "}
              <span className="text-sky-600">Nét xanh</span>: vùng an toàn, nên để chữ và logo bên trong
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
