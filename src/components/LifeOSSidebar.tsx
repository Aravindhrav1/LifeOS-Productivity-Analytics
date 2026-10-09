"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

  return (
    <aside className="w-full border-b border-slate-200 bg-white lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:border-b-0 lg:border-r">
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
        <nav className="flex gap-2 overflow-x-auto p-3 lg:flex-1 lg:flex-col lg:overflow-visible lg:p-4">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
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
        <div className="hidden border-t border-slate-100 p-5 lg:block">
          <p className="text-xs text-slate-400">
            LifeOS · Personal Analytics
          </p>
        </div>
      </div>
    </aside>
  );
}