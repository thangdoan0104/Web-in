"use client";

import { useState, useTransition } from "react";
import { uploadFile } from "@/components/upload";
import { DESIGN_PRODUCT_TYPES } from "@/lib/labels";
import { createDesignRequest } from "./actions";

export function DesignForm({ defaultPhone }: { defaultPhone: string }) {
  const [form, setForm] = useState({ productType: DESIGN_PRODUCT_TYPES[0], sizeLabel: "", brief: "", deadline: "", budget: "", contactPhone: defaultPhone });
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
        productType: form.productType,
        sizeLabel: form.sizeLabel,
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
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="type">Loại ấn phẩm</label>
          <select id="type" className="input" value={form.productType} onChange={(e) => setForm({ ...form, productType: e.target.value })}>
            {DESIGN_PRODUCT_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="size">Kích thước</label>
          <input id="size" className="input" placeholder="VD: 80 x 200 cm, A5" value={form.sizeLabel} onChange={(e) => setForm({ ...form, sizeLabel: e.target.value })} />
        </div>
      </div>
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
      <button className="btn-primary" disabled={pending || uploading}>{pending ? "Đang gửi..." : "Gửi yêu cầu thiết kế"}</button>
    </form>
  );
}
