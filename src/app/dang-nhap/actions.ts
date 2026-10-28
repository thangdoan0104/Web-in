"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn } from "@/auth";
import { db } from "@/lib/db";

export type FormState = { error?: string } | undefined;

function safeCallback(url: FormDataEntryValue | null): string {
  const value = typeof url === "string" ? url : "/";
  return value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await signIn("credentials", {
      email: String(formData.get("email") ?? "").trim().toLowerCase(),
      password: String(formData.get("password") ?? ""),
      redirectTo: safeCallback(formData.get("callbackUrl")),
    });
  } catch (err) {
    if (err instanceof AuthError) return { error: "Email hoặc mật khẩu không đúng" };
    throw err;
  }
}

const registerSchema = z.object({
  name: z.string().trim().min(2, "Nhập họ tên"),
  email: z.string().trim().toLowerCase().email("Email không hợp lệ"),
  phone: z.string().trim().regex(/^0\d{9,10}$/, "Số điện thoại không hợp lệ"),
  password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự"),
});

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, email, phone, password } = parsed.data;
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { error: "Email này đã có tài khoản, hãy đăng nhập" };
  await db.user.create({ data: { name, email, phone, passwordHash: await bcrypt.hash(password, 10) } });
  await signIn("credentials", { email, password, redirectTo: safeCallback(formData.get("callbackUrl")) });
}

export async function socialLoginAction(provider: "google" | "facebook", callbackUrl: string) {
  await signIn(provider, { redirectTo: safeCallback(callbackUrl) });
}
