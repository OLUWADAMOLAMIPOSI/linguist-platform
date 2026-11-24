import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";
import { MessageActions } from "@/components/admin/message-actions";
import { collaborationTypes } from "@/lib/validations/public";
import { formatDate, labelize } from "@/lib/utils";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function MessageDetailPage({ params }: { params: { type: string; id: string } }) {
  await requireStaff();
  if (params.type !== "contact" && params.type !== "collaboration") notFound();
  if (!UUID.test(params.id)) notFound();
  const type = params.type;
  const table = type === "contact" ? "contact_messages" : "collaboration_requests";

  const supabase = createClient();
  const { data: msg, error } = await supabase.from(table).select("*").eq("id", params.id).maybeSingle();
  if (error) throw new Error(`Loading message: ${error.message}`);
  if (!msg) notFound();

  // Opening a new message marks it as read
  let status: string = msg.status;
  if (status === "new") {
    const { error: upError } = await supabase.from(table).update({ status: "read" }).eq("id", params.id);
    if (!upError) status = "read";
  }

  const typeLabel = type === "collaboration" ? (collaborationTypes.find((t) => t.value === msg.request_type)?.label ?? labelize(msg.request_type)) : labelize(msg.category);

  return (
    <div className="max-w-3xl">
      <Link href={`/admin/messages?tab=${type}`} className="link text-sm">
        Back to messages
      </Link>
      <h1 className="mb-1 mt-4 text-2xl">{msg.subject}</h1>
      <p className="mb-6 text-sm text-muted">
        {msg.full_name} &lt;<a href={`mailto:${msg.email}`} className="link">{msg.email}</a>&gt; · {formatDate(msg.created_at, { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
      </p>

      <div className="card mb-6 p-5">
        <dl className="mb-4 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted">{type === "contact" ? "Category" : "Request type"}</dt>
            <dd>{typeLabel}</dd>
          </div>
          {msg.affiliation && (
            <div>
              <dt className="text-muted">Affiliation</dt>
              <dd>{msg.affiliation}</dd>
            </div>
          )}
        </dl>
        <p className="whitespace-pre-wrap leading-7">{msg.message}</p>
      </div>

      <MessageActions type={type} id={params.id} status={status} notes={msg.admin_notes ?? ""} email={msg.email} />
    </div>
  );
}
