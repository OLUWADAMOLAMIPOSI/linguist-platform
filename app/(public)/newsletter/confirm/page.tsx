import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/ui/common";

export const metadata = { title: "Confirm subscription", robots: { index: false } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ConfirmPage({ searchParams }: { searchParams: { token?: string } }) {
  const token = searchParams.token ?? "";
  let message = "This confirmation link is not valid.";
  let ok = false;

  if (UUID.test(token)) {
    try {
      const db = createAdminClient();
      const { data, error } = await db
        .from("newsletter_subscribers")
        .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
        .eq("confirm_token", token)
        .select("id");
      if (error) {
        console.error("[newsletter confirm]", error.message);
        message = "We could not confirm your subscription right now. Please try again later.";
      } else if (data && data.length > 0) {
        ok = true;
        message = "Thank you. Your subscription is confirmed.";
      } else {
        message = "This confirmation link is not valid or has already been used.";
      }
    } catch (err) {
      console.error("[newsletter confirm]", err);
      message = "We could not confirm your subscription right now. Please try again later.";
    }
  }

  return (
    <>
      <PageHeader title={ok ? "Subscription confirmed" : "Confirmation"} />
      <div className="container-page max-w-xl py-12">
        <p className="mb-6">{message}</p>
        <Link href="/" className="btn btn-primary">
          Back to the home page
        </Link>
      </div>
    </>
  );
}
