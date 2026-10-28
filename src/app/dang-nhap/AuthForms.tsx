"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, registerAction, socialLoginAction } from "./actions";

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, action, pending] = useActionState(loginAction, undefined);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required className="input" autoComplete="email" />
      </div>
      <div>
        <label className="label" htmlFor="password">Mật khẩu</label>
        <input id="password" name="password" type="password" required className="input" autoComplete="current-password" />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button className="btn-primary w-full" disabled={pending}>{pending ? "Đang đăng nhập..." : "Đăng nhập"}</button>
      <p className="text-center text-sm text-gray-600">
        Chưa có tài khoản?{" "}
        <Link href={`/dang-ky?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="font-semibold text-brand-700">Đăng ký</Link>
      </p>
    </form>
  );
}

export function RegisterForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, action, pending] = useActionState(registerAction, undefined);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <div>
        <label className="label" htmlFor="name">Họ tên</label>
        <input id="name" name="name" required className="input" autoComplete="name" />
      </div>
      <div>
        <label className="label" htmlFor="phone">Số điện thoại</label>
        <input id="phone" name="phone" required className="input" autoComplete="tel" inputMode="tel" />
      </div>
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required className="input" autoComplete="email" />
      </div>
      <div>
        <label className="label" htmlFor="password">Mật khẩu</label>
        <input id="password" name="password" type="password" required minLength={8} className="input" autoComplete="new-password" />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button className="btn-primary w-full" disabled={pending}>{pending ? "Đang tạo tài khoản..." : "Tạo tài khoản"}</button>
      <p className="text-center text-sm text-gray-600">
        Đã có tài khoản?{" "}
        <Link href={`/dang-nhap?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="font-semibold text-brand-700">Đăng nhập</Link>
      </p>
    </form>
  );
}

export function SocialButtons({ google, facebook, callbackUrl }: { google: boolean; facebook: boolean; callbackUrl: string }) {
  if (!google && !facebook) return null;
  return (
    <div className="space-y-2">
      {google && (
        <button type="button" onClick={() => socialLoginAction("google", callbackUrl)} className="btn-outline w-full">
          <span className="font-bold text-[#4285F4]">G</span> Tiếp tục với Google
        </button>
      )}
      {facebook && (
        <button type="button" onClick={() => socialLoginAction("facebook", callbackUrl)} className="btn-outline w-full">
          <span className="font-bold text-[#1877F2]">f</span> Tiếp tục với Facebook
        </button>
      )}
      <div className="flex items-center gap-3 py-2 text-xs text-gray-400">
        <span className="h-px flex-1 bg-gray-200" />hoặc<span className="h-px flex-1 bg-gray-200" />
      </div>
    </div>
  );
}
