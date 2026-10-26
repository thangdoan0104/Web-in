import Link from "next/link";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ChooseProductPage() {
  const products = await db.product.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold">Bạn muốn in gì?</h1>
      <div className="mt-6 grid gap-5 md:grid-cols-3">
        {products.map((p) => (
          <Link key={p.id} href={`/dat-in/${p.slug}`} className="card transition hover:border-brand-500">
            <h2 className="text-lg font-semibold">{p.name}</h2>
            <p className="mt-2 text-sm text-gray-600">{p.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
