import type { MetadataRoute } from "next";
import { PRODUCT_SEO } from "@/lib/seo/products";
import { absoluteUrl } from "@/lib/site";

// Đọc tên miền lúc chạy (biến môi trường), không đóng cứng lúc build
export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    ...PRODUCT_SEO.map((p) => ({ url: absoluteUrl(p.path), changeFrequency: "weekly" as const, priority: 0.9 })),
    { url: absoluteUrl("/dat-in"), changeFrequency: "monthly", priority: 0.6 },
  ];
}
