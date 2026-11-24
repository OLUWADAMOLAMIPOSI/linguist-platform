"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { LogOut, Menu, X } from "lucide-react";
import { signOut } from "@/app/admin/actions";

interface Group {
  group: string;
  items: { key: string; label: string; adminOnly?: boolean }[];
}

export function AdminSidebar({
  groups,
  email,
  role,
  newMessages,
}: {
  groups: Group[];
  email: string;
  role: string;
  newMessages: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const Link2 = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <Link
      href={href}
      aria-current={isActive(href) ? "page" : undefined}
      className={`flex items-center justify-between rounded px-3 py-1.5 text-sm ${
        isActive(href) ? "bg-forest text-ivory" : "text-ink hover:bg-sand/70"
      }`}
    >
      {children}
    </Link>
  );

  const content = (
    <nav aria-label="Admin" className="flex h-full flex-col">
      <div className="border-b border-line px-4 py-4">
        <p className="font-serif text-lg text-forest-dark">Admin</p>
        <p className="truncate text-xs text-muted">{email}</p>
        <p className="text-xs capitalize text-muted">{role}</p>
      </div>
      <div className="flex-1 space-y-5 overflow-y-auto px-2 py-4">
        <div className="space-y-0.5">
          <Link2 href="/admin/dashboard">Overview</Link2>
          <Link2 href="/admin/messages">
            <span>Messages</span>
            {newMessages > 0 && <span className="rounded-full bg-sand-dark px-2 text-xs text-forest-dark">{newMessages}</span>}
          </Link2>
          <Link2 href="/admin/media">Media library</Link2>
        </div>
        {groups.map((g) => {
          const items = g.items.filter((i) => !i.adminOnly || role === "admin");
          if (items.length === 0) return null;
          return (
            <div key={g.group}>
              <p className="px-3 pb-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-forest-light">{g.group}</p>
              <div className="space-y-0.5">
                {items.map((i) => (
                  <Link2 key={i.key} href={`/admin/${i.key}`}>
                    {i.label}
                  </Link2>
                ))}
              </div>
            </div>
          );
        })}
        {role === "admin" && (
          <div>
            <p className="px-3 pb-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-forest-light">Access</p>
            <Link2 href="/admin/settings/users">Users</Link2>
          </div>
        )}
      </div>
      <div className="space-y-2 border-t border-line p-3">
        <Link href="/" target="_blank" className="btn btn-outline btn-sm w-full">
          View website
        </Link>
        <button
          type="button"
          className="btn btn-outline btn-sm w-full"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await signOut();
              router.replace("/admin/login");
              router.refresh();
            })
          }
        >
          <LogOut size={14} /> {pending ? "Signing out..." : "Sign out"}
        </button>
      </div>
    </nav>
  );

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-ivory px-4 py-3 lg:hidden">
        <p className="font-serif text-lg text-forest-dark">Admin</p>
        <button type="button" className="btn btn-outline btn-sm" aria-expanded={open} aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((v) => !v)}>
          {open ? <X size={16} /> : <Menu size={16} />}
        </button>
      </div>
      {open && <div className="fixed inset-x-0 bottom-0 top-[53px] z-20 overflow-y-auto bg-ivory lg:hidden">{content}</div>}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-line bg-paper lg:block">{content}</aside>
    </>
  );
}
