import { enabledSocialProviders } from "@/auth";
import { RegisterForm, SocialButtons } from "../dang-nhap/AuthForms";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const { callbackUrl = "/" } = await searchParams;
  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <div className="card">
        <h1 className="mb-6 text-2xl font-bold">Tạo tài khoản</h1>
        <SocialButtons {...enabledSocialProviders} callbackUrl={callbackUrl} />
        <RegisterForm callbackUrl={callbackUrl} />
      </div>
    </div>
  );
}
