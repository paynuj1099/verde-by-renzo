"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  FileText,
  HelpCircle,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  Store,
  Users,
} from "lucide-react";

const items = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Blogs", href: "/admin/blogs", icon: BookOpen },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { label: "Customers", href: "#", icon: Users, dummy: true },
  { label: "Reports", href: "#", icon: FileText, dummy: true },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  return (
    <aside
      className={`relative sticky top-0 z-[900] flex h-screen w-20 flex-none flex-col border-r border-[#29352e] bg-[#111914] px-2 py-5 text-[#e8e2d5] shadow-[8px_0_30px_rgba(10,18,13,.08)] transition-[width] duration-300 ${collapsed ? "sm:w-20" : "sm:w-60 sm:px-5"}`}
    >
      <div className="mb-4 flex min-h-16 items-center justify-center">
        <Link
          href="/"
          className={`relative block h-14 w-14 transition-all ${collapsed ? "sm:h-14 sm:w-14" : "sm:h-16 sm:w-44"}`}
        >
          <Image
            src="/images/verde-logo-icon.png"
            alt="Verde by Renzo"
            fill
            className="object-contain sm:hidden"
          />
          <Image
            src={
              collapsed
                ? "/images/verde-logo-icon.png"
                : "/images/verde-logo.png"
            }
            alt="Verde by Renzo"
            fill
            className="hidden object-contain sm:block"
          />
        </Link>
      </div>
      <button
        type="button"
        onClick={() => setCollapsed((value) => !value)}
        className="absolute -right-3.5 top-10 z-20 hidden h-7 w-7 items-center justify-center rounded-full border border-[#3a493f] bg-[#19231d] text-[#d2aa5a] shadow-lg hover:bg-[#243229] sm:flex"
        aria-label={collapsed ? "Expand sidebar" : "Minimize sidebar"}
      >
        {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
      </button>
      <nav className="space-y-2">
        {items.map(({ label, href, icon: Icon, dummy }) => {
          const active =
            href === "/admin" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={label}
              href={href}
              aria-label={label}
              onClick={(event) => {
                if (dummy) event.preventDefault();
              }}
              className={`group relative flex items-center justify-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${!collapsed ? "sm:justify-start" : ""} ${active ? "bg-[#c39a4b] text-[#111914] shadow-[0_8px_22px_rgba(195,154,75,.18)]" : dummy ? "cursor-default text-[#536158]" : "text-[#c6cec8] hover:bg-white/5 hover:text-[#e4bd70]"}`}
            >
              <Icon size={19} />
              {!collapsed && <span className="hidden sm:inline">{label}</span>}
              {dummy && !collapsed && (
                <span className="ml-auto hidden text-[9px] uppercase tracking-wide sm:inline">
                  Soon
                </span>
              )}
              {collapsed && (
                <span className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 z-50 hidden -translate-y-1/2 translate-x-1 whitespace-nowrap rounded-lg bg-forest-900 px-3 py-2 text-xs font-medium text-white opacity-0 shadow-lg transition-all duration-150 before:absolute before:right-full before:top-1/2 before:-translate-y-1/2 before:border-4 before:border-transparent before:border-r-forest-900 sm:block sm:group-hover:translate-x-0 sm:group-hover:opacity-100">
                  {label}
                  {dummy && (
                    <span className="ml-2 text-[9px] uppercase tracking-wider text-gold-300">
                      Soon
                    </span>
                  )}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="mt-7 border-t border-[#2d3931] pt-6">
        {[
          [HelpCircle, "Help"],
          [Settings, "Settings"],
        ].map(([Icon, label]) => (
          <span
            key={String(label)}
            className={`group relative flex items-center justify-center gap-3 rounded-xl px-3 py-3 text-sm text-[#56635a] ${!collapsed ? "sm:justify-start" : ""}`}
          >
            <Icon size={19} />
            {!collapsed && (
              <span className="hidden sm:inline">{String(label)}</span>
            )}
            {collapsed && (
              <span className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 z-50 hidden -translate-y-1/2 translate-x-1 whitespace-nowrap rounded-lg bg-forest-900 px-3 py-2 text-xs font-medium text-white opacity-0 shadow-lg transition-all duration-150 before:absolute before:right-full before:top-1/2 before:-translate-y-1/2 before:border-4 before:border-transparent before:border-r-forest-900 sm:block sm:group-hover:translate-x-0 sm:group-hover:opacity-100">
                {String(label)}
                <span className="ml-2 text-[9px] uppercase tracking-wider text-gold-300">
                  Soon
                </span>
              </span>
            )}
          </span>
        ))}
      </div>
      <Link
        href="/"
        aria-label="View Storefront"
        className={`group relative mt-auto flex items-center justify-center gap-3 rounded-xl px-3 py-3 text-sm text-[#e4bd70] hover:bg-white/5 ${!collapsed ? "sm:justify-start" : ""}`}
      >
        <Store size={19} />
        {!collapsed && (
          <span className="hidden sm:inline">View Storefront</span>
        )}
        {collapsed && (
          <span className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 z-50 hidden -translate-y-1/2 translate-x-1 whitespace-nowrap rounded-lg bg-forest-900 px-3 py-2 text-xs font-medium text-white opacity-0 shadow-lg transition-all duration-150 before:absolute before:right-full before:top-1/2 before:-translate-y-1/2 before:border-4 before:border-transparent before:border-r-forest-900 sm:block sm:group-hover:translate-x-0 sm:group-hover:opacity-100">
            View Storefront
          </span>
        )}
      </Link>
    </aside>
  );
}
