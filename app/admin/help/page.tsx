"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getIdTokenResult } from "firebase/auth";
import {
  BookOpen,
  ChevronDown,
  HelpCircle,
  Mail,
  Package,
  Search,
  Settings,
  ShoppingCart,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const guides = [
  {
    title: "Manage products",
    description: "Add products, update inventory, prices, and product images.",
    href: "/admin/products",
    icon: Package,
  },
  {
    title: "Manage orders",
    description: "Review purchases and move orders through each status.",
    href: "/admin/orders",
    icon: ShoppingCart,
  },
  {
    title: "New arrivals",
    description: "Choose and arrange the products featured on the storefront.",
    href: "/admin/new-arrivals",
    icon: Sparkles,
  },
  {
    title: "Account settings",
    description: "Update your profile, security, devices, and notifications.",
    href: "/admin/settings",
    icon: Settings,
  },
];

const faqs = [
  {
    question: "How do I add a new product?",
    answer:
      "Open Products, select Add Product, complete the product information and images, then save it. The product will become available in the catalog based on its visibility and stock settings.",
  },
  {
    question: "How do order notifications work?",
    answer:
      "The dashboard listens for new orders and status changes in real time. You can enable or disable each alert type from Settings. Opening the bell marks the current notifications as read across your devices.",
  },
  {
    question: "How do I update an order status?",
    answer:
      "Open Orders, find the order, then select its next status. Changes appear in the order history and can trigger an admin notification when status alerts are enabled.",
  },
  {
    question: "How do I feature a product in New Arrivals?",
    answer:
      "Open New Arrivals, locate the product, add it to the selection, and set its display order. Removing it from New Arrivals does not delete it from the shop.",
  },
  {
    question: "Why is a connected device still visible?",
    answer:
      "Signed-in browsers send a presence update every minute. A closed browser can remain active for about 2.5 minutes, while an explicit sign-out removes that session immediately.",
  },
  {
    question: "How do I change my profile or cover photo?",
    answer:
      "Use the camera button on your profile photo or the three-dot menu for the cover. Adjust the image first, then use Save Changes and confirm before anything is uploaded.",
  },
];

export default function AdminHelpPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [search, setSearch] = useState("");
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);
  const filteredFaqs = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return faqs;
    return faqs.filter(({ question, answer }) =>
      `${question} ${answer}`.toLowerCase().includes(term),
    );
  }, [search]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setAllowed(false);
      return;
    }
    getIdTokenResult(user, true)
      .then((token) => setAllowed(token.claims.admin === true))
      .catch(() => setAllowed(false));
  }, [loading, user]);

  if (loading || allowed === null) {
    return <main className="min-h-screen animate-pulse bg-[#f4f1ea]" />;
  }

  if (!allowed) {
    return (
      <main className="min-h-screen bg-[#f4f1ea] pt-28 text-center">
        <h1 className="font-serif text-3xl">Administrator access required</h1>
        <Link href="/login" className="mt-5 inline-block underline">
          Sign in
        </Link>
      </main>
    );
  }

  return (
    <main className="bg-[#f4f1ea] px-5 py-8 text-forest-950 sm:px-8 lg:px-10">
      <div className="mx-auto w-full max-w-[1420px]">
        <header className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-[.24em] text-gold-600">
            Administration
          </p>
          <h1 className="mt-1 font-serif text-3xl">Help center</h1>
          <p className="mt-1 text-sm text-gray-500">
            Find answers and learn how to manage your Verde storefront.
          </p>
        </header>

        <section className="rounded-2xl bg-[#132018] px-5 py-8 text-center shadow-sm sm:px-10 sm:py-10">
          <HelpCircle className="mx-auto text-gold-400" size={30} />
          <h2 className="mt-3 font-serif text-2xl text-white sm:text-3xl">
            How can we help?
          </h2>
          <label className="relative mx-auto mt-5 block max-w-2xl text-left">
            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search help topics..."
              className="w-full rounded-xl border border-white/10 bg-white py-3.5 pl-12 pr-4 text-sm text-gray-800 outline-none ring-gold-400 transition placeholder:text-gray-400 focus:ring-2"
            />
          </label>
        </section>

        <section className="mt-6">
          <div className="mb-4 flex items-center gap-2">
            <BookOpen size={19} className="text-gold-600" />
            <h2 className="font-serif text-xl">Quick guides</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {guides.map(({ title, description, href, icon: Icon }) => (
              <button
                type="button"
                key={title}
                onClick={() => {
                  if (href === "/admin/products" || href === "/admin/orders" || href === "/admin/new-arrivals") {
                    if (window.matchMedia("(min-width: 768px)").matches) {
                      window.sessionStorage.setItem(
                        "verde-admin-tour",
                        href === "/admin/products" ? "products" : href === "/admin/orders" ? "orders" : "new-arrivals",
                      );
                    }
                  }
                  router.push(href);
                }}
                className="group rounded-2xl border border-[#ded8cb] bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-gold-400 hover:shadow-md"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-forest-50 text-forest-700 group-hover:bg-gold-100">
                  <Icon size={20} />
                </span>
                <h3 className="mt-4 font-semibold">{title}</h3>
                {(href === "/admin/products" || href === "/admin/orders" || href === "/admin/new-arrivals") && (
                  <span className="mt-2 inline-flex rounded-full bg-gold-100 px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-gold-700">
                    Desktop tutorial
                  </span>
                )}
                <p className="mt-1 text-xs leading-5 text-gray-500">
                  {description}
                </p>
              </button>
            ))}
          </div>
        </section>

        <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,.7fr)]">
          <section className="rounded-2xl border border-[#ded8cb] bg-white p-5 shadow-sm sm:p-7">
            <h2 className="font-serif text-xl">Frequently asked questions</h2>
            <p className="mt-1 text-xs text-gray-500">
              Common questions about managing the store.
            </p>
            <div className="mt-5 divide-y divide-[#e8e2d7]">
              {filteredFaqs.length ? (
                filteredFaqs.map(({ question, answer }) => {
                  const open = openQuestion === question;
                  return (
                    <div key={question}>
                      <button
                        type="button"
                        onClick={() => setOpenQuestion(open ? null : question)}
                        className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-semibold"
                        aria-expanded={open}
                      >
                        {question}
                        <ChevronDown
                          size={18}
                          className={`shrink-0 text-gray-400 transition ${open ? "rotate-180" : ""}`}
                        />
                      </button>
                      {open && (
                        <p className="max-w-3xl pb-5 pr-8 text-sm leading-6 text-gray-500">
                          {answer}
                        </p>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="py-10 text-center text-sm text-gray-500">
                  No help topics match “{search}”.
                </p>
              )}
            </div>
          </section>

          <aside className="h-fit rounded-2xl border border-[#ded8cb] bg-white p-6 shadow-sm">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-100 text-gold-700">
              <Mail size={22} />
            </span>
            <h2 className="mt-4 font-serif text-xl">Still need help?</h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              Contact support and include the page, order number, or product
              involved so the issue can be resolved faster.
            </p>
            <button
              type="button"
              disabled
              className="mt-5 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-forest-800 px-4 py-3 text-sm font-semibold text-white opacity-80"
            >
              <Mail size={17} /> Contact support
              <span className="rounded-full bg-gold-400/20 px-2 py-0.5 text-[9px] uppercase tracking-wider text-gold-300">
                Soon
              </span>
            </button>
          </aside>
        </div>
      </div>
    </main>
  );
}
