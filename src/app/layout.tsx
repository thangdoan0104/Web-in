import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { Header } from "@/components/Header";
import "./globals.css";

const font = Be_Vietnam_Pro({
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-be-vietnam",
});

export const metadata: Metadata = {
  title: "In Ấn Thái Nguyên – Đặt in standee, tờ rơi, biển quảng cáo online",
  description: "Tải file, xem mockup thực tế và đặt in standee, tờ rơi, biển quảng cáo tại Thái Nguyên. Nhận thiết kế ấn phẩm theo yêu cầu.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body className={`${font.variable} flex min-h-screen flex-col font-sans antialiased`}>
        <Header />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-gray-200 bg-white py-8 text-sm text-gray-500">
          <div className="mx-auto max-w-6xl px-4">
            <p className="font-semibold text-ink">In Ấn Thái Nguyên</p>
            <p>Địa chỉ xưởng: (cập nhật sau) · Hotline: (cập nhật sau)</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
