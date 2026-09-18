import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ma Sói",
  description: "Quản trò Ma Sói tự động",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
