// Dữ liệu cấu trúc schema.org cho Google (doanh nghiệp địa phương, sản phẩm, câu hỏi thường gặp)
export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
