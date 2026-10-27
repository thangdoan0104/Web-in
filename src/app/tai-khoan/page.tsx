import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { ProfileForm } from "./ProfileForm";

export default async function AccountPage() {
  const user = await requireUser("/tai-khoan");
  const profile = await db.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { name: true, email: true, phone: true, address: true, accounts: { select: { provider: true } } },
  });
  const providers = profile.accounts.map((a) => (a.provider === "google" ? "Google" : a.provider === "facebook" ? "Facebook" : a.provider));
  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-3xl font-bold">Tài khoản</h1>
      <p className="mt-2 text-sm text-gray-600">
        {profile.email}
        {providers.length > 0 && ` · đăng nhập bằng ${providers.join(", ")}`}
      </p>
      <p className="mt-1 text-sm text-gray-600">Số điện thoại và địa chỉ được điền sẵn khi bạn đặt in.</p>
      <div className="mt-6">
        <ProfileForm name={profile.name ?? ""} phone={profile.phone ?? ""} address={profile.address ?? ""} />
      </div>
    </div>
  );
}
