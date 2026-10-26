"use client";

import { useMemo, useState, useTransition } from "react";
import { CheckList } from "@/components/CheckList";
import { ProofViewer } from "@/components/ProofViewer";
import { uploadFile } from "@/components/upload";
import type { FileCheckResult } from "@/lib/filecheck";
import { calculatePrice, CUSTOM_SIZE, formatVnd, type OrderOptions, type ProductConfig } from "@/lib/pricing";
import { createPrintOrder } from "../actions";

interface Props {
  product: { slug: string; name: string; config: ProductConfig };
  defaults: { name: string; phone: string };
}

const STEPS = ["Tùy chọn", "Tải file", "Kiểm tra & mockup", "Xác nhận"];

interface Proof {
  fileId: string;
  fileName: string;
  check: FileCheckResult;
  previewUrl: string;
  mockupUrl: string;
  sizeKey: string;
}

export function OrderWizard({ product, defaults }: Props) {
  const { config } = product;
  const [step, setStep] = useState(0);
  const [options, setOptions] = useState<OrderOptions>({
    sizeCode: config.sizes[0].code,
    customWidthMm: config.sizes[0].widthMm,
    customHeightMm: config.sizes[0].heightMm,
    materialCode: config.materials[0].code,
    finishingCodes: [],
    quantity: config.minQuantity,
  });
  const quote = useMemo(() => calculatePrice(config, options), [config, options]);
  const sizeKey = `${options.sizeCode}:${options.customWidthMm}:${options.customHeightMm}`;

  const [proof, setProof] = useState<Proof | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{ id: string; name: string } | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [acceptWarnings, setAcceptWarnings] = useState(false);

  const [contact, setContact] = useState({ name: defaults.name, phone: defaults.phone, deliveryMethod: "PICKUP" as "PICKUP" | "SHIP", address: "", note: "" });
  const [submitting, startSubmit] = useTransition();

  async function runCheck(file: { id: string; name: string }) {
    setBusy("Đang kiểm tra file và dựng mockup...");
    setError(null);
    try {
      const res = await fetch(`/api/files/${file.id}/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productSlug: product.slug,
          sizeCode: options.sizeCode,
          customWidthMm: options.customWidthMm,
          customHeightMm: options.customHeightMm,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Kiểm tra file thất bại");
      setProof({ fileId: file.id, fileName: file.name, check: body.check, previewUrl: body.previewUrl, mockupUrl: body.mockupUrl, sizeKey });
      setAcceptWarnings(false);
      setStep(2);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function handleFile(file: File) {
    setError(null);
    setProof(null);
    setProgress(0);
    setBusy("Đang tải file lên...");
    try {
      const id = await uploadFile(file, "PRINT_ARTWORK", setProgress);
      const uploaded = { id, name: file.name };
      setUploadedFile(uploaded);
      setProgress(null);
      await runCheck(uploaded);
    } catch (e) {
      setError((e as Error).message);
      setBusy(null);
      setProgress(null);
    }
  }

  function goToProof() {
    if (proof && proof.sizeKey === sizeKey) setStep(2);
    else if (uploadedFile) runCheck(uploadedFile);
    else setStep(1);
  }

  function submit() {
    if (!proof) return;
    setError(null);
    startSubmit(async () => {
      const result = await createPrintOrder({
        productSlug: product.slug,
        options,
        fileId: proof.fileId,
        acceptWarnings,
        contactName: contact.name,
        contactPhone: contact.phone,
        deliveryMethod: contact.deliveryMethod,
        address: contact.address,
        note: contact.note,
      });
      if (result?.error) setError(result.error);
    });
  }

  const isCustom = options.sizeCode === CUSTOM_SIZE;
  const unit = product.slug === "to-roi" ? "tờ" : "cái";

  return (
    <div className="mt-6">
      <ol className="mb-8 flex flex-wrap gap-2 text-sm">
        {STEPS.map((label, i) => (
          <li key={label} className={`flex items-center gap-2 rounded-full px-3 py-1.5 ${i === step ? "bg-brand-600 text-white" : i < step ? "bg-brand-100 text-brand-700" : "bg-gray-200 text-gray-500"}`}>
            <span className="font-bold">{i + 1}</span> {label}
          </li>
        ))}
      </ol>

      {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {step === 0 && (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="card space-y-6">
            <fieldset>
              <legend className="label">Kích thước</legend>
              <div className="flex flex-wrap gap-2">
                {[...config.sizes, ...(config.allowCustomSize ? [{ code: CUSTOM_SIZE, label: "Tùy chỉnh" }] : [])].map((s) => (
                  <button
                    key={s.code}
                    type="button"
                    onClick={() => setOptions({ ...options, sizeCode: s.code })}
                    className={`rounded-lg border px-4 py-2 text-sm ${options.sizeCode === s.code ? "border-brand-600 bg-brand-50 font-semibold text-brand-700" : "border-gray-300 bg-white"}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              {isCustom && (
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <input type="number" className="input w-28" value={(options.customWidthMm ?? 0) / 10} min={5} onChange={(e) => setOptions({ ...options, customWidthMm: Number(e.target.value) * 10 })} />
                  <span>x</span>
                  <input type="number" className="input w-28" value={(options.customHeightMm ?? 0) / 10} min={5} onChange={(e) => setOptions({ ...options, customHeightMm: Number(e.target.value) * 10 })} />
                  <span>cm (rộng x cao)</span>
                </div>
              )}
            </fieldset>

            <fieldset>
              <legend className="label">Chất liệu</legend>
              <div className="flex flex-wrap gap-2">
                {config.materials.map((m) => (
                  <button
                    key={m.code}
                    type="button"
                    onClick={() => setOptions({ ...options, materialCode: m.code })}
                    className={`rounded-lg border px-4 py-2 text-sm ${options.materialCode === m.code ? "border-brand-600 bg-brand-50 font-semibold text-brand-700" : "border-gray-300 bg-white"}`}
                  >
                    {m.label}
                    {m.price > 0 && <span className="ml-1 text-gray-500">+{formatVnd(m.price)}{config.pricing === "per_m2" ? "/m²" : ""}</span>}
                  </button>
                ))}
              </div>
            </fieldset>

            {config.finishings.length > 0 && (
              <fieldset>
                <legend className="label">Gia công thêm</legend>
                <div className="space-y-2">
                  {config.finishings.map((f) => (
                    <label key={f.code} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={options.finishingCodes.includes(f.code)}
                        onChange={(e) =>
                          setOptions({
                            ...options,
                            finishingCodes: e.target.checked ? [...options.finishingCodes, f.code] : options.finishingCodes.filter((c) => c !== f.code),
                          })
                        }
                      />
                      {f.label} <span className="text-gray-500">+{formatVnd(f.price)}{config.pricing === "per_m2" ? "/m²" : `/${unit}`}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            <div>
              <label className="label" htmlFor="qty">Số lượng</label>
              <input id="qty" type="number" min={config.minQuantity} className="input w-40" value={options.quantity} onChange={(e) => setOptions({ ...options, quantity: Number(e.target.value) })} />
              {config.quantityTiers.length > 0 && (
                <p className="mt-1 text-xs text-gray-500">
                  Giảm giá: {config.quantityTiers.map((t) => `từ ${t.min} ${unit} giảm ${t.discountPercent}%`).join(", ")}
                </p>
              )}
            </div>
          </div>

          <PriceBox quote={quote} unit={unit}>
            <button type="button" className="btn-primary w-full" disabled={!quote.ok} onClick={() => (uploadedFile ? goToProof() : setStep(1))}>
              Tiếp tục: tải file
            </button>
          </PriceBox>
        </div>
      )}

      {step === 1 && (
        <div className="card">
          <label
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 px-6 py-16 text-center hover:border-brand-500"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files[0];
              if (f && !busy) handleFile(f);
            }}
          >
            <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.tif,.tiff,.webp" disabled={!!busy} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            <span className="text-lg font-semibold">{busy ?? "Kéo thả file vào đây hoặc bấm để chọn"}</span>
            <span className="mt-2 text-sm text-gray-500">
              PDF, JPG, PNG, TIFF. Khổ {quote.ok ? quote.sizeLabel : ""}
              {config.bleedMm > 0 ? `, cộng lề xén ${config.bleedMm} mm mỗi cạnh` : ""}. Khuyến nghị {config.dpi.recommended} dpi.
            </span>
            {progress !== null && (
              <span className="mt-4 h-2 w-64 overflow-hidden rounded-full bg-gray-200">
                <span className="block h-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} />
              </span>
            )}
          </label>
          <div className="mt-4">
            <button type="button" className="btn-outline" onClick={() => setStep(0)} disabled={!!busy}>← Quay lại tùy chọn</button>
          </div>
        </div>
      )}

      {step === 2 && proof && (
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="card">
            <ProofViewer mockupUrl={proof.mockupUrl} previewUrl={proof.previewUrl} check={proof.check} />
            <p className="mt-3 text-sm text-gray-500">File: {proof.fileName}</p>
          </div>
          <div className="space-y-4">
            <CheckList items={proof.check.items} />
            <p className="rounded-lg bg-white p-4 text-sm text-gray-600 ring-1 ring-gray-200">
              Sau khi bạn đặt in, nhân viên chế bản sẽ kiểm tra lại file một lần nữa và báo bạn ngay nếu phát hiện vấn đề khác.
            </p>
            {proof.check.worst !== "pass" && (
              <label className="flex items-start gap-2 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
                <input type="checkbox" className="mt-1" checked={acceptWarnings} onChange={(e) => setAcceptWarnings(e.target.checked)} />
                Tôi đã xem các cảnh báo và vẫn muốn in file này. Tôi hiểu bản in có thể bị mờ, lệch màu hoặc bị cắt như mô tả.
              </label>
            )}
            <div className="flex flex-col gap-2">
              <button type="button" className="btn-primary" disabled={proof.check.worst !== "pass" && !acceptWarnings} onClick={() => setStep(3)}>
                {proof.check.worst === "pass" ? "Duyệt mockup và tiếp tục" : "Bỏ qua cảnh báo và tiếp tục"}
              </button>
              <button type="button" className="btn-outline" onClick={() => { setProof(null); setUploadedFile(null); setStep(1); }}>
                Tải lại file khác
              </button>
              <button type="button" className="text-sm text-gray-500 underline" onClick={() => setStep(0)}>Đổi tùy chọn in</button>
            </div>
          </div>
        </div>
      )}

      {step === 3 && proof && (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="card space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="cname">Người nhận</label>
                <input id="cname" className="input" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} />
              </div>
              <div>
                <label className="label" htmlFor="cphone">Số điện thoại</label>
                <input id="cphone" className="input" inputMode="tel" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} />
              </div>
            </div>
            <fieldset>
              <legend className="label">Nhận hàng</legend>
              <div className="flex gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input type="radio" checked={contact.deliveryMethod === "PICKUP"} onChange={() => setContact({ ...contact, deliveryMethod: "PICKUP" })} />
                  Nhận tại xưởng
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" checked={contact.deliveryMethod === "SHIP"} onChange={() => setContact({ ...contact, deliveryMethod: "SHIP" })} />
                  Giao tận nơi
                </label>
              </div>
            </fieldset>
            {contact.deliveryMethod === "SHIP" && (
              <div>
                <label className="label" htmlFor="addr">Địa chỉ giao hàng</label>
                <input id="addr" className="input" value={contact.address} onChange={(e) => setContact({ ...contact, address: e.target.value })} />
              </div>
            )}
            <div>
              <label className="label" htmlFor="note">Ghi chú cho xưởng</label>
              <textarea id="note" rows={3} className="input" value={contact.note} onChange={(e) => setContact({ ...contact, note: e.target.value })} />
            </div>
            <button type="button" className="btn-outline" onClick={() => setStep(2)}>← Quay lại mockup</button>
          </div>
          <PriceBox quote={quote} unit={unit}>
            <button type="button" className="btn-primary w-full" disabled={submitting || !quote.ok} onClick={submit}>
              {submitting ? "Đang đặt in..." : "Đặt in"}
            </button>
            <p className="text-xs text-gray-500">Sau khi đặt, bạn sẽ thấy mã QR để chuyển khoản.</p>
          </PriceBox>
        </div>
      )}
    </div>
  );
}

function PriceBox({ quote, unit, children }: { quote: ReturnType<typeof calculatePrice>; unit: string; children: React.ReactNode }) {
  return (
    <aside className="card h-fit space-y-3 lg:sticky lg:top-24">
      <h2 className="font-semibold">Tạm tính</h2>
      {quote.ok ? (
        <>
          <dl className="space-y-1 text-sm text-gray-600">
            <div className="flex justify-between"><dt>Kích thước</dt><dd>{quote.sizeLabel}</dd></div>
            <div className="flex justify-between"><dt>Chất liệu</dt><dd>{quote.materialLabel}</dd></div>
            {quote.finishingLabels.length > 0 && <div className="flex justify-between gap-4"><dt>Gia công</dt><dd className="text-right">{quote.finishingLabels.join(", ")}</dd></div>}
            <div className="flex justify-between"><dt>Đơn giá</dt><dd>{formatVnd(quote.unitPrice)}/{unit}</dd></div>
            {quote.discountPercent > 0 && <div className="flex justify-between text-brand-700"><dt>Giảm giá</dt><dd>-{quote.discountPercent}%</dd></div>}
          </dl>
          <p className="flex items-baseline justify-between border-t border-gray-200 pt-3">
            <span className="text-sm">Tổng</span>
            <span className="text-2xl font-bold text-brand-700">{formatVnd(quote.total)}</span>
          </p>
        </>
      ) : (
        <p className="text-sm text-red-600">{quote.error}</p>
      )}
      {children}
    </aside>
  );
}
