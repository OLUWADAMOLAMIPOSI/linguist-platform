import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { must } from "@/lib/data";
import { createPublicClient } from "@/lib/supabase/public";
import { buildMetadata } from "@/lib/seo";
import { HtmlContent } from "@/components/ui/common";
import { ShareButtons } from "@/components/ui/share-buttons";
import { siteUrl } from "@/lib/env";
import { formatDate, stripHtml, truncate, type Row } from "@/lib/utils";

async function load(slug: string) {
  const db = createPublicClient();
  const { data, error } = await db
    .from("blog_posts")
    .select("*, blog_categories(id, name, slug), blog_post_tags(blog_tags(id, name, slug))")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`Loading article: ${error.message}`);
  return data as Row | null;
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const p = await load(params.slug);
  if (!p) return { title: "Article not found" };
  return buildMetadata({
    path: `/blog/${p.slug}`,
    title: p.seo_title || p.title,
    description: p.seo_description || p.excerpt || truncate(stripHtml(p.content), 160),
    image: p.og_image_url || p.featured_image_url,
    type: "article",
    publishedTime: p.published_at,
  });
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const post = await load(params.slug);
  if (!post) notFound();

  const tags = ((post.blog_post_tags ?? []) as Row[]).map((t) => t.blog_tags).filter(Boolean) as Row[];

  const db = createPublicClient();
  let related: Row[] = [];
  if (post.category_id) {
    related = await must<Row[]>(
      db
        .from("blog_posts")
        .select("id, title, slug, published_at")
        .eq("category_id", post.category_id)
        .neq("id", post.id)
        .order("published_at", { ascending: false })
        .limit(3),
      "Loading related articles"
    );
  }
  if (related.length === 0) {
    related = await must<Row[]>(
      db.from("blog_posts").select("id, title, slug, published_at").neq("id", post.id).order("published_at", { ascending: false }).limit(3),
      "Loading related articles"
    );
  }

  const url = `${siteUrl()}/blog/${post.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    datePublished: post.published_at,
    author: post.author_name ? { "@type": "Person", name: post.author_name } : undefined,
    image: post.featured_image_url ?? undefined,
    description: post.excerpt ?? undefined,
    mainEntityOfPage: url,
  };

  return (
    <article className="container-page max-w-3xl py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="mb-6 text-sm">
        <Link href="/blog" className="link">
          All articles
        </Link>
      </nav>
      {post.blog_categories && <p className="eyebrow mb-2">{post.blog_categories.name}</p>}
      <h1 className="text-3xl leading-tight sm:text-4xl">{post.title}</h1>
      <p className="mt-3 text-sm text-muted">
        {post.author_name && `${post.author_name} · `}
        {formatDate(post.published_at)} · {post.reading_minutes} min read
      </p>

      {post.featured_image_url && (
        <Image
          src={post.featured_image_url}
          alt=""
          width={1200}
          height={675}
          priority
          className="my-8 aspect-video w-full rounded border border-line object-cover"
        />
      )}

      <HtmlContent html={post.content} />

      {tags.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {tags.map((t) => (
            <Link key={t.id} href={`/blog?tag=${t.slug}`} className="badge hover:bg-sand-dark">
              {t.name}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8 border-t border-line pt-6">
        <ShareButtons url={url} title={post.title} />
      </div>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-xl">Related articles</h2>
          <ul className="space-y-2 text-sm">
            {related.map((r) => (
              <li key={r.id}>
                <Link href={`/blog/${r.slug}`} className="link">
                  {r.title}
                </Link>
                <span className="text-muted"> · {formatDate(r.published_at)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
