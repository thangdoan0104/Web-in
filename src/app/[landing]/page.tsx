import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { db } from "@/lib/db";
import { formatVnd, parseConfig } from "@/lib/pricing";
import { PRODUCT_SEO, productSeoByPath, startingPrice } from "@/lib/seo/products";
import { breadcrumbSchema, faqSchema, serviceSchema } from "@/lib/seo/schema";
import { AREA_SERVED, SITE, addressText } from "@/lib/site";

// Trang đích SEO công khai cho từng sản phẩm, VD: /in-standee-thai-nguyen
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ landing: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const seo = productSeoByPath(`/${(await params).landing}`);
  if (!seo) return {};
  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: seo.path },
    openGraph: { title: seo.title, description: seo.description, url: seo.path, type: "website", images: [{ url: "/og.png", width: 1200, height: 630 }] },
  };
}

export default async function ProductLandingPage({ params }: Props) {
  const seo = productSeoByPath(`/${(await params).landing}`);
  if (!seo) notFound();
  const product = await db.product.findUnique({ where: { slug: seo.slug } });
  if (!product?.active) notFound();
  const config = parseConfig(product.config);
  const from = startingPrice(seo.slug, config);
  const perM2 = config.pricing === "per_m2";
  const others = PRODUCT_SEO.filter((p) => p.slug !== seo.slug);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <JsonLd data={serviceSchema({ name: seo.h1, description: seo.description, path: seo.path, lowPrice: from.price, unit: from.unit })} />
      <JsonLd data={faqSchema(seo.faqs)} />
      <JsonLd data={breadcrumbSchema([{ name: "Trang chủ", path: "/" }, { name: seo.h1, path: seo.path }])} />

      <nav aria-label="Đường dẫn" className="text-sm text-gray-500">
        <Link href="/" className="hover:underline">Trang chủ</Link> / <span>{seo.h1}</span>
      </nav>

      <header className="mt-4">
        <h1 className="text-3xl font-bold md:text-4xl">{seo.h1}</h1>
        {seo.intro.map((t) => (
          <p key={t} className="mt-3 max-w-3xl text-lg text-gray-700">{t}</p>
        ))}
        <p className="mt-4 text-lg">
          Giá từ <b className="text-brand-700">{formatVnd(from.price)}/{from.unit}</b>
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={`/dat-in/${seo.slug}`} className="btn-primary">Đặt in {product.name.toLowerCase()}</Link>
          <Link href="/thiet-ke" className="btn-outline">Chưa có file? Đặt thiết kế</Link>
          {SITE.phone && <a href={`tel:${SITE.phone.replace(/\s/g, "")}`} className="btn-outline">Gọi {SITE.phone}</a>}
        </div>
      </header>

      <section className="mt-12">
        <h2 className="text-2xl font-bold">Bảng giá {product.name.toLowerCase()}</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr><th className="px-4 py-3">Kích thước</th><th className="px-4 py-3">{perM2 ? "Giá tham khảo (bạt cơ bản)" : `Giá / ${from.unit}`}</th></tr>
            </thead>
            <tbody>
              {config.sizes.map((s) => (
                <tr key={s.code} className="border-t border-gray-100">
                  <td className="px-4 py-3">{s.label}</td>
                  <td className="px-4 py-3 font-semibold">{formatVnd(perM2 ? Math.round(((s.widthMm * s.heightMm) / 1e6) * config.pricePerM2) : s.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          {perM2 ? `Giá ${formatVnd(config.pricePerM2)}/m², nhận kích thước tùy chỉnh. ` : ""}
          {config.minQuantity > 1 ? `Đặt tối thiểu ${config.minQuantity} ${from.unit}. ` : ""}
          {config.quantityTiers.length ? `Giảm giá theo số lượng: ${config.quantityTiers.map((t) => `từ ${t.min} giảm ${t.discountPercent}%`).join(", ")}.` : ""}
        </p>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="font-semibold">Chất liệu</h3>
            <ul className="mt-2 space-y-1 text-sm text-gray-700">
              {config.materials.map((m) => <li key={m.code}>{m.label}{m.price ? ` (+${formatVnd(m.price)}${perM2 ? "/m²" : ""})` : ""}</li>)}
            </ul>
          </div>
          {config.finishings.length > 0 && (
            <div>
              <h3 className="font-semibold">Gia công thêm</h3>
              <ul className="mt-2 space-y-1 text-sm text-gray-700">
                {config.finishings.map((f) => <li key={f.code}>{f.label} (+{formatVnd(f.price)}{perM2 ? "/m²" : ""})</li>)}
              </ul>
            </div>
          )}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold">Thường dùng cho</h2>
        <ul className="mt-4 grid gap-2 text-gray-700 sm:grid-cols-2">
          {seo.uses.map((u) => <li key={u} className="rounded-lg bg-white px-4 py-3 ring-1 ring-gray-200">{u}</li>)}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold">Yêu cầu file in</h2>
        <ul className="mt-4 list-inside list-disc space-y-1 text-gray-700">
          <li>Định dạng PDF, JPG, PNG hoặc TIFF.</li>
          <li>Độ phân giải khuyến nghị {config.dpi.recommended} dpi theo kích thước thật, tối thiểu {config.dpi.minimum} dpi.</li>
          {config.bleedMm > 0 && <li>Lề xén {config.bleedMm} mm mỗi cạnh, nền kéo tràn ra ngoài khổ.</li>}
          <li>Nhúng font hoặc chuyển chữ thành outline để không lỗi dấu tiếng Việt.</li>
        </ul>
        <p className="mt-3 text-gray-700">Khi bạn tải file lên, hệ thống tự kiểm tra các mục trên và dựng mockup để bạn xem trước sản phẩm thật.</p>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold">Câu hỏi thường gặp</h2>
        <div className="mt-4 space-y-3">
          {seo.faqs.map((f) => (
            <details key={f.q} className="rounded-lg bg-white px-4 py-3 ring-1 ring-gray-200">
              <summary className="cursor-pointer font-semibold">{f.q}</summary>
              <p className="mt-2 text-gray-700">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-xl bg-white p-6 ring-1 ring-gray-200">
        <h2 className="text-xl font-bold">Nhận in tại Thái Nguyên và lân cận</h2>
        <p className="mt-2 text-gray-700">
          {SITE.name} nhận đơn {product.name.toLowerCase()} khắp {AREA_SERVED.join(", ")}. Nhận tại xưởng hoặc giao tận nơi.
        </p>
        {addressText() && <p className="mt-2 text-gray-700">Xưởng: {addressText()}{SITE.phone ? ` · Hotline: ${SITE.phone}` : ""}</p>}
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold">Sản phẩm khác</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          {others.map((o) => <Link key={o.slug} href={o.path} className="btn-outline">{o.h1}</Link>)}
        </div>
      </section>
    </div>
  );
}
