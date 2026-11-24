import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Connection check. Open http://localhost:3000/api/health in the browser.
 * It never prints keys, only whether they exist and what went wrong.
 */
export async function GET() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const anon = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
  const service = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

  const report: Record<string, unknown> = {
    node: process.version,
    url_set: Boolean(url),
    url_value: url || null,
    anon_key_set: Boolean(anon),
    service_key_set: Boolean(service) && !service.startsWith("PASTE"),
  };

  if (!url) {
    report.problem = "NEXT_PUBLIC_SUPABASE_URL is empty. Check .env.local and restart the dev server.";
    return NextResponse.json(report, { status: 500 });
  }

  try {
    new URL(url);
  } catch {
    report.problem = "NEXT_PUBLIC_SUPABASE_URL is not a valid address. It must start with https://";
    return NextResponse.json(report, { status: 500 });
  }

  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/rest/v1/website_settings?select=site_name&limit=1`, {
      headers: { apikey: anon, Authorization: `Bearer ${anon}` },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    report.http_status = res.status;
    report.body = (await res.text()).slice(0, 300);
    report.ok = res.ok;
    if (!res.ok) report.problem = "Supabase answered, but refused the request. Check the anon key.";
    return NextResponse.json(report, { status: res.ok ? 200 : 500 });
  } catch (err) {
    const e = err as Error & { cause?: { code?: string; message?: string } };
    report.ok = false;
    report.error = e.message;
    report.cause_code = e.cause?.code ?? null;
    report.cause_message = e.cause?.message ?? null;
    const code = e.cause?.code;
    report.problem =
      code === "ENOTFOUND" || code === "EAI_AGAIN"
        ? "DNS could not find the host. Wrong URL, or your DNS/network is blocking supabase.co."
        : code === "ETIMEDOUT" || code === "UND_ERR_CONNECT_TIMEOUT" || e.name === "TimeoutError"
        ? "Connection timed out. Try the IPv4 fix, a different network, or turn off VPN/proxy."
        : code === "ECONNREFUSED" || code === "ECONNRESET"
        ? "Connection was refused or reset. A firewall, antivirus or proxy is likely blocking it."
        : code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE" || code === "SELF_SIGNED_CERT_IN_CHAIN"
        ? "Certificate problem. An antivirus or proxy is intercepting HTTPS."
        : "Unknown network failure. Send me this whole page.";
    return NextResponse.json(report, { status: 500 });
  }
}