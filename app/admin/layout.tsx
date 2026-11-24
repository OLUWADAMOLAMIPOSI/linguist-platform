import type { Metadata } from "next";
import { SetupNotice } from "@/components/ui/common";
import { isConfigured } from "@/lib/env";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Admin" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  if (!isConfigured()) return <SetupNotice />;
  return <>{children}</>;
}
