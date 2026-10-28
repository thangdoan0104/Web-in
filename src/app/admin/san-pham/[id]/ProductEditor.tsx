"use client";

import { useState, useTransition } from "react";
import type { ProductConfig } from "@/lib/pricing";
import { saveProduct } from "../../actions";

type Row = Record<string, string | number>;

// Bảng sửa nhanh: mỗi dòng là một tùy chọn, mỗi cột là một trường
function EditableTable({ title, columns, rows, onChange, newRow }: {
  title: string;
  columns: { key: string; label: string; type: "text" | "number" }[];
  rows: Row[];
  onChange: (rows: Row[]) => void;
  newRow: () => Row;
}) {
  return (
    <div className="card">
      <h2 className="mb-3 font-semibold">{title}</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500">{columns.map((c) => <th key={c.key} className="pb-2 pr-2 font-medium">{c.label}</th>)}<th /></tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {columns.map((c) => (
                  <td key={c.key} className="pb-2 pr-2">
                    <input
                      type={c.type}
                      className="input min-w-24"
                      value={row[c.key] ?? ""}
                      onChange={(e) => {
                        const next = [...rows];
                        next[i] = { ...row, [c.key]: c.type === "number" ? Number(e.target.value) : e.target.value };
                        onChange(next);
                      }}
                    />
                  </td>
                ))}
                <td className="pb-2"><button type="button" className="text-red-600" onClick={() => onChange(rows.filter((_, j) => j !== i))} aria-label="Xóa dòng">✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" className="mt-1 text-sm font-semibold text-brand-700" onClick={() => onChange([...rows, newRow()])}>+ Thêm dòng</button>
    </div>
  );
}

export function ProductEditor({ id, name: initialName, description: initialDescription, active: initialActive, config: initial }: {
  id: string;
  name: string;
  description: string;
  active: boolean;
  config: ProductConfig;
}) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [active, setActive] = useState(initialActive);
  const [config, setConfig] = useState<ProductConfig>(initial);
  const [message, setMessage] = useState<{ error?: string; ok?: boolean }>({});
  const [pending, start] = useTransition();
  const perM2 = config.pricing === "per_m2";
  const set = <K extends keyof ProductConfig>(key: K, value: ProductConfig[K]) => setConfig({ ...config, [key]: value });
  const code = () => Math.random().toString(36).slice(2, 7);

  return (
    <div className="mt-6 space-y-5">
      <div className="card grid gap-4 md:grid-cols-2">
        <div><label className="label">Tên sản phẩm</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
        <label className="flex items-center gap-2 self-end text-sm"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Đang bán (hiện cho khách)</label>
        <div className="md:col-span-2"><label className="label">Mô tả</label><textarea rows={2} className="input" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
      </div>

      <div className="card grid gap-4 md:grid-cols-3">
        <div>
          <label className="label">Cách tính giá</label>
          <select className="input" value={config.pricing} onChange={(e) => set("pricing", e.target.value as ProductConfig["pricing"])}>
            <option value="per_unit">Theo cái / tờ</option>
            <option value="per_m2">Theo m²</option>
          </select>
        </div>
        {perM2 && <div><label className="label">Giá cơ bản (đ/m²)</label><input type="number" className="input" value={config.pricePerM2} onChange={(e) => set("pricePerM2", Number(e.target.value))} /></div>}
        <div><label className="label">Số lượng tối thiểu</label><input type="number" className="input" value={config.minQuantity} onChange={(e) => set("minQuantity", Number(e.target.value))} /></div>
        <div><label className="label">Lề xén / bleed (mm)</label><input type="number" className="input" value={config.bleedMm} onChange={(e) => set("bleedMm", Number(e.target.value))} /></div>
        <div><label className="label">DPI khuyến nghị</label><input type="number" className="input" value={config.dpi.recommended} onChange={(e) => set("dpi", { ...config.dpi, recommended: Number(e.target.value) })} /></div>
        <div><label className="label">DPI tối thiểu</label><input type="number" className="input" value={config.dpi.minimum} onChange={(e) => set("dpi", { ...config.dpi, minimum: Number(e.target.value) })} /></div>
        <div>
          <label className="label">Kiểu mockup</label>
          <select className="input" value={config.mockup} onChange={(e) => set("mockup", e.target.value as ProductConfig["mockup"])}>
            <option value="standee">Standee</option><option value="flyer">Tờ rơi</option><option value="banner">Biển treo tường</option>
          </select>
        </div>
        <label className="flex items-center gap-2 self-end text-sm"><input type="checkbox" checked={config.allowCustomSize} onChange={(e) => set("allowCustomSize", e.target.checked)} /> Cho khách nhập kích thước tùy chỉnh</label>
      </div>

      <EditableTable
        title={perM2 ? "Kích thước mẫu (giá tính theo m², cột giá bỏ qua)" : "Kích thước & đơn giá"}
        columns={[
          { key: "label", label: "Tên hiển thị", type: "text" },
          { key: "widthMm", label: "Rộng (mm)", type: "number" },
          { key: "heightMm", label: "Cao (mm)", type: "number" },
          ...(perM2 ? [] : [{ key: "price", label: "Giá (đ/cái)", type: "number" as const }]),
        ]}
        rows={config.sizes}
        onChange={(rows) => set("sizes", rows as ProductConfig["sizes"])}
        newRow={() => ({ code: code(), label: "", widthMm: 0, heightMm: 0, price: 0 })}
      />
      <EditableTable
        title={`Chất liệu (giá cộng thêm, đ/${perM2 ? "m²" : "cái"})`}
        columns={[{ key: "label", label: "Tên", type: "text" }, { key: "price", label: "Cộng thêm", type: "number" }]}
        rows={config.materials}
        onChange={(rows) => set("materials", rows as ProductConfig["materials"])}
        newRow={() => ({ code: code(), label: "", price: 0 })}
      />
      <EditableTable
        title={`Gia công (giá cộng thêm, đ/${perM2 ? "m²" : "cái"})`}
        columns={[{ key: "label", label: "Tên", type: "text" }, { key: "price", label: "Cộng thêm", type: "number" }]}
        rows={config.finishings}
        onChange={(rows) => set("finishings", rows as ProductConfig["finishings"])}
        newRow={() => ({ code: code(), label: "", price: 0 })}
      />
      <EditableTable
        title="Giảm giá theo số lượng"
        columns={[{ key: "min", label: "Từ số lượng", type: "number" }, { key: "discountPercent", label: "Giảm (%)", type: "number" }]}
        rows={config.quantityTiers}
        onChange={(rows) => set("quantityTiers", rows as ProductConfig["quantityTiers"])}
        newRow={() => ({ min: 0, discountPercent: 0 })}
      />

      <div className="flex items-center gap-4">
        <button
          className="btn-primary"
          disabled={pending}
          onClick={() => start(async () => setMessage(await saveProduct(id, { name, description, active, config })))}
        >
          {pending ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
        {message.error && <p className="text-sm text-red-600">{message.error}</p>}
        {message.ok && <p className="text-sm text-emerald-700">Đã lưu. Giá mới áp dụng cho đơn đặt từ bây giờ.</p>}
      </div>
    </div>
  );
}
