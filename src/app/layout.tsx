import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import Link from "next/link";
import { Header } from "@/components/Header";
import { JsonLd } from "@/components/JsonLd";
import { localBusinessSchema } from "@/lib/seo/schema";
import { PRODUCT_SEO } from "@/lib/seo/products";
import { SITE, addressText } from "@/lib/site";
import "./globals.css";

const font = Be_Vietnam_Pro({
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-be-vietnam",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} – In standee, tờ rơi, biển quảng cáo tại Thái Nguyên`, template: `%s | ${SITE.name}` },
  description:
    "Xưởng in tại Thái Nguyên: in standee, tờ rơi, biển quảng cáo, bạt khổ lớn. Đặt in online, kiểm tra file tự động, xem mockup trước khi in. Nhận thiết kế theo yêu cầu.",
  alternates: { canonical: "/" },
  openGraph: { type: "website", locale: "vi_VN", siteName: SITE.name, images: [{ url: "/og.png", width: 1200, height: 630 }] },
  ...(SITE.googleVerification && { verification: { google: SITE.googleVerification } }),
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body className={`${font.variable} flex min-h-screen flex-col font-sans antialiased`}>
        <JsonLd data={localBusinessSchema()} />
        <Header />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-gray-200 bg-white py-8 text-sm text-gray-500">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 md:grid-cols-2">
            <div>
              <p className="font-semibold text-ink">{SITE.name}</p>
              <p>Xưởng in standee, tờ rơi, biển quảng cáo tại {SITE.city}.</p>
              <p>Địa chỉ: {addressText() || "(cập nhật sau)"}</p>
              <p>Hotline: {SITE.phone ? <a href={`tel:${SITE.phone.replace(/\s/g, "")}`} className="hover:underline">{SITE.phone}</a> : "(cập nhật sau)"}</p>
              {SITE.mapsUrl && <a href={SITE.mapsUrl} className="hover:underline">Xem đường đi trên Google Maps</a>}
            </div>
            <nav aria-label="Dịch vụ">
              <p className="font-semibold text-ink">Dịch vụ</p>
              <ul>
                {PRODUCT_SEO.map((p) => (
                  <li key={p.slug}><Link href={p.path} className="hover:underline">{p.h1}</Link></li>
                ))}
                <li><Link href="/thiet-ke" className="hover:underline">Thiết kế ấn phẩm theo yêu cầu</Link></li>
              </ul>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
