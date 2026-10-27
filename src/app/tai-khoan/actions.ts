"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export type ProfileState = { error?: string; ok?: boolean };

const profileSchema = z.object({
  name: z.string().trim().min(2, "Nhập họ tên"),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/\s/g, ""))
    .refine((v) => v === "" || /^0\d{9,10}$/.test(v), "Số điện thoại không hợp lệ"),
  address: z.string().trim().max(300),
});

export async function updateProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const session = await auth();
  if (!session?.user) return { error: "Phiên đăng nhập đã hết, hãy đăng nhập lại" };
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, phone, address } = parsed.data;
  await db.user.update({
    where: { id: session.user.id },
    data: { name, phone: phone || null, address: address || null },
  });
  revalidatePath("/tai-khoan");
  return { ok: true };
}
