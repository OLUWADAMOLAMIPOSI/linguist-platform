"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

const NAV = [
  { href: "/about", label: "About" },
  { href: "/research", label: "Research" },
  { href: "/publications", label: "Publications" },
  { href: "/teaching", label: "Teaching" },
  { href: "/blog", label: "Blog" },
  { href: "/languages", label: "Languages" },
  { href: "/phonetics", label: "Phonetics" },
  { href: "/syntax", label: "Syntax" },
  { href: "/dictionary", label: "Dictionary" },
  { href: "/corpus", label: "Corpus" },
  { href: "/audio", label: "Audio" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader({ siteName, logoUrl }: { siteName: string; logoUrl?: string | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  const active = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ivory/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-serif text-lg text-forest-dark">
          {logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="h-8 w-8 object-contain" />
          )}
          <span className="max-w-[14rem] truncate">{siteName}</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-4 xl:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active(item.href) ? "page" : undefined}
              className={`text-sm ${active(item.href) ? "font-semibold text-forest-dark" : "text-muted hover:text-forest-dark"}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          className="btn btn-outline xl:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="border-t border-line bg-ivory xl:hidden">
          <div className="container-page grid grid-cols-2 gap-x-4 py-3 sm:grid-cols-3">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active(item.href) ? "page" : undefined}
                className={`py-2 text-sm ${active(item.href) ? "font-semibold text-forest-dark" : "text-muted"}`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
