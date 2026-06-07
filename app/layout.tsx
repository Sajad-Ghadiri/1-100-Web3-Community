import type { Metadata } from "next";
// 1. Import Vazirmatn directly from Next.js
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

// 2. Configure the font for Arabic/Persian subsets
const vazir = Vazirmatn({
  subsets: ["arabic"],
  variable: "--font-vazirmatn",
});

export const metadata: Metadata = {
  title: "On-Chain Entropy",
  description: "Web3 Community",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // 3. Apply the language, RTL direction, and the new font variable
    <html
      lang="fa"
      dir="rtl"
      className={`${vazir.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col"
        style={{ fontFamily: "var(--font-vazirmatn), sans-serif" }}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
