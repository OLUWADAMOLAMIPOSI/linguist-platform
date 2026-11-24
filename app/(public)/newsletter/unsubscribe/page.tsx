import Link from "next/link";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/ui/common";

export const metadata = { title: "Unsubscribe", robots: { index: false } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function unsubscribe(formData: FormData) {
  "use server";
  const token = String(formData.get("token") ?? "");
  if (!UUID.test(token)) return;
  const db = createAdminClient();
  const { error } = await db.from("newsletter_subscribers").update({ status: "unsubscribed" }).eq("unsubscribe_token", token);
  if (error) console.error("[newsletter unsubscribe]", error.message);
  revalidatePath("/newsletter/unsubscribe");
}

export default async function UnsubscribePage({ searchParams }: { searchParams: { token?: string } }) {
  const token = searchParams.token ?? "";
  let state: "invalid" | "active" | "done" | "error" = "invalid";

  if (UUID.test(token)) {
    try {
      const db = createAdminClient();
      const { data, error } = await db.from("newsletter_subscribers").select("status").eq("unsubscribe_token", token).maybeSingle();
      if (error) state = "error";
      else if (!data) state = "invalid";
      else state = data.status === "unsubscribed" ? "done" : "active";
    } catch {
      state = "error";
    }
  }

  return (
    <>
      <PageHeader title="Unsubscribe" />
      <div className="container-page max-w-xl py-12">
        {state === "invalid" && <p>This unsubscribe link is not valid.</p>}
        {state === "error" && <p>We could not process your request right now. Please try again later.</p>}
        {state === "done" && <p>You have been unsubscribed and will no longer receive emails.</p>}
        {state === "active" && (
          <form action={unsubscribe} className="space-y-4">
            <p>Do you want to stop receiving research and publication updates?</p>
            <input type="hidden" name="token" value={token} />
            <button type="submit" className="btn btn-primary">
              Yes, unsubscribe me
            </button>
          </form>
        )}
        <div className="mt-8">
          <Link href="/" className="link">
            Back to the home page
          </Link>
        </div>
      </div>
    </>
  );
}
