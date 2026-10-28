// Thông tin doanh nghiệp dùng cho SEO (tiêu đề, dữ liệu cấu trúc, chân trang).
// Điền qua biến môi trường khi có số liệu thật; phải khớp 100% với Google Business Profile.
const env = (key: string, fallback = "") => process.env[key]?.trim() || fallback;

export const SITE = {
  name: env("NEXT_PUBLIC_SITE_NAME", "In Ấn Thái Nguyên"),
  url: env("NEXT_PUBLIC_SITE_URL", "http://localhost:3000").replace(/\/$/, ""),
  phone: env("BUSINESS_PHONE"),
  email: env("BUSINESS_EMAIL"),
  street: env("BUSINESS_STREET"),
  ward: env("BUSINESS_WARD"),
  city: env("BUSINESS_CITY", "Thái Nguyên"),
  lat: Number(env("BUSINESS_LAT")) || null,
  lng: Number(env("BUSINESS_LNG")) || null,
  // VD: "Mo-Sa 07:30-18:00"
  hours: env("BUSINESS_HOURS"),
  facebook: env("BUSINESS_FACEBOOK_URL"),
  zalo: env("BUSINESS_ZALO_URL"),
  mapsUrl: env("BUSINESS_GOOGLE_MAPS_URL"),
  googleVerification: env("GOOGLE_SITE_VERIFICATION"),
};

// Địa danh khách hay gõ khi tìm (giữ cả tên cũ vì người dân vẫn dùng sau sáp nhập)
export const AREA_SERVED = ["TP Thái Nguyên", "Sông Công", "Phổ Yên", "Đại Từ", "Đồng Hỷ", "Phú Bình", "Phú Lương", "Định Hóa", "Võ Nhai"];

export const absoluteUrl = (path = "/") => `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;

export function addressText() {
  return [SITE.street, SITE.ward, SITE.city].filter(Boolean).join(", ");
}
