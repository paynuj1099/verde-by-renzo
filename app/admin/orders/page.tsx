"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  collection,
  collectionGroup,
  doc,
  getDocs,
  onSnapshot,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { getIdTokenResult } from "firebase/auth";
import { MapPin, PackageCheck, Search, Truck, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { firestore } from "@/lib/firebase";
import { getProductById, getProductImage } from "@/lib/productUtils";
import type { CartItem } from "@/context/CartContext";
import AdminPageSkeleton from "@/components/AdminPageSkeleton";

type Status =
  | "pre-order"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";
type Order = {
  id: string;
  userId: string;
  source: "account" | "guest";
  totalAmount: number;
  totalItems: number;
  status: Status;
  createdAt?: Timestamp;
  items?: CartItem[];
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  trackingNumber?: string;
  carrier?: string;
  trackingNote?: string;
};
const statuses: Status[] = [
  "pre-order",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];
const carriers = [
  "J&T Express",
  "LBC Express",
  "Ninja Van",
  "Flash Express",
  "2GO Express",
  "GoGo Xpress",
  "Entrego",
  "GrabExpress",
  "Lalamove",
  "PhilPost",
];
const badge: Record<Status, string> = {
  "pre-order": "bg-gold-50 text-gold-700",
  confirmed: "bg-blue-50 text-blue-700",
  processing: "bg-amber-50 text-amber-700",
  shipped: "bg-purple-50 text-purple-700",
  delivered: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-700",
};

export default function OrdersPage() {
  const { user, loading } = useAuth();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState("all");
  const [dragging, setDragging] = useState("");
  const [dragOver, setDragOver] = useState<Status | null>(null);
  const [details, setDetails] = useState<Order | null>(null);
  const [editing, setEditing] = useState<Order | null>(null);
  const [form, setForm] = useState({
    status: "pre-order" as Status,
    carrier: "",
    trackingNumber: "",
    trackingNote: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const key = (o: Order) => `${o.source}:${o.userId}:${o.id}`;
  const load = async () => {
    const [snap, guestSnap] = await Promise.all([
      getDocs(collectionGroup(firestore, "orders")),
      getDocs(collection(firestore, "guestOrders")),
    ]);
    setOrders(
      [
        ...snap.docs.map(
          (d) =>
            ({
              id: d.id,
              userId: d.ref.parent.parent?.id || "",
              ...d.data(),
              source: "account",
            }) as Order,
        ),
        ...guestSnap.docs.map(
          (d) =>
            ({ id: d.id, userId: "", ...d.data(), source: "guest" }) as Order,
        ),
      ].sort(
        (a, b) =>
          (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0),
      ),
    );
  };
  useEffect(() => {
    if (loading) return;
    if (!user) return setAllowed(false);
    let stopAccounts: (() => void) | undefined;
    let stopGuests: (() => void) | undefined;
    let accountOrders: Order[] = [];
    let guestOrders: Order[] = [];
    let cancelled = false;
    const syncOrders = () =>
      setOrders(
        [...accountOrders, ...guestOrders].sort(
          (a, b) =>
            (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0),
        ),
      );
    const handleListenerError = (error: Error) => {
      console.error(error);
      setMessage("Unable to sync orders from Firestore.");
    };
    getIdTokenResult(user, true)
      .then((t) => {
        if (cancelled) return;
        const ok = t.claims.admin === true;
        setAllowed(ok);
        if (!ok) return;
        stopAccounts = onSnapshot(
          collectionGroup(firestore, "orders"),
          (snapshot) => {
            accountOrders = snapshot.docs.map(
              (d) =>
                ({
                  id: d.id,
                  userId: d.ref.parent.parent?.id || "",
                  ...d.data(),
                  source: "account",
                }) as Order,
            );
            syncOrders();
          },
          handleListenerError,
        );
        stopGuests = onSnapshot(
          collection(firestore, "guestOrders"),
          (snapshot) => {
            guestOrders = snapshot.docs.map(
              (d) =>
                ({
                  id: d.id,
                  userId: "",
                  ...d.data(),
                  source: "guest",
                }) as Order,
            );
            syncOrders();
          },
          handleListenerError,
        );
      })
      .catch(() => setAllowed(false));
    return () => {
      cancelled = true;
      stopAccounts?.();
      stopGuests?.();
    };
  }, [user, loading]);
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(""), 2800);
    return () => clearTimeout(t);
  }, [message]);
  const matching = useMemo(
    () =>
      orders.filter((o) => {
        const matchesSearch =
          `${o.id} ${o.customer?.name || ""} ${o.customer?.email || ""} ${o.trackingNumber || ""}`
            .toLowerCase()
            .includes(search.toLowerCase());
        const created = o.createdAt?.toDate();
        const orderMonth = created
          ? `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, "0")}`
          : "";
        return matchesSearch && (month === "all" || orderMonth === month);
      }),
    [orders, search, month],
  );
  const monthOptions = useMemo(
    () =>
      Array.from(
        new Set(
          orders
            .map((o) => {
              const date = o.createdAt?.toDate();
              return date
                ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
                : "";
            })
            .filter(Boolean),
        ),
      )
        .sort()
        .reverse(),
    [orders],
  );
  const move = async (order: Order, status: Status) => {
    setDragging("");
    setDragOver(null);
    if (order.status === status) return;
    const old = order.status;
    setOrders((v) =>
      v.map((o) => (key(o) === key(order) ? { ...o, status } : o)),
    );
    try {
      await updateDoc(
        order.source === "guest"
          ? doc(firestore, "guestOrders", order.id)
          : doc(firestore, "users", order.userId, "orders", order.id),
        { status, trackingUpdatedAt: Timestamp.now() },
      );
      setMessage(`Order moved to ${status}.`);
    } catch (e) {
      console.error(e);
      setOrders((v) =>
        v.map((o) => (key(o) === key(order) ? { ...o, status: old } : o)),
      );
      setMessage("Unable to update order status.");
    }
  };
  const openEdit = (o: Order) => {
    setDetails(null);
    setEditing(o);
    setForm({
      status: o.status,
      carrier: o.carrier || "",
      trackingNumber: o.trackingNumber || "",
      trackingNote: o.trackingNote || "",
    });
  };
  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await updateDoc(
        editing.source === "guest"
          ? doc(firestore, "guestOrders", editing.id)
          : doc(firestore, "users", editing.userId, "orders", editing.id),
        { ...form, trackingUpdatedAt: Timestamp.now() },
      );
      await load();
      setEditing(null);
      setMessage("Order tracking updated.");
    } catch (e) {
      console.error(e);
      setMessage("Unable to update tracking.");
    } finally {
      setSaving(false);
    }
  };
  if (loading || allowed === null)
    return <AdminPageSkeleton variant="orders" />;
  if (!allowed)
    return (
      <main className="min-h-screen bg-[#f4f7f2] pt-24 text-center">
        Administrator access required.
      </main>
    );
  return (
    <main className="min-h-screen bg-[#f4f7f2] py-7">
      <div className="mx-auto max-w-[1280px] px-5 lg:px-8">
        <header className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-gold-600">
            Administration
          </p>
          <h1 className="font-serif text-3xl text-forest-950">
            Order Management
          </h1>
          <p className="text-sm text-gray-500">
            {orders.length} orders in Firestore
          </p>
        </header>
        {message && (
          <div className="mb-5 flex justify-between rounded-lg border bg-white px-4 py-3 text-sm">
            <span>{message}</span>
            <button onClick={() => setMessage("")}>
              <X size={17} />
            </button>
          </div>
        )}
        <section className="rounded-2xl border bg-white p-4 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
            <label className="relative block">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search order, customer, email, tracking..."
                className="w-full rounded-lg border py-2.5 pl-10 pr-3"
              />
            </label>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="rounded-lg border px-3 py-2.5"
            >
              <option value="all">All months</option>
              {monthOptions.map((value) => (
                <option key={value} value={value}>
                  {new Date(`${value}-01T00:00:00`).toLocaleDateString(
                    "en-PH",
                    { month: "long", year: "numeric" },
                  )}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-4 divide-y">
            {matching.map((o) => (
              <button
                key={key(o)}
                type="button"
                onClick={() => setDetails(o)}
                className="flex w-full flex-col gap-3 px-1 py-3 text-left transition hover:bg-forest-50 sm:flex-row sm:items-center sm:px-3"
              >
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-forest-50 text-forest-700">
                  <PackageCheck size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-semibold text-forest-950">
                      {o.customer?.name || "Customer"}
                    </p>
                    {o.source === "guest" && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-bold uppercase text-gray-500">
                        Guest
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${badge[o.status]}`}
                    >
                      {o.status}
                    </span>
                  </div>
                  <p className="truncate text-xs text-gray-500">
                    #{o.id.slice(0, 12).toUpperCase()} ·{" "}
                    {o.customer?.email || "No email"} ·{" "}
                    {o.createdAt?.toDate().toLocaleDateString("en-PH") ||
                      "Pending"}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-5 sm:justify-end">
                  <div className="text-right">
                    <p className="font-bold text-forest-800">
                      ₱{Number(o.totalAmount || 0).toLocaleString("en-PH")}
                    </p>
                    <p className="text-xs text-gray-500">
                      {o.totalItems || 0} items
                    </p>
                  </div>
                  {o.trackingNumber && (
                    <span className="hidden items-center gap-1 text-xs text-purple-600 md:flex">
                      <Truck size={13} />
                      {o.trackingNumber}
                    </span>
                  )}
                </div>
              </button>
            ))}
            {!matching.length && (
              <p className="py-12 text-center text-sm text-gray-500">
                No orders found for this month.
              </p>
            )}
          </div>
        </section>
        <section className="hidden rounded-2xl border bg-white p-4 sm:p-6">
          <label className="relative block max-w-2xl">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order, customer, email, tracking..."
              className="w-full rounded-lg border py-2.5 pl-10 pr-3"
            />
          </label>
          <p className="mt-3 text-xs text-gray-500">
            Drag orders between columns. Click any card for complete details.
          </p>
          <div className="mt-5 flex gap-4 overflow-x-auto pb-3">
            {statuses.map((status) => {
              const list = matching.filter((o) => o.status === status);
              return (
                <div
                  key={status}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(status);
                  }}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node))
                      setDragOver(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const o = orders.find(
                      (x) => key(x) === e.dataTransfer.getData("text/order"),
                    );
                    if (o) move(o, status);
                  }}
                  className={`min-h-[430px] w-[285px] flex-none rounded-xl border p-3 transition ${dragOver === status ? "border-forest-500 bg-forest-50 ring-2 ring-forest-100" : "bg-gray-50"}`}
                >
                  <div className="mb-3 flex justify-between">
                    <h2 className="text-sm font-bold capitalize text-forest-950">
                      {status}
                    </h2>
                    <span className="rounded-full bg-white px-2 py-1 text-xs text-gray-500">
                      {list.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {list.map((o) => (
                      <button
                        key={key(o)}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/order", key(o));
                          setDragging(key(o));
                        }}
                        onDragEnd={() => {
                          setDragging("");
                          setDragOver(null);
                        }}
                        onClick={() => setDetails(o)}
                        className={`w-full cursor-grab rounded-xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-forest-300 hover:shadow-md ${dragging === key(o) ? "opacity-40" : ""}`}
                      >
                        <div className="flex justify-between">
                          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-forest-50 text-forest-700">
                            <PackageCheck size={18} />
                          </span>
                          <span
                            className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase ${badge[status]}`}
                          >
                            {status}
                          </span>
                        </div>
                        <p className="mt-3 truncate font-semibold">
                          {o.customer?.name || "Customer"}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          #{o.id.slice(0, 8).toUpperCase()} ·{" "}
                          {o.createdAt?.toDate().toLocaleDateString("en-PH") ||
                            "Pending"}
                        </p>
                        <div className="mt-4 flex items-end justify-between border-t pt-3">
                          <div>
                            <p className="text-xs text-gray-500">
                              {o.totalItems || 0} items
                            </p>
                            {o.trackingNumber && (
                              <p className="mt-1 flex items-center gap-1 text-[10px] text-purple-600">
                                <Truck size={11} />
                                {o.trackingNumber}
                              </p>
                            )}
                          </div>
                          <b className="text-forest-800">
                            ₱
                            {Number(o.totalAmount || 0).toLocaleString("en-PH")}
                          </b>
                        </div>
                      </button>
                    ))}
                    {!list.length && (
                      <div className="rounded-xl border border-dashed p-6 text-center text-xs text-gray-400">
                        Drop an order here
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
      {details && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDetails(null);
          }}
        >
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-gold-600">
                  Order #{details.id.slice(0, 8).toUpperCase()}
                </p>
                <h2 className="font-serif text-2xl">
                  {details.customer?.name || "Customer order"}
                </h2>
                <span
                  className={`mt-2 inline-block rounded-full px-2 py-1 text-[10px] font-bold uppercase ${badge[details.status]}`}
                >
                  {details.status}
                </span>
              </div>
              <button onClick={() => setDetails(null)}>
                <X />
              </button>
            </div>
            <div className="mt-6 grid gap-6 md:grid-cols-[1fr_280px]">
              <div className="space-y-3">
                {(details.items || []).map((item) => {
                  const p = getProductById(item.id),
                    src = p ? getProductImage(p, item.color) : "";
                  return (
                    <div
                      key={`${item.id}-${item.color}-${item.size || ""}`}
                      className="flex gap-3 rounded-xl bg-gray-50 p-3"
                    >
                      {src ? (
                        <div className="relative h-16 w-16 flex-none overflow-hidden rounded-lg">
                          <Image
                            src={src}
                            alt={p?.name || "Product"}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-16 w-16 rounded-lg bg-gray-100" />
                      )}
                      <div>
                        <p className="text-sm font-semibold">
                          {p?.name || `Product #${item.id}`}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.color}
                          {item.size ? ` · ${item.size}` : ""} · Qty{" "}
                          {item.quantity}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <aside className="space-y-2 text-sm text-gray-600">
                <b className="text-gray-900">Delivery information</b>
                <p>{details.customer?.email || "No email"}</p>
                <p>{details.customer?.phone || "No phone"}</p>
                <p className="flex gap-2">
                  <MapPin size={15} />
                  {details.customer?.address || "No address"}
                </p>
                <div className="mt-4 rounded-xl border p-4">
                  <p className="text-xs uppercase text-gray-400">Tracking</p>
                  <b className="text-forest-800">
                    {details.trackingNumber
                      ? `${details.carrier || "Carrier"} · ${details.trackingNumber}`
                      : "Not added yet"}
                  </b>
                  {details.trackingNote && (
                    <p className="mt-2 text-xs">{details.trackingNote}</p>
                  )}
                </div>
                <p className="pt-2 text-lg font-bold text-forest-900">
                  Total: ₱
                  {Number(details.totalAmount || 0).toLocaleString("en-PH")}
                </p>
              </aside>
            </div>
            <div className="mt-6 flex justify-end gap-3 border-t pt-5">
              <button
                onClick={() => setDetails(null)}
                className="rounded-lg border px-5 py-2.5 font-semibold"
              >
                Close
              </button>
              <button
                onClick={() => openEdit(details)}
                className="flex items-center gap-2 rounded-lg bg-forest-700 px-5 py-2.5 font-semibold text-white"
              >
                <Truck size={17} />
                Manage tracking
              </button>
            </div>
          </div>
        </div>
      )}
      {editing && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6">
            <div className="flex justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-gold-600">
                  Order #{editing.id.slice(0, 8).toUpperCase()}
                </p>
                <h2 className="font-serif text-2xl">Tracking details</h2>
              </div>
              <button onClick={() => setEditing(null)}>
                <X />
              </button>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Status
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as Status })
                  }
                  className="mt-1 w-full rounded-lg border p-3 capitalize"
                >
                  {statuses.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium">
                Carrier
                <select
                  value={form.carrier}
                  onChange={(e) =>
                    setForm({ ...form, carrier: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border p-3"
                >
                  <option value="">Select carrier</option>
                  {form.carrier && !carriers.includes(form.carrier) && (
                    <option value={form.carrier}>{form.carrier}</option>
                  )}
                  {carriers.map((carrier) => (
                    <option key={carrier} value={carrier}>
                      {carrier}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium sm:col-span-2">
                Tracking number
                <input
                  value={form.trackingNumber}
                  onChange={(e) =>
                    setForm({ ...form, trackingNumber: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border p-3"
                />
              </label>
              <label className="text-sm font-medium sm:col-span-2">
                Customer update
                <textarea
                  value={form.trackingNote}
                  onChange={(e) =>
                    setForm({ ...form, trackingNote: e.target.value })
                  }
                  rows={3}
                  className="mt-1 w-full rounded-lg border p-3"
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setEditing(null)}
                disabled={saving}
                className="rounded-lg border px-5 py-3 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="rounded-lg bg-forest-700 px-5 py-3 font-semibold text-white disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save tracking"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
