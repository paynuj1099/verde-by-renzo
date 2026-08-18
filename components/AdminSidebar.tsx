"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  FileText,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  ShoppingCart,
  Sparkles,
  Store,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const items = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "New Arrivals", href: "/admin/new-arrivals", icon: Sparkles },
  { label: "Blogs", href: "/admin/blogs", icon: BookOpen },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { label: "Customers", href: "#", icon: Users, dummy: true },
  { label: "Reports", href: "#", icon: FileText, dummy: true },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    if (signingOut) return;

    setSigningOut(true);

    try {
      await logout();
      window.location.assign("/");
    } catch (error) {
      console.error("Unable to sign out:", error);
      setSigningOut(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-[890] flex h-11 w-11 items-center justify-center rounded-full border border-[#3a493f] bg-[#111914] text-[#d2aa5a] shadow-lg sm:hidden"
        aria-label="Open admin menu"
        aria-expanded={mobileOpen}
      >
        <Menu size={22} />
      </button>

      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-[895] bg-black/50 backdrop-blur-sm sm:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close admin menu"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-[900] flex h-screen w-64 flex-none flex-col border-r border-[#29352e] bg-[#111914] px-5 py-5 text-[#e8e2d5] shadow-[8px_0_30px_rgba(10,18,13,.08)] transition-[transform,width] duration-300 sm:sticky sm:top-0 sm:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "sm:w-20 sm:px-2" : "sm:w-60 sm:px-5"}`}
      >
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-[#3a493f] text-[#d2aa5a] sm:hidden"
          aria-label="Close admin menu"
        >
          <X size={20} />
        </button>

        <div className="mb-4 flex min-h-16 items-center justify-center">
          <Link
            href="/"
            className={`relative block h-16 w-44 -translate-x-2 transition-all sm:translate-x-0 ${
              collapsed ? "sm:h-14 sm:w-14" : "sm:h-16 sm:w-44"
            }`}
          >
            <Image
              src="/images/verde-logo.png"
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
                data-tour={
                  label === "Products"
                    ? "admin-menu-products"
                    : label === "Orders"
                      ? "admin-menu-orders"
                      : label === "New Arrivals"
                        ? "admin-menu-new-arrivals"
                        : undefined
                }
                aria-label={label}
                onClick={(event) => {
                  if (dummy) event.preventDefault();
                }}
                className={`group relative flex items-center justify-start gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                  collapsed ? "sm:justify-center" : ""
                } ${
                  active
                    ? "bg-[#c39a4b] text-[#111914] shadow-[0_8px_22px_rgba(195,154,75,.18)]"
                    : dummy
                      ? "cursor-default text-[#536158]"
                      : "text-[#c6cec8] hover:bg-white/5 hover:text-[#e4bd70]"
                }`}
              >
                <Icon size={19} />
                <span className={collapsed ? "sm:hidden" : ""}>{label}</span>

                {dummy && (
                  <span
                    className={`ml-auto text-[9px] uppercase tracking-wide ${
                      collapsed ? "sm:hidden" : ""
                    }`}
                  >
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

        <div className="mt-7 space-y-2 border-t border-[#2d3931] pt-6">
          <Link
            href="/admin/help"
            className={`group relative flex items-center justify-start gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
              collapsed ? "sm:justify-center" : ""
            } ${
              pathname === "/admin/help"
                ? "bg-[#c39a4b] text-[#111914]"
                : "text-[#c6cec8] hover:bg-white/5 hover:text-[#e4bd70]"
            }`}
          >
            <HelpCircle size={19} />
            <span className={collapsed ? "sm:hidden" : ""}>Help</span>

            {collapsed && (
              <span className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 z-50 hidden -translate-y-1/2 translate-x-1 whitespace-nowrap rounded-lg bg-forest-900 px-3 py-2 text-xs font-medium text-white opacity-0 shadow-lg transition-all duration-150 sm:block sm:group-hover:translate-x-0 sm:group-hover:opacity-100">
                Help
              </span>
            )}
          </Link>

          <Link
            href="/admin/settings"
            className={`group relative flex items-center justify-start gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
              collapsed ? "sm:justify-center" : ""
            } ${
              pathname === "/admin/settings"
                ? "bg-[#c39a4b] text-[#111914]"
                : "text-[#c6cec8] hover:bg-white/5 hover:text-[#e4bd70]"
            }`}
          >
            <Settings size={19} />
            <span className={collapsed ? "sm:hidden" : ""}>Settings</span>

            {collapsed && (
              <span className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 z-50 hidden -translate-y-1/2 translate-x-1 whitespace-nowrap rounded-lg bg-forest-900 px-3 py-2 text-xs font-medium text-white opacity-0 shadow-lg transition-all duration-150 sm:block sm:group-hover:translate-x-0 sm:group-hover:opacity-100">
                Settings
              </span>
            )}
          </Link>
        </div>

        <div className="mt-auto space-y-2 border-t border-[#2d3931] pt-4">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View Storefront"
            className={`group relative flex items-center justify-start gap-3 rounded-xl px-3 py-3 text-sm text-[#e4bd70] transition hover:bg-white/5 ${
              collapsed ? "sm:justify-center" : ""
            }`}
          >
            <Store size={19} />
            <span className={collapsed ? "sm:hidden" : ""}>
              View Storefront
            </span>

            {collapsed && (
              <span className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 z-50 hidden -translate-y-1/2 translate-x-1 whitespace-nowrap rounded-lg bg-forest-900 px-3 py-2 text-xs font-medium text-white opacity-0 shadow-lg transition-all duration-150 before:absolute before:right-full before:top-1/2 before:-translate-y-1/2 before:border-4 before:border-transparent before:border-r-forest-900 sm:block sm:group-hover:translate-x-0 sm:group-hover:opacity-100">
                View Storefront
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            aria-label="Sign out"
            className={`group relative flex w-full items-center justify-start gap-3 rounded-xl border border-[#3a493f] bg-[#19231d] px-3 py-3 text-sm font-semibold text-[#e8e2d5] shadow-sm transition hover:border-[#c39a4b] hover:bg-[#243229] hover:text-[#e4bd70] disabled:cursor-not-allowed disabled:opacity-50 ${
              collapsed ? "sm:justify-center" : ""
            }`}
          >
            <LogOut
              size={19}
              className={signingOut ? "animate-pulse" : ""}
            />
            <span className={collapsed ? "sm:hidden" : ""}>
              {signingOut ? "Signing out..." : "Sign out"}
            </span>

            {collapsed && (
              <span className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 z-50 hidden -translate-y-1/2 translate-x-1 whitespace-nowrap rounded-lg bg-forest-900 px-3 py-2 text-xs font-medium text-white opacity-0 shadow-lg transition-all duration-150 before:absolute before:right-full before:top-1/2 before:-translate-y-1/2 before:border-4 before:border-transparent before:border-r-forest-900 sm:block sm:group-hover:translate-x-0 sm:group-hover:opacity-100">
                {signingOut ? "Signing out..." : "Sign out"}
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
