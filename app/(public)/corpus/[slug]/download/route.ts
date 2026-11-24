import { NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";
import { signedUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

/**
 * Private dataset download. The collection must be published (enforced by Row Level Security
 * on the anonymous client) and the researcher must have enabled public downloads.
 * The file itself lives in a private bucket and is served through a short-lived signed URL.
 */
export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const db = createPublicClient();
  const { data, error } = await db
    .from("corpus_collections")
    .select("dataset_path, allow_download")
    .eq("slug", params.slug)
    .maybeSingle();

  if (error) return new NextResponse("Could not load the dataset.", { status: 500 });
  if (!data || !data.allow_download || !data.dataset_path) {
    return new NextResponse("This dataset is not available for download.", { status: 404 });
  }

  const url = await signedUrl("corpus-datasets", data.dataset_path, 120);
  if (!url) return new NextResponse("The download link could not be created.", { status: 500 });
  return NextResponse.redirect(url);
}
