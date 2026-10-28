import type { ProductConfig } from "@/lib/pricing";

// Nội dung trang đích SEO cho từng sản phẩm (slug trùng Product.slug trong DB).
// Trang đích công khai để Google đọc được; trang đặt in /dat-in/[slug] cần đăng nhập nên không index.
export interface ProductSeo {
  slug: string;
  path: string;
  title: string;
  description: string;
  h1: string;
  intro: string[];
  uses: string[];
  faqs: { q: string; a: string }[];
}

export const PRODUCT_SEO: ProductSeo[] = [
  {
    slug: "standee",
    path: "/in-standee-thai-nguyen",
    title: "In standee cuốn tại Thái Nguyên, xem mockup trước khi in",
    description:
      "In standee cuốn nhôm tại Thái Nguyên: 60x160, 80x200, 120x200 cm, có túi đựng chống nước. Tải file, xem mockup thực tế và báo giá ngay trên web.",
    h1: "In standee cuốn tại Thái Nguyên",
    intro: [
      "Standee cuốn (roll-up) là cách quảng cáo gọn nhất cho khai trương, sự kiện, quầy bán hàng và hội thảo. Chân nhôm cuốn, dựng lên trong một phút, xếp lại vừa túi đựng.",
      "Bạn tải file thiết kế lên, hệ thống kiểm tra độ phân giải và tỷ lệ, dựng mockup để bạn thấy trước standee thật rồi mới đặt in.",
    ],
    uses: ["Khai trương cửa hàng, quán cà phê", "Sự kiện, hội nghị, hội thảo", "Quầy tư vấn, bán hàng trong siêu thị", "Lễ cưới, sinh nhật, tiệc công ty"],
    faqs: [
      { q: "In standee ở Thái Nguyên mất bao lâu?", a: "Thời gian in và ngày nhận hàng được xưởng báo khi xác nhận đơn, và bạn theo dõi tiến độ từng bước ngay trên web." },
      { q: "File in standee cần độ phân giải bao nhiêu?", a: "Khuyến nghị 150 dpi theo kích thước thật, tối thiểu 72 dpi. Với khổ 80x200 cm, ảnh nên có khoảng 4.700 x 11.800 px. Hệ thống tự đo và báo khi bạn tải file lên." },
      { q: "Chưa có file thiết kế thì sao?", a: "Bạn gửi yêu cầu thiết kế trên web, đội thiết kế làm mẫu đúng khổ standee, duyệt xong chuyển in luôn." },
      { q: "Có giao standee tận nơi không?", a: "Có. Bạn chọn nhận tại xưởng hoặc giao tận nơi khi đặt in." },
    ],
  },
  {
    slug: "to-roi",
    path: "/in-to-roi-thai-nguyen",
    title: "In tờ rơi giá rẻ tại Thái Nguyên, A4 A5 A6",
    description:
      "In tờ rơi, flyer giấy couche tại Thái Nguyên khổ A4, A5, A6, 1 hoặc 2 mặt, cán màng. Báo giá ngay, kiểm tra file và lề xén tự động.",
    h1: "In tờ rơi tại Thái Nguyên",
    intro: [
      "Tờ rơi là kênh quảng cáo rẻ và hiệu quả cho cửa hàng, trung tâm đào tạo, phòng khám, nhà hàng. In giấy couche, một hoặc hai mặt, có cán màng nếu cần.",
      "Giá tính theo số lượng, càng in nhiều càng rẻ. Hệ thống kiểm tra lề xén, font chữ và độ phân giải trước khi in để tờ rơi không bị trắng mép hay vỡ chữ.",
    ],
    uses: ["Khai trương, khuyến mãi cửa hàng", "Tuyển sinh trung tâm, trường học", "Thực đơn, giao đồ ăn", "Giới thiệu dịch vụ phòng khám, spa"],
    faqs: [
      { q: "In tờ rơi tối thiểu bao nhiêu tờ?", a: "Tối thiểu 100 tờ mỗi mẫu. Từ số lượng lớn hơn sẽ được giảm giá theo bậc, giá hiện ngay khi bạn chọn." },
      { q: "File tờ rơi cần lề xén bao nhiêu?", a: "Cần 2 mm mỗi cạnh, nền kéo tràn ra ngoài khổ. Hệ thống tự kiểm tra và hiển thị đường xén ở chế độ xem 2D." },
      { q: "Nên in tờ rơi khổ nào?", a: "A5 phổ biến nhất cho phát tay. A4 hợp với nội dung nhiều chữ hoặc gấp đôi. A6 rẻ nhất, hợp kẹp hóa đơn, giao đồ ăn." },
      { q: "Có nhận file Word, Canva không?", a: "Nên xuất PDF hoặc ảnh JPG/PNG chất lượng cao. File Canva xuất PDF in ấn (có lề xén) là tốt nhất." },
    ],
  },
  {
    slug: "bien-quang-cao",
    path: "/in-bien-quang-cao-thai-nguyen",
    title: "In biển quảng cáo, băng rôn bạt tại Thái Nguyên",
    description:
      "In bạt, biển quảng cáo khổ lớn tại Thái Nguyên, tính giá theo m², nhận kích thước tùy chỉnh, có khung sắt. Xem mockup biển treo thực tế trước khi in.",
    h1: "In biển quảng cáo, bạt khổ lớn tại Thái Nguyên",
    intro: [
      "In bạt hiflex, biển quảng cáo mặt tiền, băng rôn sự kiện với kích thước tùy chỉnh. Giá tính theo m², có tùy chọn đóng khung sắt.",
      "Biển khổ lớn được nhìn từ xa nên không cần độ phân giải quá cao. Hệ thống tính độ phân giải thật theo kích thước bạn chọn và báo nếu ảnh quá nhỏ.",
    ],
    uses: ["Biển hiệu mặt tiền cửa hàng", "Băng rôn khai trương, sự kiện", "Bạt che, phông sân khấu", "Biển công trình, bất động sản"],
    faqs: [
      { q: "Giá in bạt tính thế nào?", a: "Tính theo m² theo kích thước bạn chọn, cộng thêm chất liệu và gia công (khung sắt, đục khoen). Giá hiện ngay khi nhập kích thước." },
      { q: "File in bạt khổ lớn cần bao nhiêu dpi?", a: "Khuyến nghị 100 dpi, tối thiểu 40 dpi theo kích thước thật. Biển 2 x 1 m cần ảnh khoảng 7.900 x 3.900 px để đạt 100 dpi." },
      { q: "Có in kích thước tùy chỉnh không?", a: "Có. Bạn nhập chiều rộng, chiều cao bất kỳ trong giới hạn máy in, hệ thống tính giá theo diện tích." },
      { q: "Có lắp đặt biển tại Thái Nguyên không?", a: "Liên hệ xưởng khi đặt đơn để được báo giá lắp đặt theo vị trí." },
    ],
  },
];

export const productSeo = (slug: string) => PRODUCT_SEO.find((p) => p.slug === slug);
export const productSeoByPath = (path: string) => PRODUCT_SEO.find((p) => p.path === path);

// Giá khởi điểm để hiện trên trang đích và dữ liệu cấu trúc
export function startingPrice(slug: string, config: ProductConfig) {
  if (config.pricing === "per_m2") return { price: config.pricePerM2, unit: "m²" };
  return { price: Math.min(...config.sizes.map((s) => s.price)), unit: slug === "to-roi" ? "tờ" : "cái" };
}
