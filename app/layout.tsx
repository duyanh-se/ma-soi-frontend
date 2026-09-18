import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Làng trong rừng · Ma Sói",
  description: "Quản trò Ma Sói tự động",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
