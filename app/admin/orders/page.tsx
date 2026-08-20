"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  collection,
  collectionGroup,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { getIdTokenResult } from "firebase/auth";
import {
  CreditCard,
  MapPin,
  PackageCheck,
  Plus,
  Search,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useProducts } from "@/context/ProductContext";
import { firestore } from "@/lib/firebase";
import { getProductById, getProductImage } from "@/lib/productUtils";
import type { CartItem } from "@/context/CartContext";
import AdminPageSkeleton from "@/components/AdminPageSkeleton";
import AdminToast from "@/components/AdminToast";
import AdminConfirmModal from "@/components/AdminConfirmModal";
import AdminSelect from "@/components/AdminSelect";

type Status =
  | "pre-order"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";
type Order = {
  id: string;
  reference?: string;
  userId: string;
  source: "account" | "guest";
  totalAmount: number;
  totalItems: number;
  status: Status;
  createdAt?: Timestamp;
  paidAt?: Timestamp;
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

  // Payment details saved after a successful PayMongo payment.
  subtotalAmount?: number;
  discountAmount?: number;
  couponCode?: string | null;
  couponType?: "percentage" | "fixed" | null;
  couponValue?: number | null;
  amountInCentavos?: number;
  currency?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  paymongoPaymentIntentId?: string | null;
  paymongoPaymentId?: string | null;
  paymongoPaymentStatus?: string | null;
  paymongoPaymentSource?: string | null;
  paymongoFee?: number | null;
  paymongoNetAmount?: number | null;
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
  "pre-order": "bg-[#f1e4c8] text-[#6a4d18] ring-1 ring-inset ring-[#d2ad63]",
  confirmed: "bg-[#dfe8df] text-[#24452c] ring-1 ring-inset ring-[#aebfae]",
  processing: "bg-[#c59b4d] text-[#171d18] ring-1 ring-inset ring-[#a77d31]",
  shipped: "bg-[#2d3931] text-[#f4eee2] ring-1 ring-inset ring-[#1c2821]",
  delivered: "bg-[#173d25] text-[#f7f2e8] ring-1 ring-inset ring-[#0f2c19]",
  cancelled: "bg-[#672f32] text-[#f8edeb] ring-1 ring-inset ring-[#4b2023]",
};
const getCurrentMonthValue = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const getOrderReference = (order: Order) => order.reference || order.id;

