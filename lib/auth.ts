import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type StaffRole = "admin" | "editor";

export interface Staff {
  id: string;
  email: string;
  role: StaffRole;
}

/** Returns the logged-in staff member or null. Verified against the database every time. */
export async function getStaff(): Promise<Staff | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("admin_users")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw new Error(`Could not check staff role: ${error.message}`);
  if (!data) return null;
  return { id: user.id, email: user.email ?? "", role: data.role as StaffRole };
}

/** For server components: redirect to the login page when not signed in. */
export async function requireStaff(): Promise<Staff> {
  const staff = await getStaff();
  if (!staff) redirect("/admin/login");
  return staff;
}
