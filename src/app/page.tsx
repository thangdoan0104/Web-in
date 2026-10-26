import Link from "next/link";
import { db } from "@/lib/db";
import { formatVnd, parseConfig } from "@/lib/pricing";

export const dynamic = "force-dynamic";

const STEPS = [
  { title: "Chọn sản phẩm", text: "Chọn loại ấn phẩm, kích thước, chất liệu và số lượng. Giá hiện ngay." },
  { title: "Tải file", text: "Hệ thống tự kiểm tra độ phân giải, kích thước, hệ màu và font chữ." },
  { title: "Xem mockup", text: "Xem trước sản phẩm thực tế, kiểm tra phần bị xén ở chế độ 2D." },
  { title: "Đặt in & theo dõi", text: "Thanh toán bằng mã QR, theo dõi tiến độ in từng bước." },
];

export default async function HomePage() {
  const products = await db.product.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });

  return (
    <div>
      <section className="bg-gradient-to-br from-brand-700 to-brand-500 text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-100">In ấn online tại Thái Nguyên</p>
            <h1 className="text-4xl font-bold leading-tight md:text-5xl">Tải file, xem mockup, đặt in trong 5 phút</h1>
            <p className="mt-4 text-lg text-brand-50">
              Standee, tờ rơi, biển quảng cáo. File được kiểm tra tự động trước khi in, bạn thấy trước sản phẩm thực tế.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/dat-in" className="btn bg-white text-brand-700 hover:bg-brand-50">Đặt in ngay</Link>
              <Link href="/thiet-ke" className="btn border border-white/60 text-white hover:bg-white/10">Đặt thiết kế</Link>
            </div>
          </div>
          <div className="hidden items-end justify-center gap-6 md:flex" aria-hidden>
            <div className="h-72 w-28 rounded-sm bg-white/90 shadow-2xl" />
            <div className="h-44 w-32 -rotate-6 rounded-sm bg-white/80 shadow-2xl" />
            <div className="h-36 w-56 rounded-sm bg-white/70 shadow-2xl" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-2xl font-bold">Sản phẩm</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {products.map((p) => {
            const config = parseConfig(p.config);
            const from =
              config.pricing === "per_m2"
                ? `từ ${formatVnd(config.pricePerM2)}/m²`
                : `từ ${formatVnd(Math.min(...config.sizes.map((s) => s.price)))}/${p.slug === "to-roi" ? "tờ" : "cái"}`;
            return (
              <Link key={p.id} href={`/dat-in/${p.slug}`} className="card group transition hover:border-brand-500">
                <h3 className="text-lg font-semibold group-hover:text-brand-700">{p.name}</h3>
                <p className="mt-2 text-sm text-gray-600">{p.description}</p>
                <p className="mt-4 text-sm font-semibold text-brand-700">{from}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="border-y border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-2xl font-bold">Quy trình</h2>
          <ol className="mt-6 grid gap-5 md:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 font-bold text-brand-700">{i + 1}</span>
                <h3 className="mt-3 font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-gray-600">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="card flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold">Chưa có file thiết kế?</h2>
            <p className="mt-1 text-gray-600">Gửi brief, đội thiết kế sẽ làm mẫu cho bạn duyệt rồi chuyển in luôn.</p>
          </div>
          <Link href="/thiet-ke" className="btn-primary">Đặt thiết kế</Link>
        </div>
      </section>
    </div>
  );
}
