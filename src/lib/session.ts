import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function requireUser(callbackUrl = "/") {
  const session = await auth();
  if (!session?.user) redirect(`/dang-nhap?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  return session.user;
}

export async function requireAdmin() {
  const user = await requireUser("/admin");
  if (user.role !== "ADMIN") redirect("/");
  return user;
}
