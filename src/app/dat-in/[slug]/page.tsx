import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { parseConfig } from "@/lib/pricing";
import { requireUser } from "@/lib/session";
import { OrderWizard } from "./OrderWizard";

export default async function OrderPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser(`/dat-in/${slug}`);
  const product = await db.product.findUnique({ where: { slug } });
  if (!product?.active) notFound();
  const profile = await db.user.findUnique({ where: { id: user.id }, select: { name: true, phone: true } });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold">Đặt in {product.name.toLowerCase()}</h1>
      <OrderWizard
        product={{ slug: product.slug, name: product.name, config: parseConfig(product.config) }}
        defaults={{ name: profile?.name ?? "", phone: profile?.phone ?? "" }}
      />
    </div>
  );
}
