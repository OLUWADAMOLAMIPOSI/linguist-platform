import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { SetupNotice } from "@/components/ui/common";
import { getSettings } from "@/lib/data";
import { isConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  if (!isConfigured()) return <SetupNotice />;
  const settings = await getSettings();
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-paper focus:px-3 focus:py-2">
        Skip to content
      </a>
      <SiteHeader siteName={settings.site_name} logoUrl={settings.logo_url} />
      <main id="main">{children}</main>
      <SiteFooter />
    </>
  );
}
