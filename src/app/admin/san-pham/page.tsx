import Link from "next/link";
import { db } from "@/lib/db";
import { parseConfig } from "@/lib/pricing";

export default async function AdminProducts() {
  const products = await db.product.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <div>
      <h1 className="text-2xl font-bold">Sản phẩm & bảng giá</h1>
      <p className="mt-1 text-sm text-gray-600">Giá hiện tại là giá ảo để chạy thử. Bấm vào sản phẩm để nhập giá thật.</p>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {products.map((p) => {
          const c = parseConfig(p.config);
          return (
            <Link key={p.id} href={`/admin/san-pham/${p.id}`} className="card hover:border-brand-500">
              <p className="font-semibold">{p.name} {!p.active && <span className="text-xs text-gray-500">(đang ẩn)</span>}</p>
              <p className="mt-1 text-sm text-gray-500">
                {c.sizes.length} kích thước · {c.materials.length} chất liệu · {c.finishings.length} gia công · {c.pricing === "per_m2" ? "tính theo m²" : "tính theo cái"}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
