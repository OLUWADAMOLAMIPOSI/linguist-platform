import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/sidebar";
import { getStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NAV_GROUPS } from "@/lib/admin/resources";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  // Server-side authorisation. The middleware only checks for a session; this checks staff membership.
  const staff = await getStaff();
  if (!staff) redirect("/admin/login?denied=1");

  const supabase = createClient();
  const [a, b] = await Promise.all([
    supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("collaboration_requests").select("id", { count: "exact", head: true }).eq("status", "new"),
  ]);
  const newMessages = (a.count ?? 0) + (b.count ?? 0);

  return (
    <div className="min-h-screen lg:flex">
      <AdminSidebar groups={NAV_GROUPS} email={staff.email} role={staff.role} newMessages={newMessages} />
      <div className="min-w-0 flex-1 px-4 py-8 sm:px-8">{children}</div>
    </div>
  );
}
