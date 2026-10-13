"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/client";

const navItems = [
  {
    name: "Today",
    href: "/",
    icon: "☀️",
  },
  {
    name: "Future",
    href: "/future",
    icon: "🚀",
  },
  {
    name: "Opportunities",
    href: "/opportunities",
    icon: "💼",
  },
  {
    name: "Journal",
    href: "/journal",
    icon: "📖",
  },
  {
    name: "Insights",
    href: "/insights",
    icon: "📊",
  },
  {
    name: "Settings",
    href: "/settings",
    icon: "⚙️",
  },
];

export default function LifeOSSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    const supabase = createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout failed:", error.message);
      setLoggingOut(false);
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  function isActiveRoute(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-200 bg-white lg:block">
        <div className="flex h-full flex-col">
          {/* LOGO */}
          <div className="border-b border-slate-100 px-6 py-6">
            <Link href="/">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                LifeOS
              </h1>

              <p className="mt-1 text-xs text-slate-400">
                Build your better life.
              </p>
            </Link>
          </div>

          {/* NAVIGATION */}
          <nav className="flex flex-1 flex-col gap-2 p-4">
            {navItems.map((item) => {
              const isActive = isActiveRoute(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* FOOTER */}
          <div className="border-t border-slate-100 p-4">
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span>↪️</span>
              <span>{loggingOut ? "Logging out..." : "Log out"}</span>
            </button>

            <p className="mt-3 px-4 text-xs text-slate-400">
              LifeOS · Personal Analytics
            </p>
          </div>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur lg:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <Link href="/" onClick={() => setMobileMenuOpen(false)}>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                LifeOS
              </h1>
              <p className="text-[11px] text-slate-400">
                Build your better life.
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((current) => !current)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-xl text-slate-700 shadow-sm"
            aria-label="Open navigation"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-slate-100 bg-white px-3 pb-4 pt-3 shadow-lg">
            <nav className="grid grid-cols-2 gap-2">
              {navItems.map((item) => {
                const isActive = isActiveRoute(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-medium transition ${
                      isActive
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 disabled:opacity-50"
            >
              <span>↪️</span>
              <span>{loggingOut ? "Logging out..." : "Log out"}</span>
            </button>
          </div>
        )}
      </header>
    </>
  );
}