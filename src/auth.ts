import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import NextAuth, { type DefaultSession } from "next-auth";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import Facebook from "next-auth/providers/facebook";
import Google from "next-auth/providers/google";
import { z } from "zod";
import { db } from "@/lib/db";

declare module "next-auth" {
  interface Session {
    user: { id: string; role: "CUSTOMER" | "ADMIN" } & DefaultSession["user"];
  }
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const providers: Provider[] = [
  Credentials({
    credentials: { email: {}, password: {} },
    async authorize(raw) {
      const parsed = credentialsSchema.safeParse(raw);
      if (!parsed.success) return null;
      const user = await db.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
      if (!user?.passwordHash) return null;
      const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
      return ok ? user : null;
    },
  }),
];

// Chỉ bật đăng nhập nhanh khi đã cấu hình khóa trong .env
if (process.env.AUTH_GOOGLE_ID) providers.push(Google({ allowDangerousEmailAccountLinking: true }));
if (process.env.AUTH_FACEBOOK_ID) providers.push(Facebook({ allowDangerousEmailAccountLinking: true }));

export const enabledSocialProviders = {
  google: Boolean(process.env.AUTH_GOOGLE_ID),
  facebook: Boolean(process.env.AUTH_FACEBOOK_ID),
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  pages: { signIn: "/dang-nhap" },
  providers,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role ?? "CUSTOMER";
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.sub!;
      session.user.role = token.role === "ADMIN" ? "ADMIN" : "CUSTOMER";
      return session;
    },
  },
});
