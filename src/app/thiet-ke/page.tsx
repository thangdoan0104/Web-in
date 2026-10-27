import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { productConfigSchema } from "@/lib/pricing";
import { DesignForm } from "./DesignForm";

export default async function DesignPage() {
  const user = await requireUser("/thiet-ke");
  const profile = await db.user.findUnique({ where: { id: user.id }, select: { phone: true } });
  // Chỉ nhận thiết kế cho sản phẩm xưởng đang in, kích thước lấy từ bảng giá
  const products = (await db.product.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } })).flatMap((p) => {
    const config = productConfigSchema.safeParse(p.config);
    return config.success ? [{ slug: p.slug, name: p.name, config: config.data }] : [];
  });
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">Đặt thiết kế ấn phẩm</h1>
      <p className="mt-2 text-gray-600">Mô tả yêu cầu, đội thiết kế sẽ báo giá và gửi bản nháp để bạn duyệt. Duyệt xong có thể chuyển in luôn.</p>
      <DesignForm defaultPhone={profile?.phone ?? ""} products={products} />
    </div>
  );
}
