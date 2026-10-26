import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { ProductConfig } from "../src/lib/pricing";

// GIÁ ẢO để chạy thử. Admin sửa lại ở trang /admin/san-pham khi có bảng giá thật.
const db = new PrismaClient();

const products: { slug: string; name: string; description: string; sortOrder: number; config: ProductConfig }[] = [
  {
    slug: "standee",
    name: "Standee cuốn",
    description: "Standee cuốn nhôm, kèm túi đựng. Phù hợp sự kiện, khai trương, quầy bán hàng.",
    sortOrder: 1,
    config: {
      pricing: "per_unit",
      pricePerM2: 0,
      allowCustomSize: false,
      maxCustomMm: 3000,
      sizes: [
        { code: "60x160", label: "60 x 160 cm", widthMm: 600, heightMm: 1600, price: 350000 },
        { code: "80x200", label: "80 x 200 cm", widthMm: 800, heightMm: 2000, price: 450000 },
        { code: "120x200", label: "120 x 200 cm", widthMm: 1200, heightMm: 2000, price: 650000 },
      ],
      materials: [
        { code: "pp", label: "PP trong nhà", price: 0 },
        { code: "pp-matte", label: "PP cán màng mờ", price: 40000 },
        { code: "hiflex", label: "Bạt Hiflex ngoài trời", price: 20000 },
      ],
      finishings: [{ code: "bag", label: "Túi đựng chống nước", price: 30000 }],
      minQuantity: 1,
      quantityTiers: [
        { min: 5, discountPercent: 5 },
        { min: 10, discountPercent: 10 },
      ],
      bleedMm: 0,
      dpi: { recommended: 150, minimum: 72 },
      mockup: "standee",
    },
  },
  {
    slug: "to-roi",
    name: "Tờ rơi",
    description: "In tờ rơi giấy Couche, 1 hoặc 2 mặt, cán màng tùy chọn.",
    sortOrder: 2,
    config: {
      pricing: "per_unit",
      pricePerM2: 0,
      allowCustomSize: false,
      maxCustomMm: 3000,
      sizes: [
        { code: "a6", label: "A6 (10,5 x 14,8 cm)", widthMm: 105, heightMm: 148, price: 900 },
        { code: "a5", label: "A5 (14,8 x 21 cm)", widthMm: 148, heightMm: 210, price: 1500 },
        { code: "a4", label: "A4 (21 x 29,7 cm)", widthMm: 210, heightMm: 297, price: 2500 },
      ],
      materials: [
        { code: "c150", label: "Couche 150gsm", price: 0 },
        { code: "c200", label: "Couche 200gsm", price: 300 },
        { code: "c250", label: "Couche 250gsm", price: 600 },
      ],
      finishings: [
        { code: "duplex", label: "In 2 mặt", price: 800 },
        { code: "gloss", label: "Cán màng bóng", price: 400 },
      ],
      minQuantity: 100,
      quantityTiers: [
        { min: 500, discountPercent: 10 },
        { min: 1000, discountPercent: 20 },
      ],
      bleedMm: 2,
      dpi: { recommended: 300, minimum: 150 },
      mockup: "flyer",
    },
  },
  {
    slug: "bien-quang-cao",
    name: "Biển quảng cáo (bạt)",
    description: "Biển bạt in khổ lớn, tính giá theo m², có thể đóng khung sắt.",
    sortOrder: 3,
    config: {
      pricing: "per_m2",
      pricePerM2: 90000,
      allowCustomSize: true,
      maxCustomMm: 10000,
      sizes: [
        { code: "200x100", label: "200 x 100 cm", widthMm: 2000, heightMm: 1000, price: 0 },
        { code: "300x150", label: "300 x 150 cm", widthMm: 3000, heightMm: 1500, price: 0 },
        { code: "400x200", label: "400 x 200 cm", widthMm: 4000, heightMm: 2000, price: 0 },
      ],
      materials: [
        { code: "hiflex", label: "Bạt Hiflex", price: 0 },
        { code: "3m", label: "Bạt 3M xuyên sáng", price: 60000 },
      ],
      finishings: [
        { code: "frame", label: "Đóng khung sắt", price: 150000 },
        { code: "eyelet", label: "Đục khoen viền", price: 5000 },
      ],
      minQuantity: 1,
      quantityTiers: [],
      bleedMm: 0,
      dpi: { recommended: 100, minimum: 40 },
      mockup: "banner",
    },
  },
];

async function main() {
  for (const p of products) {
    await db.product.upsert({ where: { slug: p.slug }, update: {}, create: p });
  }
  const email = (process.env.ADMIN_EMAIL ?? "admin@inanthainguyen.vn").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "admin123456";
  await db.user.upsert({
    where: { email },
    update: { role: "ADMIN" },
    create: { email, name: "Quản trị", role: "ADMIN", passwordHash: await bcrypt.hash(password, 10) },
  });
  console.log(`Đã tạo ${products.length} sản phẩm và tài khoản admin ${email}`);
}

main().finally(() => db.$disconnect());
