import { redirect } from "next/navigation";
import { auth, enabledSocialProviders } from "@/auth";
import { LoginForm, SocialButtons } from "./AuthForms";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const { callbackUrl = "/" } = await searchParams;
  if ((await auth())?.user) redirect(callbackUrl.startsWith("/") ? callbackUrl : "/");
  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <div className="card">
        <h1 className="mb-1 text-2xl font-bold">Đăng nhập</h1>
        <p className="mb-6 text-sm text-gray-600">Đăng nhập để tải file và theo dõi đơn in.</p>
        <SocialButtons {...enabledSocialProviders} callbackUrl={callbackUrl} />
        <LoginForm callbackUrl={callbackUrl} />
      </div>
    </div>
  );
}
