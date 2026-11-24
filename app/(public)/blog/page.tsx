import Image from "next/image";
import Link from "next/link";
import { must, PAGE_SIZE, range } from "@/lib/data";
import { createPublicClient } from "@/lib/supabase/public";
import { buildMetadata } from "@/lib/seo";
import { EmptyState, FilterBar, PageHeader, Pagination, SearchFilter, SelectFilter } from "@/components/ui/common";
import { cleanSearch, firstParam, formatDate, pageParam, truncate, type Row } from "@/lib/utils";

export async function generateMetadata() {
  return buildMetadata({ path: "/blog", title: "Linguistic insights", description: "Articles, reviews and research updates." });
}

type SP = { [key: string]: string | string[] | undefined };

export default async function BlogPage({ searchParams }: { searchParams: SP }) {
  const db = createPublicClient();
  const q = cleanSearch(searchParams.q);
  const category = firstParam(searchParams.category);
  const tag = firstParam(searchParams.tag);
  const page = pageParam(searchParams.page);

  const [categories, tags] = await Promise.all([
    must<Row[]>(db.from("blog_categories").select("id, name, slug").order("name"), "Loading categories"),
    must<Row[]>(db.from("blog_tags").select("id, name, slug").order("name"), "Loading tags"),
  ]);

  let postIds: string[] | null = null;
  if (tag) {
    const tagRow = tags.find((t) => t.slug === tag);
    if (tagRow) {
      const links = await must<Row[]>(db.from("blog_post_tags").select("post_id").eq("tag_id", tagRow.id), "Filtering by tag");
      postIds = links.map((l) => l.post_id);
    } else {
      postIds = [];
    }
  }

  let query = db
    .from("blog_posts")
    .select("id, title, slug, excerpt, featured_image_url, author_name, published_at, reading_minutes, blog_categories(name, slug)", { count: "exact" })
    .order("published_at", { ascending: false });
  if (q) query = query.or(`title.ilike.%${q}%,excerpt.ilike.%${q}%`);
  const cat = categories.find((c) => c.slug === category);
  if (category) query = cat ? query.eq("category_id", cat.id) : query.eq("category_id", "00000000-0000-0000-0000-000000000000");
  if (postIds) query = postIds.length > 0 ? query.in("id", postIds) : query.eq("id", "00000000-0000-0000-0000-000000000000");

  const [from, to] = range(page, 9);
  const { data, count, error } = await query.range(from, to);
  if (error) throw new Error(`Loading posts: ${error.message}`);
  const posts = (data ?? []) as Row[];

  return (
    <>
      <PageHeader eyebrow="Blog" title="Linguistic insights" intro="Articles, research reflections, language analysis and reviews." />
      <div className="container-page py-10">
        <FilterBar action="/blog">
          <SearchFilter value={q} placeholder="Search articles" />
          {categories.length > 0 && (
            <SelectFilter name="category" label="Category" value={category} options={categories.map((c) => ({ value: c.slug, label: c.name }))} />
          )}
          {tags.length > 0 && <SelectFilter name="tag" label="Tag" value={tag} options={tags.map((t) => ({ value: t.slug, label: t.name }))} />}
        </FilterBar>

        {posts.length === 0 ? (
          <EmptyState title="No articles found" text="Check back soon, or try clearing the filters." />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <article key={p.id} className="card overflow-hidden">
                {p.featured_image_url && (
                  <Image src={p.featured_image_url} alt="" width={640} height={360} className="aspect-video w-full object-cover" />
                )}
                <div className="p-5">
                  <p className="mb-1 text-xs text-muted">
                    {formatDate(p.published_at)} · {p.reading_minutes} min read
                    {p.blog_categories && ` · ${p.blog_categories.name}`}
                  </p>
                  <h2 className="text-lg leading-snug">
                    <Link href={`/blog/${p.slug}`} className="hover:underline">
                      {p.title}
                    </Link>
                  </h2>
                  {p.excerpt && <p className="mt-2 text-sm text-muted">{truncate(p.excerpt, 140)}</p>}
                </div>
              </article>
            ))}
          </div>
        )}
        <Pagination page={page} total={count ?? 0} pageSize={9} basePath="/blog" params={{ q, category, tag }} />
      </div>
    </>
  );
}
