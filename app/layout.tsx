import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Linguist Portfolio", template: "%s | Linguist Portfolio" },
  description: "Academic portfolio, research and language documentation platform.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
