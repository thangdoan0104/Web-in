import Link from "next/link";
import { auth, signOut } from "@/auth";

export async function Header() {
  const session = await auth();
  const user = session?.user;
  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-ink">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">IN</span>
          <span className="hidden sm:inline">In Ấn Thái Nguyên</span>
        </Link>
        <nav className="flex flex-1 items-center gap-4 text-sm font-medium text-gray-600">
          <Link href="/dat-in" className="hover:text-ink">Đặt in</Link>
          <Link href="/thiet-ke" className="hover:text-ink">Đặt thiết kế</Link>
          {user && <Link href="/don-hang" className="hover:text-ink">Đơn của tôi</Link>}
          {user?.role === "ADMIN" && (
            <Link href="/admin" className="text-brand-700 hover:text-brand-600">Quản trị</Link>
          )}
        </nav>
        {user ? (
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
            className="flex items-center gap-3 text-sm"
          >
            <span className="hidden max-w-40 truncate text-gray-600 md:inline">{user.name ?? user.email}</span>
            <button className="btn-outline py-1.5">Đăng xuất</button>
          </form>
        ) : (
          <Link href="/dang-nhap" className="btn-primary py-1.5">Đăng nhập</Link>
        )}
      </div>
    </header>
  );
}