const formatPaymentSource = (value?: string | null) => {
  if (!value) return "Not recorded";

  const normalized = value.toLowerCase();

  if (normalized === "qrph") return "QR Ph";
  if (normalized === "paymaya" || normalized === "maya") return "Maya";
  if (normalized === "gcash") return "GCash";

  return value
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const formatCentavos = (value?: number | null) => {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return null;
  }

  return (Number(value) / 100).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export default function OrdersPage() {
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const { products } = useProducts();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState(getCurrentMonthValue);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const statusParam = searchParams.get("status")?.trim().toLowerCase();
    const monthParam = searchParams.get("month")?.trim();

    if (statusParam && statuses.includes(statusParam as Status)) {
      setStatusFilter(statusParam);
    } else {
      setStatusFilter("all");
    }

    if (monthParam === "all") {
      setMonth("all");
    } else if (monthParam && /^\d{4}-(0[1-9]|1[0-2])$/.test(monthParam)) {
      setMonth(monthParam);
    } else if (statusParam) {
      // A dashboard status link without a month should show that status
      // across all months instead of silently limiting it to the current month.
      setMonth("all");
    } else {
      setMonth(getCurrentMonthValue());
    }

    setPage(1);
    setSelectedOrderKeys([]);
  }, [searchParams]);
  const [dragging, setDragging] = useState("");
  const [dragOver, setDragOver] = useState<Status | null>(null);
  const [details, setDetails] = useState<Order | null>(null);
  const [editing, setEditing] = useState<Order | null>(null);
  const [selectedOrderKeys, setSelectedOrderKeys] = useState<string[]>([]);
  const [bulkEditing, setBulkEditing] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualCustomer, setManualCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [manualItems, setManualItems] = useState<CartItem[]>([]);
  const [manualStatus, setManualStatus] = useState<Status>("pre-order");
  const [confirmManualOrder, setConfirmManualOrder] = useState(false);
  const [confirmTrackingSave, setConfirmTrackingSave] = useState(false);
  const [trackingNumberError, setTrackingNumberError] = useState("");
  const [editModalPosition, setEditModalPosition] = useState({ x: 0, y: 0 });
  const editModalRef = useRef<HTMLDivElement>(null);
  const editModalDragRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  } | null>(null);
  const [form, setForm] = useState({
    status: "pre-order" as Status,
    carrier: "",
    trackingNumber: "",
    trackingNote: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [liveNotification, setLiveNotification] = useState("");
  const previousOrdersRef = useRef<Order[]>([]);
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
  useEffect(() => {
    if (!orders.length) return;

    const previous = previousOrdersRef.current;
    const newest = orders[0];
    const newestLabel = newest.customer?.name || "Guest customer";
    const newestAmount = Number(newest.totalAmount || 0).toLocaleString(
      "en-PH",
    );

    previousOrdersRef.current = orders;

    if (!previous.length) return;
    const previousLatest = previous[0];
    const didChange =
      previousLatest.id !== newest.id ||
      previousLatest.status !== newest.status;

    if (!didChange) return;

    const statusText =
      newest.status === "cancelled"
        ? "cancelled"
        : newest.status === "delivered"
          ? "delivered"
          : newest.status === "shipped"
            ? "shipped"
            : "updated";
    setLiveNotification(
      `${newestLabel} • order #${getOrderReference(newest).toUpperCase()} • ${statusText} • ₱${newestAmount}`,
    );
  }, [orders]);
  useEffect(() => {
    if (!liveNotification) return;
    const t = setTimeout(() => setLiveNotification(""), 5000);
    return () => clearTimeout(t);
  }, [liveNotification]);
  const activeToast = liveNotification || message;
  const activeToastTone = liveNotification
    ? "success"
    : message.includes("Unable") ||
        message.includes("failed") ||
        message.includes("error")
      ? "error"
      : "success";

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
        const matchesStatus =
          statusFilter === "all" || o.status === statusFilter;
        return (
          matchesSearch &&
          matchesStatus &&
          (month === "all" || orderMonth === month)
        );
      }),
    [orders, search, month, statusFilter],
  );
  const pageSize = 8;
  const pageCount = Math.max(1, Math.ceil(matching.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleOrders = matching.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const monthOptions = useMemo(
    () =>
      Array.from(
        new Set(
          [
            getCurrentMonthValue(),
            ...orders.map((o) => {
              const date = o.createdAt?.toDate();
              return date
                ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
                : "";
            }),
          ].filter(Boolean),
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
    setBulkEditing(false);
    setTrackingNumberError("");
    setEditModalPosition({ x: 0, y: 0 });
    setEditing(o);
    setForm({
      status: o.status,
      carrier: o.carrier || "",
      trackingNumber: o.trackingNumber || "",
      trackingNote: o.trackingNote || "",
    });
  };
  const openBulkEdit = () => {
    const selectedOrders = orders.filter((order) =>
      selectedOrderKeys.includes(key(order)),
    );
    if (!selectedOrders.length) return;
    const first = selectedOrders[0];
    setBulkEditing(true);
    setTrackingNumberError("");
    setEditModalPosition({ x: 0, y: 0 });
    setEditing(first);
    setForm({
      status: first.status,
      carrier: first.carrier || "",
      trackingNumber: first.trackingNumber || "",
      trackingNote: first.trackingNote || "",
    });
  };
  const startEditModalDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (
      window.innerWidth < 640 ||
      event.button !== 0 ||
      (event.target as HTMLElement).closest("button, input, select, textarea")
    )
      return;
    const modal = editModalRef.current;
    if (!modal) return;
    const bounds = modal.getBoundingClientRect();
    editModalDragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: editModalPosition.x,
      originY: editModalPosition.y,
      minX: editModalPosition.x - bounds.left,
      maxX: editModalPosition.x + window.innerWidth - bounds.right,
      minY: editModalPosition.y - bounds.top,
      maxY: editModalPosition.y + window.innerHeight - bounds.bottom,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const dragEditModal = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = editModalDragRef.current;
    if (!drag) return;
    setEditModalPosition({
      x: Math.min(
        drag.maxX,
        Math.max(drag.minX, drag.originX + event.clientX - drag.startX),
      ),
      y: Math.min(
        drag.maxY,
        Math.max(drag.minY, drag.originY + event.clientY - drag.startY),
      ),
    });
  };
  const stopEditModalDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    editModalDragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const save = async () => {
    if (!editing) return;
    if (!form.trackingNumber.trim()) {
      setConfirmTrackingSave(false);
      setTrackingNumberError("Tracking number is required.");
      return;
    }
    setSaving(true);
    try {
      const targets = bulkEditing
        ? orders.filter((order) => selectedOrderKeys.includes(key(order)))
        : [editing];
      await Promise.all(
        targets.map((order) =>
          updateDoc(
            order.source === "guest"
              ? doc(firestore, "guestOrders", order.id)
              : doc(firestore, "users", order.userId, "orders", order.id),
            { ...form, trackingUpdatedAt: Timestamp.now() },
          ),
        ),
      );
      await load();
      setConfirmTrackingSave(false);
      setEditing(null);
      setBulkEditing(false);
      setSelectedOrderKeys([]);
      setMessage(
        targets.length > 1
          ? `${targets.length} orders updated.`
          : "Order tracking updated.",
      );
    } catch (e) {
      console.error(e);
      setMessage("Unable to update tracking.");
    } finally {
      setSaving(false);
    }
  };
  const requestTrackingSave = () => {
    if (!form.trackingNumber.trim()) {
      setTrackingNumberError("Tracking number is required.");
      return;
    }
    setTrackingNumberError("");
    setConfirmTrackingSave(true);
  };
  const addManualItem = () => {
    const product = products[0];
    if (!product) return;
    setManualItems((items) => [
      ...items,
      {
        id: product.id,
        color: product.colors[0] || "default",
        quantity: 1,
      },
    ]);
  };
  const manualTotal = manualItems.reduce((total, item) => {
    const product = products.find((entry) => entry.id === item.id);
    return total + Number(product?.price || 0) * item.quantity;
  }, 0);
  const requestManualOrderSave = (event: React.FormEvent) => {
    event.preventDefault();
    if (!manualItems.length) {
      setMessage("Add at least one product to the order.");
      return;
    }
    setConfirmManualOrder(true);
  };
  const saveManualOrder = async () => {
    setSaving(true);
    try {
      const reference = `VBR-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
      await setDoc(doc(firestore, "guestOrders", reference), {
        reference,
        customer: manualCustomer,
        items: manualItems,
        totalItems: manualItems.reduce(
          (total, item) => total + item.quantity,
          0,
        ),
        totalAmount: manualTotal,
        status: manualStatus,
        createdAt: serverTimestamp(),
        createdByAdmin: true,
      });
      setConfirmManualOrder(false);
      setManualOpen(false);
      setManualCustomer({ name: "", email: "", phone: "", address: "" });
      setManualItems([]);
      setManualStatus("pre-order");
      setMessage(`Manual order ${reference} created.`);
    } catch (error) {
      console.error(error);
      setMessage("Unable to create manual order.");
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
    <main className="min-h-screen bg-[#f4f7f2] py-6 sm:py-8">
      <div className="mx-auto w-full max-w-[1480px] px-5 lg:px-8">
        <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-gold-600">
              Administration
            </p>
            <h1 className="font-serif text-3xl text-forest-950">
              Order Management
            </h1>
            <p className="text-sm text-gray-500">
              {orders.length} orders in Firestore
            </p>
          </div>
          <button
            data-tour="add-order"
            type="button"
            onClick={() => setManualOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-forest-700 px-5 py-3 font-semibold text-white hover:bg-forest-800"
          >
            <Plus size={18} /> Add Order
          </button>
        </header>
        <AdminToast
          message={activeToast}
          onDismiss={() => {
            setLiveNotification("");
            setMessage("");
          }}
          tone={activeToastTone}
        />
        <section className="rounded-2xl border bg-white p-4 sm:p-5">
          <div data-tour="order-filters" className="grid gap-3 sm:grid-cols-[1fr_220px_220px]">
            <label className="relative block">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search order, customer, email, tracking..."
                className="w-full rounded-lg border py-2.5 pl-10 pr-3"
              />
            </label>
            <AdminSelect
              value={month}
              onChange={(value) => {
                setMonth(value);
                setPage(1);
              }}
              ariaLabel="Filter orders by month"
              options={[
                { value: "all", label: "All months" },
                ...monthOptions.map((value) => ({
                  value,
                  label: new Date(`${value}-01T00:00:00`).toLocaleDateString(
                    "en-PH",
                    { month: "long", year: "numeric" },
                  ),
                })),
              ]}
            />
            <AdminSelect
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
              ariaLabel="Filter orders by status"
              options={[
                { value: "all", label: "All statuses" },
                ...statuses.map((value) => ({
                  value,
                  label:
                    value.charAt(0).toUpperCase() +
                    value.slice(1).replace("-", " "),
                })),
              ]}
            />
          </div>
          <div className="mt-3">
            <div data-tour="order-selection" className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={
                    visibleOrders.length > 0 &&
                    visibleOrders.every((order) =>
                      selectedOrderKeys.includes(key(order)),
                    )
                  }
                  onChange={(event) => {
                    const pageKeys = visibleOrders.map(key);
                    setSelectedOrderKeys((current) =>
                      event.target.checked
                        ? Array.from(new Set([...current, ...pageKeys]))
                        : current.filter((value) => !pageKeys.includes(value)),
                    );
                  }}
                  className="h-4 w-4 accent-forest-700"
                />
                Select page
              </label>
              {selectedOrderKeys.length > 0 && (
                <button
                  type="button"
                  onClick={openBulkEdit}
                  className="rounded-lg bg-forest-700 px-4 py-2 text-sm font-semibold text-white hover:bg-forest-800"
                >
                  Edit selected ({selectedOrderKeys.length})
                </button>
              )}
            </div>
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <div className="min-w-[980px] divide-y">
                <div className="grid grid-cols-[42px_minmax(360px,3fr)_150px_minmax(220px,1fr)_130px] items-center gap-4 bg-gray-50 px-3 py-3 text-[11px] font-semibold uppercase tracking-[.12em] text-gray-500">
                <span aria-hidden="true" />
                <span>Details</span>
                <span>Status</span>
                <span>Shipment tracking</span>
                <span className="text-right">Price</span>
              </div>
              {visibleOrders.map((o, index) => (
                <div
                  key={key(o)}
                  data-tour={index === 0 ? "order-first-row" : undefined}
                  className="grid grid-cols-[42px_minmax(360px,3fr)_150px_minmax(220px,1fr)_130px] items-center gap-4 px-3 py-3 transition hover:bg-forest-50"
                >
                  <label className="flex cursor-pointer items-center justify-center">
                    <input
                      type="checkbox"
                      checked={selectedOrderKeys.includes(key(o))}
                      onChange={(event) =>
                        setSelectedOrderKeys((current) =>
                          event.target.checked
                            ? [...current, key(o)]
                            : current.filter((value) => value !== key(o)),
                        )
                      }
                      aria-label={`Select order ${o.id}`}
                      className="h-4 w-4 accent-forest-700"
                    />
                  </label>
                  <button
                    data-tour={index === 0 ? "order-first-row-button" : undefined}
                    type="button"
                    onClick={() => setDetails(o)}
                    className="col-span-4 grid min-w-0 grid-cols-[minmax(360px,3fr)_150px_minmax(220px,1fr)_130px] items-center gap-4 text-left"
                  >
                    <div className="flex min-w-0 items-center gap-3">
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
                        </div>
                        <p className="text-xs text-gray-500">
                          <span className="whitespace-nowrap font-mono">
                            #{getOrderReference(o).toUpperCase()}
                          </span>{" "}
                          · {o.customer?.email || "No email"} ·{" "}
                          {o.createdAt?.toDate().toLocaleDateString("en-PH") ||
                            "Pending"}
                        </p>
                      </div>
                    </div>
                    <div>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${badge[o.status]}`}
                      >
                        {o.status}
                      </span>
                    </div>
                    <div className="flex min-w-0 items-center text-xs">
                      {o.trackingNumber ? (
                        <span className="flex min-w-0 items-center gap-1 text-sm font-semibold text-forest-700">
                          <Truck size={13} className="flex-none" />
                          <span className="truncate">
                            {o.carrier ? `${o.carrier} · ` : ""}
                            {o.trackingNumber}
                          </span>
                        </span>
                      ) : (
                        <span className="text-gray-400">Not added</span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-forest-800">
                        ₱{Number(o.totalAmount || 0).toLocaleString("en-PH")}
                      </p>
                      <p className="whitespace-nowrap text-xs text-gray-500">
                        {o.totalItems || 0} items
                      </p>
                    </div>
                  </button>
                </div>
              ))}
                {!matching.length && (
                  <p className="py-12 text-center text-sm text-gray-500">
                    No orders found for this month.
                  </p>
                )}
              </div>
            </div>
            {matching.length > 0 && (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                <p className="text-sm text-gray-500">
                  Page {currentPage} of {pageCount}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setPage((value) => Math.max(1, value - 1))}
                    className="rounded-lg border px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>
                  {Array.from(
                    { length: pageCount },
                    (_, index) => index + 1,
                  ).map((number) => (
                    <button
                      key={number}
                      type="button"
                      onClick={() => setPage(number)}
                      aria-current={number === currentPage ? "page" : undefined}
                      className={`h-10 min-w-10 rounded-lg border px-3 text-sm font-semibold ${number === currentPage ? "border-forest-600 bg-forest-600 text-white" : "text-gray-700 hover:bg-gray-50"}`}
                    >
                      {number}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={currentPage === pageCount}
                    onClick={() =>
                      setPage((value) => Math.min(pageCount, value + 1))
                    }
                    className="rounded-lg border px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
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
                            className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${badge[status]}`}
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
      {manualOpen && (
        <div
          className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="manual-order-title"
        >
          <form
            data-tour="manual-order-modal"
            onSubmit={requestManualOrderSave}
            className="flex h-dvh w-full max-w-3xl flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[90vh] sm:rounded-2xl"
          >
            <div className="flex flex-none items-start justify-between border-b border-t-4 border-t-gold-500 px-4 py-4 sm:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[.16em] text-gold-600">
                  Administration
                </p>
                <h2
                  id="manual-order-title"
                  className="font-serif text-2xl text-forest-950"
                >
                  Add manual order
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setManualOpen(false)}
                disabled={saving}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                aria-label="Close manual order form"
              >
                <X size={20} />
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4 sm:p-6">
              <section data-tour="manual-order-customer">
                <h3 className="mb-3 font-semibold text-forest-950">
                  Customer and delivery
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      ["name", "Customer name", "text"],
                      ["email", "Email address", "email"],
                      ["phone", "Phone number", "tel"],
                      ["address", "Delivery address", "text"],
                    ] as const
                  ).map(([field, label, type]) => (
                    <label key={field} className="text-sm font-medium">
                      {label}
                      <input
                        required
                        type={type}
                        value={manualCustomer[field]}
                        onChange={(event) =>
                          setManualCustomer((current) => ({
                            ...current,
                            [field]: event.target.value,
                          }))
                        }
                        className="mt-1 w-full rounded-lg border p-3 font-normal"
                      />
                    </label>
                  ))}
                  <label className="text-sm font-medium sm:col-span-2">
                    Initial status
                    <AdminSelect
                      dataTour="manual-order-status-trigger"
                      dataTourMenu="manual-order-status-menu"
                      value={manualStatus}
                      onChange={(value) => setManualStatus(value as Status)}
                      ariaLabel="Initial order status"
                      className="mt-1 font-normal capitalize"
                      options={statuses.map((status) => ({
                        value: status,
                        label: status.replace("-", " "),
                      }))}
                    />
                  </label>
                </div>
              </section>
              <section data-tour="manual-order-items">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-forest-950">Order items</h3>
                  <button
                    data-tour="manual-add-product"
                    type="button"
                    onClick={addManualItem}
                    disabled={!products.length}
                    className="flex items-center gap-1 rounded-lg border border-forest-700 px-3 py-2 text-sm font-semibold text-forest-700 hover:bg-forest-50 disabled:opacity-40"
                  >
                    <Plus size={15} /> Add product
                  </button>
                </div>
                <div className="space-y-3">
                  {manualItems.map((item, index) => {
                    const product = products.find(
                      (entry) => entry.id === item.id,
                    );
                    return (
                      <div
                        key={`manual-item-${index}`}
                        data-tour={index === manualItems.length - 1 ? "manual-order-item-row" : undefined}
                        className="grid gap-3 rounded-xl border bg-gray-50 p-3 sm:grid-cols-[minmax(0,1fr)_150px_90px_auto] sm:items-end"
                      >
                        <label className="text-xs font-medium text-gray-600">
                          Product
                          <AdminSelect
                            value={String(item.id)}
                            onChange={(value) => {
                              const nextProduct = products.find(
                                (entry) => entry.id === Number(value),
                              );
                              setManualItems((items) =>
                                items.map((entry, itemIndex) =>
                                  itemIndex === index
                                    ? {
                                        ...entry,
                                        id: Number(value),
                                        color:
                                          nextProduct?.colors[0] || "default",
                                      }
                                    : entry,
                                ),
                              );
                            }}
                            ariaLabel={`Product for item ${index + 1}`}
                            className="mt-1 font-normal"
                            options={products.map((entry) => ({
                              value: String(entry.id),
                              label: `${entry.name} — ₱${entry.price.toLocaleString("en-PH")}`,
                            }))}
                          />
                        </label>
                        <label className="text-xs font-medium text-gray-600">
                          Color
                          <AdminSelect
                            value={item.color}
                            onChange={(value) =>
                              setManualItems((items) =>
                                items.map((entry, itemIndex) =>
                                  itemIndex === index
                                    ? { ...entry, color: value }
                                    : entry,
                                ),
                              )
                            }
                            ariaLabel={`Color for item ${index + 1}`}
                            className="mt-1 font-normal capitalize"
                            options={(product?.colors || ["default"]).map(
                              (color) => ({
                                value: color,
                                label: color.replaceAll("-", " "),
                              }),
                            )}
                          />
                        </label>
                        <label className="text-xs font-medium text-gray-600">
                          Quantity
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(event) =>
                              setManualItems((items) =>
                                items.map((entry, itemIndex) =>
                                  itemIndex === index
                                    ? {
                                        ...entry,
                                        quantity: Math.max(
                                          1,
                                          Number(event.target.value),
                                        ),
                                      }
                                    : entry,
                                ),
                              )
                            }
                            className="mt-1 w-full rounded-lg border bg-white p-2.5 text-sm"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setManualItems((items) =>
                              items.filter(
                                (_, itemIndex) => itemIndex !== index,
                              ),
                            )
                          }
                          className="flex h-10 items-center justify-center rounded-lg border border-red-200 px-3 text-red-600 hover:bg-red-50"
                          aria-label={`Remove ${product?.name || "product"}`}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    );
                  })}
                  {!manualItems.length && (
                    <div className="rounded-xl border border-dashed p-6 text-center text-sm text-gray-500">
                      Add products to create this order.
                    </div>
                  )}
                </div>
              </section>
            </div>
            <div data-tour="manual-order-save" className="flex flex-none flex-col-reverse gap-3 border-t bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-lg font-bold text-forest-900">
                Total: ₱{manualTotal.toLocaleString("en-PH")}
              </p>
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <button
                data-tour="manual-order-close"
                type="button"
                  onClick={() => setManualOpen(false)}
                  disabled={saving}
                  className="rounded-lg border px-5 py-3 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !manualItems.length}
                  className="rounded-lg bg-forest-700 px-5 py-3 font-semibold text-white disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create order"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
      <AdminConfirmModal
        open={confirmManualOrder}
        title="Create manual order?"
        description={`Create this ${manualStatus.replace("-", " ")} order for ${manualCustomer.name || "this customer"} with ${manualItems.reduce((total, item) => total + item.quantity, 0)} item${manualItems.reduce((total, item) => total + item.quantity, 0) === 1 ? "" : "s"} totaling ₱${manualTotal.toLocaleString("en-PH")}?`}
        confirmLabel={saving ? "Creating..." : "Create Order"}
        tone="success"
        onConfirm={saveManualOrder}
        onCancel={() => setConfirmManualOrder(false)}
      />
      {details && (
        <div
          className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDetails(null);
          }}
        >
          <div className="flex h-dvh w-full max-w-7xl flex-col overflow-hidden overscroll-contain bg-white shadow-2xl sm:h-auto sm:max-h-[90vh] sm:rounded-2xl">
            <div className="relative flex-none border-b border-t-4 border-b-[#eee7da] border-t-gold-500 bg-white p-4 pr-14 sm:p-6 sm:pr-16">
              <div className="min-w-0">
                <p className="break-all font-mono text-xs font-semibold uppercase leading-5 text-gold-600">
                  Order #{getOrderReference(details).toUpperCase()}
                </p>
                <h2 className="mt-1 font-serif text-2xl text-forest-950">
                  {details.customer?.name || "Customer order"}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${badge[details.status]}`}
                  >
                    {details.status}
                  </span>
                  {details.source === "guest" && (
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-bold uppercase text-gray-500">
                      Guest checkout
                    </span>
                  )}
                </div>
              </div>
              <div className="absolute right-4 top-4 sm:right-5 sm:top-5">
                <button
                  data-tour="order-details-close"
                  onClick={() => setDetails(null)}
                  className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
                  aria-label="Close order details"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(250px,0.9fr)_minmax(280px,1fr)] lg:gap-5 lg:overflow-hidden">
              {/* COLUMN 1: ORDER ITEMS */}
              <section
                data-tour="order-details-items"
                className="min-h-0"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold text-forest-950">
                    Order items
                  </h3>
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">
                    {details.items?.length || 0} products
                  </span>
                </div>

                <div
                  className={`${(details.items?.length || 0) >= 5 ? "max-h-[42dvh] overflow-y-auto overscroll-contain pr-2 lg:max-h-[520px]" : ""} space-y-3`}
                >
                  {(details.items || []).map((item) => {
                    const p = getProductById(item.id);
                    const src = p
                      ? getProductImage(p, item.color)
                      : "";

                    return (
                      <div
                        key={`${item.id}-${item.color}-${item.size || ""}`}
                        className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 transition hover:border-forest-100 hover:bg-forest-50/40"
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
                          <div className="h-16 w-16 flex-none rounded-lg bg-gray-100" />
                        )}

                        <div className="min-w-0 flex-1">
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
              </section>

              {/* COLUMN 2: CUSTOMER + SHIPMENT */}
              <aside className="mt-5 space-y-4 text-sm text-gray-600 lg:mt-0 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
                <section className="rounded-xl border border-gray-100 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[.16em] text-gold-600">
                    Delivery information
                  </p>

                  <div className="mt-3 space-y-2">
                    <p className="break-all">
                      {details.customer?.email || "No email"}
                    </p>
                    <p>{details.customer?.phone || "No phone"}</p>
                    <p className="flex items-start gap-2">
                      <MapPin
                        size={15}
                        className="mt-0.5 flex-none"
                      />
                      <span className="break-words">
                        {details.customer?.address || "No address"}
                      </span>
                    </p>
                  </div>
                </section>

                <section className="rounded-xl border border-forest-100 bg-forest-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-forest-700">
                    <Truck size={16} />
                    <p className="text-[10px] font-bold uppercase tracking-[.16em]">
                      Shipment tracking
                    </p>
                  </div>

                  <b className="break-words text-forest-900">
                    {details.trackingNumber
                      ? `${details.carrier || "Carrier"} · ${details.trackingNumber}`
                      : "Not added yet"}
                  </b>

                  {details.trackingNote && (
                    <p className="mt-2 text-xs">
                      {details.trackingNote}
                    </p>
                  )}
                </section>

                <section className="overflow-hidden rounded-xl border border-[#e8ddc8] bg-[#fbf8f1]">
                  <div className="border-b border-[#eee4d2] px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-[.16em] text-gold-700">
                      Order summary
                    </p>
                  </div>

                  <div className="divide-y divide-[#eee4d2] px-4">
                    <div className="flex items-center justify-between gap-4 py-3">
                      <span className="text-xs text-gray-500">
                        Items
                      </span>
                      <span className="text-sm font-semibold text-forest-900">
                        {details.totalItems || 0}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 py-3">
                      <span className="text-xs text-gray-500">
                        Order date
                      </span>
                      <span className="text-right text-sm font-semibold text-forest-900">
                        {details.createdAt
                          ?.toDate()
                          .toLocaleDateString("en-PH", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }) || "Pending"}
                      </span>
                    </div>

                    {Boolean(details.couponCode) && (
                      <>
                        <div className="flex items-center justify-between gap-4 py-3">
                          <span className="text-xs text-gray-500">
                            Subtotal
                          </span>
                          <span className="text-sm font-semibold text-forest-900">
                            ₱
                            {Number(
                              details.subtotalAmount ??
                                details.totalAmount ??
                                0,
                            ).toLocaleString("en-PH", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-4 py-3">
                          <div>
                            <span className="text-xs text-gray-500">
                              Coupon
                            </span>
                            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[.1em] text-forest-700">
                              {details.couponCode}
                            </p>
                          </div>
                          <span className="text-sm font-semibold text-forest-700">
                            -₱
                            {Number(details.discountAmount || 0).toLocaleString(
                              "en-PH",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              },
                            )}
                          </span>
                        </div>
                      </>
                    )}

                    <div className="flex items-center justify-between gap-4 py-3">
                      <span className="font-medium text-forest-800">
                        Total
                      </span>
                      <span className="text-lg font-bold text-forest-900">
                        ₱
                        {Number(details.totalAmount || 0).toLocaleString(
                          "en-PH",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          },
                        )}
                      </span>
                    </div>
                  </div>
                </section>
              </aside>

              {/* COLUMN 3: PAYMENT DETAILS */}
              <aside
                data-tour="order-details-summary"
                className="mt-5 min-h-0 text-sm text-gray-600 lg:mt-0 lg:overflow-y-auto lg:pl-1"
              >
                <section className="overflow-hidden rounded-xl border border-[#e8ddc8] bg-[#fffdf8]">
                  <div className="flex items-center gap-2 border-b border-[#eee4d2] px-4 py-3 text-forest-700">
                    <CreditCard size={16} />
                    <p className="text-[10px] font-bold uppercase tracking-[.16em]">
                      Payment details
                    </p>
                  </div>

                  <div className="divide-y divide-[#eee4d2] px-4">
                    <div className="flex items-center justify-between gap-4 py-3">
                      <span className="text-xs text-gray-500">
                        Payment status
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                          details.paymentStatus === "paid"
                            ? "bg-[#dfe8df] text-[#24452c]"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {details.paymentStatus || "Not recorded"}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-4 py-3">
                      <span className="text-xs text-gray-500">
                        Payment method
                      </span>
                      <span className="max-w-[65%] text-right text-sm font-semibold text-forest-900">
                        {details.paymentMethod === "paymongo"
                          ? `PayMongo · ${formatPaymentSource(details.paymongoPaymentSource)}`
                          : details.paymentMethod || "Not recorded"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 py-3">
                      <span className="text-xs text-gray-500">
                        Amount paid
                      </span>
                      <span className="text-sm font-semibold text-forest-900">
                        ₱
                        {formatCentavos(details.amountInCentavos) ||
                          Number(details.totalAmount || 0).toLocaleString(
                            "en-PH",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            },
                          )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 py-3">
                      <span className="text-xs text-gray-500">
                        Currency
                      </span>
                      <span className="text-sm font-semibold text-forest-900">
                        {details.currency || "PHP"}
                      </span>
                    </div>

                    {details.paidAt && (
                      <div className="flex items-start justify-between gap-4 py-3">
                        <span className="text-xs text-gray-500">
                          Paid at
                        </span>
                        <span className="max-w-[65%] text-right text-sm font-semibold text-forest-900">
                          {details.paidAt
                            .toDate()
                            .toLocaleString("en-PH", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                        </span>
                      </div>
                    )}

                    {details.paymongoPaymentIntentId && (
                      <div className="py-3">
                        <span className="text-xs text-gray-500">
                          Payment Intent ID
                        </span>
                        <p className="mt-1 break-all font-mono text-[11px] font-semibold leading-5 text-forest-900">
                          {details.paymongoPaymentIntentId}
                        </p>
                      </div>
                    )}

                    {details.paymongoPaymentId && (
                      <div className="py-3">
                        <span className="text-xs text-gray-500">
                          Payment ID
                        </span>
                        <p className="mt-1 break-all font-mono text-[11px] font-semibold leading-5 text-forest-900">
                          {details.paymongoPaymentId}
                        </p>
                      </div>
                    )}

                    {details.paymongoFee !== null &&
                      details.paymongoFee !== undefined && (
                        <div className="flex items-center justify-between gap-4 py-3">
                          <span className="text-xs text-gray-500">
                            PayMongo fee
                          </span>
                          <span className="text-sm font-semibold text-forest-900">
                            ₱{formatCentavos(details.paymongoFee)}
                          </span>
                        </div>
                      )}

                    {details.paymongoNetAmount !== null &&
                      details.paymongoNetAmount !== undefined && (
                        <div className="flex items-center justify-between gap-4 py-3">
                          <span className="text-xs text-gray-500">
                            Net amount
                          </span>
                          <span className="text-sm font-semibold text-forest-900">
                            ₱{formatCentavos(details.paymongoNetAmount)}
                          </span>
                        </div>
                      )}
                  </div>
                </section>
              </aside>
            </div>
            <div className="flex flex-none flex-col-reverse gap-2 border-t bg-white px-4 py-3 sm:flex-row sm:justify-end sm:gap-3 sm:px-6 sm:py-4">
              <button
                onClick={() => setDetails(null)}
                className="w-full rounded-lg border px-5 py-2.5 font-semibold sm:w-auto"
              >
                Close
              </button>
              <button
                data-tour="order-manage-tracking"
                onClick={() => openEdit(details)}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-forest-700 px-5 py-2.5 font-semibold text-white sm:w-auto"
              >
                <Truck size={17} />
                Manage tracking
              </button>
            </div>
          </div>
        </div>
      )}
      {editing && (
        <div
          className="fixed inset-0 z-[1010] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            ref={editModalRef}
            style={{
              transform: `translate3d(${editModalPosition.x}px, ${editModalPosition.y}px, 0)`,
            }}
            className="h-dvh w-full max-w-lg overflow-y-auto overscroll-contain bg-white p-4 sm:h-auto sm:max-h-[90vh] sm:rounded-2xl sm:p-6"
          >
            <div
              className="flex touch-none select-none justify-between sm:cursor-move"
              onPointerDown={startEditModalDrag}
              onPointerMove={dragEditModal}
              onPointerUp={stopEditModalDrag}
              onPointerCancel={stopEditModalDrag}
            >
              <div>
                <p className="text-xs font-semibold uppercase text-gold-600">
                  {bulkEditing
                    ? `${selectedOrderKeys.length} selected orders`
                    : `Order #${getOrderReference(editing).toUpperCase()}`}
                </p>
                <h2 className="font-serif text-2xl">
                  {bulkEditing ? "Bulk edit orders" : "Tracking details"}
                </h2>
              </div>
              <button data-tour="tracking-modal-close" onClick={() => setEditing(null)}>
                <X />
              </button>
            </div>
            <div data-tour="tracking-modal-fields" className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Status
                <AdminSelect
                  dataTour="tracking-status-trigger"
                  dataTourMenu="tracking-status-menu"
                  value={form.status}
                  onChange={(value) =>
                    setForm({ ...form, status: value as Status })
                  }
                  ariaLabel="Order status"
                  className="mt-1 capitalize"
                  options={statuses.map((status) => ({
                    value: status,
                    label: status.replace("-", " "),
                  }))}
                />
              </label>
              <label className="text-sm font-medium">
                Carrier
                <AdminSelect
                  value={form.carrier}
                  onChange={(value) => setForm({ ...form, carrier: value })}
                  ariaLabel="Shipment carrier"
                  className="mt-1"
                  options={[
                    { value: "", label: "Select carrier" },
                    ...(form.carrier && !carriers.includes(form.carrier)
                      ? [{ value: form.carrier, label: form.carrier }]
                      : []),
                    ...carriers.map((carrier) => ({
                      value: carrier,
                      label: carrier,
                    })),
                  ]}
                />
              </label>
              <label className="text-sm font-medium sm:col-span-2">
                Tracking number
                <input
                  required
                  value={form.trackingNumber}
                  onChange={(e) => {
                    setForm({ ...form, trackingNumber: e.target.value });
                    if (trackingNumberError) setTrackingNumberError("");
                  }}
                  aria-invalid={Boolean(trackingNumberError)}
                  aria-describedby={
                    trackingNumberError ? "tracking-number-error" : undefined
                  }
                  className={`mt-1 w-full rounded-lg border p-3 ${trackingNumberError ? "border-red-400 ring-1 ring-red-100" : ""}`}
                />
                {trackingNumberError && (
                  <p
                    id="tracking-number-error"
                    className="mt-1.5 text-xs font-medium text-red-600"
                  >
                    {trackingNumberError}
                  </p>
                )}
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
            <div data-tour="tracking-save" className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setEditing(null)}
                disabled={saving}
                className="rounded-lg border px-5 py-3 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={requestTrackingSave}
                disabled={saving}
                className="rounded-lg bg-forest-700 px-5 py-3 font-semibold text-white disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save tracking"}
              </button>
            </div>
          </div>
        </div>
      )}
      <AdminConfirmModal
        open={confirmTrackingSave}
        title="Save tracking changes?"
        description={`Update ${bulkEditing ? `${selectedOrderKeys.length} selected orders` : "this order"} to ${form.status.replace("-", " ")} with tracking number ${form.trackingNumber}?`}
        confirmLabel={saving ? "Saving..." : "Save Changes"}
        tone="success"
        onConfirm={save}
        onCancel={() => setConfirmTrackingSave(false)}
      />
    </main>
  );
}
