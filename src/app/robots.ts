import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

// Đọc tên miền lúc chạy (biến môi trường), không đóng cứng lúc build
export const dynamic = "force-dynamic";

// Chỉ cho Google đọc các trang công khai; trang tài khoản, đơn hàng, quản trị là riêng tư
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/don-hang", "/tai-khoan", "/dang-nhap", "/dang-ky", "/dat-in/", "/thiet-ke/"] },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
