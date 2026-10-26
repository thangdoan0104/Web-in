import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { parseConfig } from "@/lib/pricing";
import { ProductEditor } from "./ProductEditor";

export default async function AdminProductEdit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await db.product.findUnique({ where: { id } });
  if (!product) notFound();
  return (
    <div>
      <h1 className="text-2xl font-bold">{product.name}</h1>
      <ProductEditor id={product.id} name={product.name} description={product.description} active={product.active} config={parseConfig(product.config)} />
    </div>
  );
}
