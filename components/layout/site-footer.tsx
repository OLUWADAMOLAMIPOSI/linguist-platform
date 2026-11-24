import Link from "next/link";
import { getSettings, socialLinks } from "@/lib/data";
import { NewsletterForm } from "@/components/forms/public-forms";

export async function SiteFooter() {
  const settings = await getSettings();
  const links = socialLinks(settings);
  return (
    <footer className="mt-20 border-t border-line bg-sand/40">
      <div className="container-page grid gap-10 py-12 md:grid-cols-3">
        <div>
          <p className="font-serif text-lg text-forest-dark">{settings.site_name}</p>
          {settings.tagline && <p className="mt-2 text-sm text-muted">{settings.tagline}</p>}
          {settings.institution && <p className="mt-1 text-sm text-muted">{settings.institution}</p>}
        </div>

        <div>
          <p className="eyebrow mb-3">Explore</p>
          <ul className="grid grid-cols-2 gap-y-1 text-sm">
            {[
              ["/research", "Research"],
              ["/publications", "Publications"],
              ["/languages", "Languages"],
              ["/dictionary", "Dictionary"],
              ["/blog", "Blog"],
              ["/contact", "Contact"],
              ["/contact#collaborate", "Collaborate"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="text-muted hover:text-forest-dark">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          {links.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {links.map((l) => (
                <li key={l.label}>
                  <a href={l.url} target="_blank" rel="noopener noreferrer" className="link">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <p className="eyebrow mb-3">Research updates</p>
          <p className="mb-3 text-sm text-muted">Subscribe for new publications and research news.</p>
          <NewsletterForm compact />
        </div>
      </div>
      <div className="border-t border-line py-4 text-center text-xs text-muted">
        &copy; {new Date().getFullYear()} {settings.site_name}. All rights reserved.
      </div>
    </footer>
  );
}
