import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";
import { UserManager, type StaffRow } from "@/components/admin/user-manager";

export const metadata = { title: "Users" };

export default async function UsersPage() {
  const staff = await requireStaff();
  if (staff.role !== "admin") return <p className="card max-w-lg p-6 text-sm">Only administrators can manage users.</p>;

  const supabase = createClient();
  const { data, error } = await supabase.from("admin_users").select("user_id, email, role").order("email");
  if (error) throw new Error(`Loading users: ${error.message}`);

  return (
    <div className="max-w-4xl">
      <p className="eyebrow mb-1">Access</p>
      <h1 className="mb-2 text-3xl">Users</h1>
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Administrators can change settings and manage users. Editors can manage content but not settings or users.
      </p>
      <UserManager users={(data ?? []) as StaffRow[]} currentId={staff.id} />
    </div>
  );
}
