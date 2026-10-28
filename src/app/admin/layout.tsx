import Link from "next/link";
import { requireAdmin } from "@/lib/session";

const NAV = [
  { href: "/admin", label: "Tổng quan" },
  { href: "/admin/don-in", label: "Đơn in" },
  { href: "/admin/thiet-ke", label: "Đơn thiết kế" },
  { href: "/admin/san-pham", label: "Sản phẩm & giá" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="mx-auto flex max-w-7xl gap-8 px-4 py-8">
      <aside className="hidden w-48 shrink-0 md:block">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Quản trị</p>
        <nav className="flex flex-col gap-1 text-sm">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-lg px-3 py-2 hover:bg-white hover:shadow-sm">{n.label}</Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <nav className="mb-4 flex gap-3 overflow-x-auto text-sm md:hidden">
          {NAV.map((n) => <Link key={n.href} href={n.href} className="whitespace-nowrap text-brand-700">{n.label}</Link>)}
        </nav>
        {children}
      </div>
    </div>
  );
}
