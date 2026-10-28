"use client";

import { useState } from "react";
import type { FileCheckResult } from "@/lib/filecheck";
import { placement } from "@/lib/placement";

// Mockup thực tế + chế độ 2D: khổ in, phần file bị cắt (mờ), đường xén (đỏ) và vùng an toàn (xanh)
export function ProofViewer({ mockupUrl, previewUrl, check }: { mockupUrl: string; previewUrl: string; check: FileCheckResult }) {
  const [mode, setMode] = useState<"mockup" | "2d">("mockup");
  const fileW = check.info.widthPx ?? check.info.pageWidthMm ?? check.target.widthMm;
  const fileH = check.info.heightPx ?? check.info.pageHeightMm ?? check.target.heightMm;
  // Kết quả kiểm tra cũ (trước khi có fit) vẫn hiển thị được với mặc định phóng kín khổ
  const p = placement(fileW, fileH, check.target, check.fit ?? "cover");
  const bleedMm = p.bleed;
  const safeMm = Math.max(3, Math.min(p.w, p.h) * 0.03);
  // Khung nhìn bao cả khổ in và phần file tràn ra ngoài
  const viewW = Math.max(p.frameW, p.imageW);
  const viewH = Math.max(p.frameH, p.imageH);
  const overflow = p.imageW > p.frameW + 0.5 || p.imageH > p.frameH + 0.5;
  const pct = (mm: number, total: number) => `${(mm / total) * 100}%`;
  const box = (w: number, h: number) => ({ left: pct((viewW - w) / 2, viewW), top: pct((viewH - h) / 2, viewH), width: pct(w, viewW), height: pct(h, viewH) });

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
          <img src={mockupUrl} alt="Mockup sản phẩm" className="max-h-[80vh] w-auto rounded-lg object-contain" />
        ) : (
          <div className="w-full">
            <div
              className="relative mx-auto max-h-[70vh] max-w-full overflow-hidden"
              style={{ aspectRatio: `${viewW} / ${viewH}`, height: viewH >= viewW ? 640 : undefined, width: viewH >= viewW ? undefined : "100%" }}
            >
              <div className="absolute bg-white shadow" style={box(p.frameW, p.frameH)} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="Bản in 2D" className="absolute max-w-none" style={box(p.imageW, p.imageH)} />
              <div className="absolute ring-1 ring-black/40" style={{ ...box(p.frameW, p.frameH), boxShadow: "0 0 0 100vmax rgb(243 244 246 / 0.75)" }}>
                <div
                  className="absolute border-2 border-dashed border-red-500"
                  style={{ left: pct(bleedMm, p.frameW), right: pct(bleedMm, p.frameW), top: pct(bleedMm, p.frameH), bottom: pct(bleedMm, p.frameH) }}
                />
                <div
                  className="absolute border border-dashed border-sky-500"
                  style={{ left: pct(bleedMm + safeMm, p.frameW), right: pct(bleedMm + safeMm, p.frameW), top: pct(bleedMm + safeMm, p.frameH), bottom: pct(bleedMm + safeMm, p.frameH) }}
                />
              </div>
            </div>
            <p className="mt-3 text-center text-xs text-gray-600">
              {overflow ? "Phần mờ bên ngoài: bị cắt bỏ · " : ""}
              <span className="text-red-600">Nét đỏ</span>: đường xén {bleedMm > 0 ? `(phần ngoài sẽ bị cắt bỏ, ${bleedMm} mm)` : ""} ·{" "}
              <span className="text-sky-600">Nét xanh</span>: vùng an toàn, nên để chữ và logo bên trong
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
