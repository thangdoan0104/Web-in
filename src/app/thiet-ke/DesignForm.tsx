"use client";

import { useState, useTransition } from "react";
import { uploadFile } from "@/components/upload";
import { CUSTOM_SIZE, type ProductConfig } from "@/lib/pricing";
import { createDesignRequest } from "./actions";

type DesignProduct = { slug: string; name: string; config: ProductConfig };

export function DesignForm({ defaultPhone, products }: { defaultPhone: string; products: DesignProduct[] }) {
  const [form, setForm] = useState({ slug: products[0]?.slug ?? "", sizeCode: products[0]?.config.sizes[0].code ?? "", customW: "", customH: "", brief: "", deadline: "", budget: "", contactPhone: defaultPhone });
  const product = products.find((p) => p.slug === form.slug);
  const [files, setFiles] = useState<{ id: string; name: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  async function addFiles(list: FileList) {
    setUploading(true);
    setError(null);
    try {
      for (const f of Array.from(list)) {
        const id = await uploadFile(f, "DESIGN_REFERENCE");
        setFiles((prev) => [...prev, { id, name: f.name }]);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const result = await createDesignRequest({
        productSlug: form.slug,
        sizeCode: form.sizeCode,
        customWidthCm: form.customW ? Number(form.customW) : undefined,
        customHeightCm: form.customH ? Number(form.customH) : undefined,
        brief: form.brief,
        deadline: form.deadline || undefined,
        budget: form.budget ? Number(form.budget) : undefined,
        contactPhone: form.contactPhone,
        fileIds: files.map((f) => f.id),
      });
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form onSubmit={submit} className="card mt-6 space-y-5">
      <fieldset>
        <legend className="label">Loại ấn phẩm</legend>
        <div className="flex flex-wrap gap-2">
          {products.map((p) => {
            const on = p.slug === form.slug;
            return (
              <button key={p.slug} type="button" aria-pressed={on} onClick={() => setForm({ ...form, slug: p.slug, sizeCode: p.config.sizes[0].code })} className={`rounded-lg border px-4 py-2 text-sm ${on ? "border-brand-600 bg-brand-50 font-semibold text-brand-700" : "border-gray-300 bg-white"}`}>
                {p.name}
              </button>
            );
          })}
        </div>
      </fieldset>
      {product && (
        <fieldset>
          <legend className="label">Kích thước</legend>
          <div className="flex flex-wrap gap-2">
            {[...product.config.sizes, ...(product.config.allowCustomSize ? [{ code: CUSTOM_SIZE, label: "Kích thước khác" }] : [])].map((s) => {
              const on = s.code === form.sizeCode;
              return (
                <button key={s.code} type="button" aria-pressed={on} onClick={() => setForm({ ...form, sizeCode: s.code })} className={`rounded-lg border px-4 py-2 text-sm ${on ? "border-brand-600 bg-brand-50 font-semibold text-brand-700" : "border-gray-300 bg-white"}`}>
                  {s.label}
                </button>
              );
            })}
          </div>
          {form.sizeCode === CUSTOM_SIZE && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <input className="input w-28" type="number" min={10} aria-label="Chiều rộng (cm)" placeholder="Rộng" value={form.customW} onChange={(e) => setForm({ ...form, customW: e.target.value })} />
              <span>x</span>
              <input className="input w-28" type="number" min={10} aria-label="Chiều cao (cm)" placeholder="Cao" value={form.customH} onChange={(e) => setForm({ ...form, customH: e.target.value })} />
              <span className="text-sm text-gray-500">cm (rộng x cao), tối đa {product.config.maxCustomMm / 10} cm</span>
            </div>
          )}
          <p className="mt-2 text-sm text-gray-500">
            Bản thiết kế làm đúng khổ này{product.config.bleedMm ? `, có sẵn lề xén ${product.config.bleedMm} mm` : ""}, nên duyệt xong có thể chuyển in ngay.
          </p>
        </fieldset>
      )}
      <div>
        <label className="label" htmlFor="brief">Brief</label>
        <textarea
          id="brief"
          rows={7}
          className="input"
          placeholder={"Nội dung cần có (tên, slogan, sản phẩm, khuyến mãi, liên hệ...)\nPhong cách mong muốn, màu chủ đạo\nĐối tượng khách hàng, nơi đặt ấn phẩm"}
          value={form.brief}
          onChange={(e) => setForm({ ...form, brief: e.target.value })}
        />
      </div>
      <div>
        <span className="label">Logo, hình ảnh, mẫu tham khảo</span>
        <input type="file" multiple disabled={uploading} onChange={(e) => e.target.files && addFiles(e.target.files)} className="text-sm" />
        {uploading && <p className="mt-1 text-sm text-gray-500">Đang tải lên...</p>}
        {files.length > 0 && <ul className="mt-2 list-inside list-disc text-sm text-gray-600">{files.map((f) => <li key={f.id}>{f.name}</li>)}</ul>}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="deadline">Cần xong trước</label>
          <input id="deadline" type="date" className="input" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="budget">Ngân sách (đ, không bắt buộc)</label>
          <input id="budget" type="number" min={0} className="input" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="phone">Số điện thoại</label>
          <input id="phone" className="input" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn-primary" disabled={pending || uploading || !product}>{pending ? "Đang gửi..." : "Gửi yêu cầu thiết kế"}</button>
    </form>
  );
}
