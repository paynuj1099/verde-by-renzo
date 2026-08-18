"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getIdTokenResult } from "firebase/auth";
import {
  collection,
  collectionGroup,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import {
  BarChart3,
  Bell,
  Boxes,
  ChevronDown,
  CircleDollarSign,
  LogOut,
  Search,
  ShoppingCart,
  Store,
  User,
  Users,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import AdminDashboardSkeleton from "@/components/AdminDashboardSkeleton";
import { firestore } from "@/lib/firebase";

type OrderNotification = {
  id: string;
  source: "account" | "guest";
  customerName: string;
  status: string;
  totalAmount: number;
  createdAt?: Timestamp;
};

const metricCards = [
  {
    label: "Total Sales",
    value: "₱184,520",
    change: "+3.34%",
    icon: CircleDollarSign,
    accent: true,
  },
  {
    label: "Total Orders",
    value: "1,248",
    change: "+5.12%",
    icon: ShoppingCart,
  },
  { label: "Total Visitors", value: "18,760", change: "+8.02%", icon: Users },
];
const chartPoints =
  "0,125 65,98 130,110 195,73 260,82 325,42 390,68 455,61 520,96 585,53 650,72";
const chartPointsTwo =
  "0,155 65,180 130,143 195,164 260,142 325,105 390,150 455,137 520,176 585,145 650,165";

export default function AdminDashboardPage() {
  const { user, loading, logout } = useAuth();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [newOrderAlerts, setNewOrderAlerts] = useState(true);
  const [statusAlerts, setStatusAlerts] = useState(true);
  const accountNotificationsRef = useRef<OrderNotification[]>([]);
  const guestNotificationsRef = useRef<OrderNotification[]>([]);
  const accountListenerReadyRef = useRef(false);
  const guestListenerReadyRef = useRef(false);
  const alertedNotificationKeysRef = useRef(new Set<string>());

  useEffect(() => {
    if (loading) return;
    if (!user) return setAllowed(false);
    getIdTokenResult(user, true)
      .then((token) => setAllowed(token.claims.admin === true))
      .catch(() => setAllowed(false));
  }, [user, loading]);

  useEffect(() => {
    if (!allowed || !user) return;
    return onSnapshot(
      doc(firestore, "users", user.uid, "settings", "notifications"),
      (snapshot) => {
        const preferences = snapshot.data();
        setNewOrderAlerts(preferences?.newOrderAlerts !== false);
        setStatusAlerts(preferences?.statusAlerts !== false);
        const seenKeys = Array.isArray(preferences?.seenNotificationKeys)
          ? preferences.seenNotificationKeys.filter(
              (key): key is string => typeof key === "string",
            )
          : [];
        alertedNotificationKeysRef.current = new Set(seenKeys);
      },
      (error) =>
        console.error("Unable to load notification preferences:", error),
    );
  }, [allowed, user]);

  useEffect(() => {
    if (!allowed) return;

    const syncNotifications = () => {
      setNotifications(
        [...accountNotificationsRef.current, ...guestNotificationsRef.current]
          .sort(
            (a, b) =>
              (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0),
          )
          .slice(0, 8),
      );
    };

    const stopAccounts = onSnapshot(
      collectionGroup(firestore, "orders"),
      (snapshot) => {
        if (accountListenerReadyRef.current) {
          const changes = snapshot.docChanges();
          const alertCount = changes.filter((change) => {
            if (
              (change.type === "added" && !newOrderAlerts) ||
              (change.type === "modified" && !statusAlerts) ||
              change.type === "removed"
            )
              return false;
            const key = `account:${change.doc.id}:${change.doc.data().status || "pre-order"}`;
            if (alertedNotificationKeysRef.current.has(key)) return false;
            alertedNotificationKeysRef.current.add(key);
            return true;
          }).length;
          if (alertCount) setUnreadCount((count) => count + alertCount);
        }
        accountNotificationsRef.current = snapshot.docs.map((order) => ({
          id: order.id,
          source: "account" as const,
          customerName: order.data().customer?.name || "Customer",
          status: order.data().status || "pre-order",
          totalAmount: Number(order.data().totalAmount || 0),
          createdAt: order.data().createdAt,
        }));
        accountListenerReadyRef.current = true;
        syncNotifications();
      },
    );

    const stopGuests = onSnapshot(
      collection(firestore, "guestOrders"),
      (snapshot) => {
        if (guestListenerReadyRef.current) {
          const changes = snapshot.docChanges();
          const alertCount = changes.filter((change) => {
            if (
              (change.type === "added" && !newOrderAlerts) ||
              (change.type === "modified" && !statusAlerts) ||
              change.type === "removed"
            )
              return false;
            const key = `guest:${change.doc.id}:${change.doc.data().status || "pre-order"}`;
            if (alertedNotificationKeysRef.current.has(key)) return false;
            alertedNotificationKeysRef.current.add(key);
            return true;
          }).length;
          if (alertCount) setUnreadCount((count) => count + alertCount);
        }
        guestNotificationsRef.current = snapshot.docs.map((order) => ({
          id: order.id,
          source: "guest" as const,
          customerName: order.data().customer?.name || "Guest customer",
          status: order.data().status || "pre-order",
          totalAmount: Number(order.data().totalAmount || 0),
          createdAt: order.data().createdAt,
        }));
        guestListenerReadyRef.current = true;
        syncNotifications();
      },
    );

    return () => {
      stopAccounts();
      stopGuests();
      accountListenerReadyRef.current = false;
      guestListenerReadyRef.current = false;
    };
  }, [allowed, newOrderAlerts, statusAlerts]);

  const toggleNotifications = async () => {
    setNotificationsOpen((open) => !open);
    setProfileOpen(false);
    setUnreadCount(0);
    if (!user) return;
    const currentKeys = notifications.map(
      (notification) =>
        `${notification.source}:${notification.id}:${notification.status}`,
    );
    currentKeys.forEach((key) => alertedNotificationKeysRef.current.add(key));
    try {
      await setDoc(
        doc(firestore, "users", user.uid, "settings", "notifications"),
        {
          seenNotificationKeys: Array.from(
            alertedNotificationKeysRef.current,
          ).slice(-100),
          notificationsReadAt: serverTimestamp(),
        },
        { merge: true },
      );
    } catch (error) {
      console.error("Unable to mark notifications as read:", error);
    }
  };

  const toggleProfile = () => {
    setProfileOpen((open) => !open);
    setNotificationsOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    window.location.assign("/");
  };

  if (loading || allowed === null) return <AdminDashboardSkeleton />;
  if (!allowed)
    return (
      <main className="min-h-screen bg-[#f4f0e7] pt-36 text-center">
        <h1 className="font-serif text-3xl text-forest-800">
          Administrator access required
        </h1>
        <Link
          href="/login"
          className="mt-5 inline-block text-forest-600 underline"
        >
          Sign in
        </Link>
      </main>
    );

  return (
    <main className="min-h-screen bg-[#f2f6f0] xl:h-screen xl:min-h-0 xl:overflow-hidden">
      <section className="admin-dashboard mx-auto flex w-full max-w-[1480px] flex-col px-5 py-4 sm:py-6 lg:px-8 lg:py-8 xl:h-full xl:min-h-0">
        <header className="mb-4 flex flex-wrap items-center gap-3 xl:mb-3 xl:flex-none">
          <div className="mr-auto">
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-gold-600">
              Administration
            </p>
            <h1 className="font-serif text-2xl text-forest-950 xl:text-[1.7rem]">Dashboard</h1>
          </div>
          <label className="relative hidden w-full max-w-xs md:block">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              placeholder="Search stock, orders, etc."
              className="w-full rounded-xl border-0 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm outline-none ring-1 ring-gray-100 focus:ring-forest-300"
            />
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={toggleNotifications}
              className="relative rounded-xl bg-white p-2.5 text-gray-500 shadow-sm"
              aria-label="Open order notifications"
              aria-expanded={notificationsOpen}
            >
              <Bell size={19} />
              {unreadCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-gold-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
            {notificationsOpen && (
              <div className="fixed inset-x-4 top-36 z-[950] overflow-hidden rounded-2xl border border-forest-100 bg-white shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-[calc(100%+10px)] sm:z-50 sm:w-[min(22rem,calc(100vw-2.5rem))]">
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                  <div>
                    <p className="font-semibold text-forest-950">
                      Order notifications
                    </p>
                    <p className="text-[10px] text-emerald-600">
                      Live updates enabled
                    </p>
                  </div>
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                </div>
                <div className="max-h-[calc(100vh-14rem)] overflow-y-auto sm:max-h-80">
                  {notifications.length ? (
                    notifications.map((notification, index) => (
                      <Link
                        key={`${notification.source}:${notification.id}`}
                        href="/admin/orders"
                        onClick={() => setNotificationsOpen(false)}
                        className={`${index >= 5 ? "hidden sm:block" : "block"} border-b border-gray-50 px-4 py-3 transition hover:bg-forest-50`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-forest-900">
                              {notification.customerName}
                            </p>
                            <p className="mt-0.5 text-xs capitalize text-gray-500">
                              Order #{notification.id.slice(0, 8).toUpperCase()}{" "}
                              · {notification.status.replace("-", " ")}
                            </p>
                          </div>
                          <strong className="shrink-0 text-xs text-forest-700">
                            ₱{notification.totalAmount.toLocaleString("en-PH")}
                          </strong>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <p className="px-4 py-8 text-center text-sm text-gray-400">
                      No orders yet.
                    </p>
                  )}
                </div>
                <Link
                  href="/admin/orders"
                  onClick={() => setNotificationsOpen(false)}
                  className="block bg-[#111914] px-4 py-3 text-center text-xs font-semibold text-white transition hover:bg-[#243229]"
                >
                  View all orders
                </Link>
              </div>
            )}
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={toggleProfile}
              className="flex items-center gap-3 rounded-xl bg-white p-1.5 pr-3 text-left shadow-sm transition hover:bg-forest-50"
              aria-label="Open administrator profile menu"
              aria-expanded={profileOpen}
            >
              {user?.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt={user.displayName || "Administrator"}
                  width={36}
                  height={36}
                  className="h-9 w-9 rounded-lg object-cover"
                />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-forest-100 font-semibold text-forest-700">
                  {(user?.displayName || "A")[0]}
                </span>
              )}
              <span className="hidden sm:block">
                <span className="block max-w-32 truncate text-sm font-semibold">
                  {user?.displayName || "Administrator"}
                </span>
                <span className="block text-[10px] text-gray-400">Admin</span>
              </span>
              <ChevronDown
                size={15}
                className={`transition-transform ${profileOpen ? "rotate-180" : ""}`}
              />
            </button>
            {profileOpen && (
              <div className="absolute right-0 z-50 mt-3 w-64 rounded-xl border border-gray-100 bg-white p-3 text-gray-700 shadow-xl">
                <p className="truncate font-semibold text-forest-800">
                  {user?.displayName || "Verde customer"}
                </p>
                <p className="mb-3 truncate text-xs text-gray-500">
                  {user?.email}
                </p>
                <Link
                  href="/admin/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-forest-50"
                >
                  <User size={16} /> My Profile
                </Link>
                <Link
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-forest-700 hover:bg-forest-50"
                >
                  <Store size={16} /> View Storefront
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut size={16} /> Sign out
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="grid gap-3 md:grid-cols-3 xl:flex-none">
          {metricCards.map(({ label, value, change, icon: Icon, accent }) => (
            <article
              key={label}
              className={`rounded-2xl border border-forest-100 p-4 ${accent ? "bg-forest-700 text-white" : "bg-gradient-to-br from-white to-forest-50"} shadow-sm`}
            >
              <div className="mb-3 flex items-center justify-between">
                <p
                  className={`text-sm ${accent ? "text-forest-100" : "text-gray-500"}`}
                >
                  {label}
                </p>
                <span
                  className={`rounded-lg p-2 ${accent ? "bg-white/15 text-gold-300" : "bg-forest-100 text-forest-700"}`}
                >
                  <Icon size={19} />
                </span>
              </div>
              <div className="flex items-end justify-between">
                <strong
                  className={`text-2xl xl:text-[1.65rem] ${accent ? "text-white" : "text-forest-950"}`}
                >
                  {value}
                </strong>
                <span
                  className={`text-xs font-semibold ${accent ? "text-gold-300" : "text-emerald-600"}`}
                >
                  {change}
                </span>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-3 grid gap-3 xl:mt-2 xl:min-h-0 xl:flex-[1.18] xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,.8fr)]">
          <article className="min-h-0 rounded-2xl bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="font-serif text-xl text-forest-950">
                  Revenue Analytics
                </h2>
                <div className="mt-2 flex gap-4 text-xs text-gray-400">
                  <span>— Revenue</span>
                  <span>-- Orders</span>
                </div>
              </div>
              <button className="rounded-lg bg-forest-700 px-3 py-2 text-xs text-white">
                Last 8 Days
              </button>
            </div>
            <div className="relative h-48 overflow-hidden xl:h-[calc(100%-3.5rem)] xl:min-h-[150px]">
              <div className="absolute inset-0 flex flex-col justify-between py-2">
                {[16, 12, 8, 4, 0].map((item) => (
                  <div
                    key={item}
                    className="border-t border-dashed border-gray-100 text-[10px] text-gray-300"
                  >
                    {item}K
                  </div>
                ))}
              </div>
              <svg
                viewBox="0 0 650 210"
                preserveAspectRatio="none"
                className="absolute inset-0 h-full w-full"
              >
                <polyline
                  points={chartPoints}
                  fill="none"
                  stroke="#214f19"
                  strokeWidth="4"
                />
                <polyline
                  points={chartPointsTwo}
                  fill="none"
                  stroke="#c89c4a"
                  strokeWidth="3"
                  strokeDasharray="8 8"
                />
              </svg>
            </div>
          </article>
          <article className="min-h-0 rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="font-serif text-xl text-forest-950">
              Monthly Target
            </h2>
            <div className="relative mx-auto mt-3 h-36 w-36 2xl:h-40 2xl:w-40">
              <svg
                viewBox="0 0 120 120"
                className="h-full w-full -rotate-90"
                aria-label="85 percent monthly target"
              >
                <circle
                  cx="60"
                  cy="60"
                  r="47"
                  fill="none"
                  stroke="#eadfc8"
                  strokeWidth="14"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="47"
                  fill="none"
                  stroke="#214f19"
                  strokeWidth="14"
                  strokeLinecap="round"
                  pathLength="100"
                  strokeDasharray="85 15"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <strong className="text-3xl text-forest-950">85%</strong>
                <p className="mt-1 text-[11px] text-emerald-600">
                  +8.02% from last month
                </p>
              </div>
            </div>
            <p className="mt-1 text-center text-sm font-semibold">Great progress!</p>
            <p className="mx-auto mt-1 max-w-xs text-center text-[11px] leading-4 text-gray-400">
              This sample target will be connected to real order data later.
            </p>
            <div className="mt-3 grid grid-cols-2 divide-x rounded-xl bg-[#f5eddf] p-2.5 text-center text-xs">
              <div>
                <p className="text-gray-400">Target</p>
                <strong>₱200,000</strong>
              </div>
              <div>
                <p className="text-gray-400">Revenue</p>
                <strong>₱170,000</strong>
              </div>
            </div>
          </article>
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-[.8fr_1.5fr_1fr] xl:mt-2 xl:min-h-0 xl:flex-1">
          <article className="min-h-0 overflow-hidden rounded-2xl bg-white p-4 shadow-sm">
            <div className="mb-3 flex justify-between">
              <h2 className="font-serif text-xl">Active Users</h2>
              <Users size={19} className="text-gray-400" />
            </div>
            <strong className="text-2xl text-forest-950">2,758</strong>
            <p className="text-xs text-gray-400">sample users</p>
            <div className="mt-3 space-y-2.5">
              {[
                ["Philippines", "48%"],
                ["United States", "24%"],
                ["Singapore", "17%"],
                ["Other", "11%"],
              ].map(([country, value]) => (
                <div key={country}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-gray-500">{country}</span>
                    <strong>{value}</strong>
                  </div>
                  <div className="h-2 rounded-full bg-[#eee5d5]">
                    <div
                      className="h-full rounded-full bg-gold-500"
                      style={{ width: value }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </article>
          <article className="min-h-0 overflow-hidden rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl">Conversion Rate</h2>
              <BarChart3 className="text-gray-400" size={19} />
            </div>
            <div className="mt-4 flex h-[calc(100%-3rem)] min-h-[140px] items-end gap-3 border-b border-gray-100">
              {[
                ["Views", "100%"],
                ["Cart", "62%"],
                ["Checkout", "41%"],
                ["Purchase", "27%"],
                ["Abandoned", "15%"],
              ].map(([label, height], index) => (
                <div
                  key={label}
                  className="flex h-full flex-1 flex-col justify-end"
                >
                  <div
                    className="rounded-t-xl bg-forest-700/90"
                    style={{ height, opacity: 1 - index * 0.12 }}
                  />
                  <p className="mt-2 truncate text-center text-[10px] text-gray-400">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </article>
          <article className="min-h-0 overflow-hidden rounded-2xl bg-white p-4 shadow-sm">
            <div className="mb-3 flex justify-between">
              <h2 className="font-serif text-xl">Top Categories</h2>
              <Boxes className="text-gray-400" size={19} />
            </div>
            <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-[conic-gradient(#214f19_0_42%,#c89c4a_42%_72%,#dfcfad_72%_100%)] 2xl:h-32 2xl:w-32">
              <div className="flex h-16 w-16 flex-col items-center justify-center rounded-full bg-white 2xl:h-20 2xl:w-20">
                <span className="text-xs text-gray-400">Sales</span>
                <strong className="text-xl">100%</strong>
              </div>
            </div>
            <div className="mt-3 space-y-2 text-xs">
              {[
                ["Apparel", "42%"],
                ["Accessories", "30%"],
                ["Bags", "28%"],
              ].map(([name, value], index) => (
                <div key={name} className="flex items-center">
                  <span
                    className={`mr-2 h-2 w-2 rounded-sm ${index === 0 ? "bg-forest-700" : index === 1 ? "bg-gold-500" : "bg-[#dfcfad]"}`}
                  />
                  <span className="text-gray-500">{name}</span>
                  <strong className="ml-auto">{value}</strong>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
