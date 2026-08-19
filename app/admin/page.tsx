"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Heart,
  Pencil,
  Save,
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

type OrderItem = {
  id?: string | number;
  productId?: string | number;
  name?: string;
  productName?: string;
  category?: string;
  quantity?: number;
  price?: number;
  total?: number;
  lineTotal?: number;
};

type OrderRecord = {
  id: string;
  source: "account" | "guest";
  customerName: string;
  status: string;
  totalAmount: number;
  items: OrderItem[];
  createdAt?: Timestamp;
};

type OrderNotification = Pick<
  OrderRecord,
  "id" | "source" | "customerName" | "status" | "totalAmount" | "createdAt"
>;

type CustomerStats = {
  total: number;
  active: number;
  verified: number;
  admins: number;
};

type ProductMeta = {
  id: string;
  name: string;
  category: string;
  image: string | null;
  images: Record<string, string>;
};

type WishlistSnapshotItem = {
  id: string | number;
  colors?: string[];
};

type WishlistSnapshot = {
  ownerId: string;
  items: WishlistSnapshotItem[];
};

type WishlistProductStat = {
  productId: string;
  name: string;
  category: string;
  image: string | null;
  previewColor: string | null;
  totalSaves: number;
  colors: Array<{
    name: string;
    count: number;
  }>;
};

const DEFAULT_MONTHLY_SALES_TARGET = 200_000;
const SALE_STATUSES = new Set([
  "paid",
  "processing",
  "shipped",
  "delivered",
  "completed",
  "complete",
  "fulfilled",
]);
const EXCLUDED_ORDER_STATUSES = new Set(["cancelled", "canceled", "refunded"]);

function formatCurrency(value: number) {
  return `₱${Math.max(0, value).toLocaleString("en-PH", {
    maximumFractionDigits: 0,
  })}`;
}

function normalizeStatus(status: string) {
  return status.trim().toLowerCase().replace(/_/g, "-");
}

function isRecognizedSale(order: OrderRecord) {
  return SALE_STATUSES.has(normalizeStatus(order.status));
}

function getOrderDate(order: OrderRecord) {
  return order.createdAt?.toDate?.() ?? null;
}

function percentageChange(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function formatChange(value: number) {
  if (!Number.isFinite(value)) return "0%";
  const rounded = Math.abs(value) < 0.05 ? 0 : value;
  return `${rounded >= 0 ? "+" : ""}${rounded.toFixed(1)}%`;
}

function inferCategory(item: OrderItem) {
  const explicit = item.category?.trim();
  if (explicit) return explicit.toUpperCase();

  const name = (item.name || item.productName || "").toLowerCase();
  if (name.includes("polo") || name.includes("shirt") || name.includes("apparel")) {
    return "APPAREL";
  }
  if (
    name.includes("cap") ||
    name.includes("towel") ||
    name.includes("tote") ||
    name.includes("tee") ||
    name.includes("brush") ||
    name.includes("ball") ||
    name.includes("glove")
  ) {
    return "ACCESSORIES";
  }
  return "OTHER";
}

function mapOrderRecord(
  id: string,
  source: "account" | "guest",
  data: Record<string, any>,
): OrderRecord {
  return {
    id,
    source,
    customerName:
      data.customer?.name || (source === "guest" ? "Guest customer" : "Customer"),
    status: String(data.status || "pre-order"),
    totalAmount: Number(data.totalAmount || 0),
    items: Array.isArray(data.items) ? data.items : [],
    createdAt: data.createdAt,
  };
}

function buildPolyline(
  values: number[],
  maxValue?: number,
  width = 650,
  height = 170,
) {
  const max = Math.max(maxValue ?? Math.max(...values, 1), 1);
  const gap = values.length > 1 ? width / (values.length - 1) : 0;

  return values
    .map((value, index) => {
      const x = index * gap;
      const y = height - (value / max) * (height - 16) + 8;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function monthKeyFromDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function dateFromMonthKey(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, Math.max(0, (month || 1) - 1), 1);
}

function shiftMonthKey(monthKey: string, delta: number) {
  const date = dateFromMonthKey(monthKey);
  date.setMonth(date.getMonth() + delta);
  return monthKeyFromDate(date);
}

function formatMonthLabel(monthKey: string) {
  return new Intl.DateTimeFormat("en-PH", {
    month: "long",
    year: "numeric",
  }).format(dateFromMonthKey(monthKey));
}

function normalizeColorKey(color: string) {
  const value = color.trim().toLowerCase();

  const aliases: Record<string, string> = {
    "forest green": "forest",
    "forest-green": "forest",
    "burgandy": "burgundy",
    "green gold": "green-gold",
    "green/gold": "green-gold",
    "green / gold": "green-gold",
  };

  return aliases[value] || value;
}

function formatColorLabel(color: string) {
  const normalizedColor = normalizeColorKey(color);

  const labels: Record<string, string> = {
    forest: "Forest",
    black: "Black",
    gold: "Gold",
    ivory: "Ivory",
    navy: "Navy",
    cream: "Cream",
    khaki: "Khaki",
    white: "White",
    burgundy: "Burgundy",
    "green-gold": "Green / Gold",
  };

  return labels[normalizedColor] || color;
}

function getColorSwatch(color: string) {
  const swatches: Record<string, string> = {
    forest: "#123c2d",
    black: "#111111",
    gold: "#c9a15b",
    ivory: "#f5f1e8",
    navy: "#1f2a44",
    cream: "#fff4d6",
    khaki: "#c3b091",
    white: "#ffffff",
    burgundy: "#800020",
    "green-gold": "linear-gradient(135deg,#123c2d 0 50%,#c9a15b 50% 100%)",
  };

  return swatches[normalizeColorKey(color)] || "#9ca3af";
}

export default function AdminDashboardPage() {
  const { user, loading, logout } = useAuth();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [allOrders, setAllOrders] = useState<OrderRecord[]>([]);
  const [productCategories, setProductCategories] = useState<Record<string, string>>({});
  const [productCatalog, setProductCatalog] = useState<Record<string, ProductMeta>>({});
  const [wishlistSnapshots, setWishlistSnapshots] = useState<WishlistSnapshot[]>([]);
  const [hoveredCategoryIndex, setHoveredCategoryIndex] = useState<number | null>(null);
  const [customerStats, setCustomerStats] = useState<CustomerStats>({
    total: 0,
    active: 0,
    verified: 0,
    admins: 0,
  });
  const currentMonthKey = useMemo(() => monthKeyFromDate(new Date()), []);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => Number(currentMonthKey.slice(0, 4)));
  const monthPickerRef = useRef<HTMLDivElement | null>(null);
  const [monthlyTargets, setMonthlyTargets] = useState<Record<string, number>>({});
  const [targetDraft, setTargetDraft] = useState(String(DEFAULT_MONTHLY_SALES_TARGET));
  const [editingTarget, setEditingTarget] = useState(false);
  const [savingTarget, setSavingTarget] = useState(false);
  const [targetMessage, setTargetMessage] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [newOrderAlerts, setNewOrderAlerts] = useState(true);
  const [statusAlerts, setStatusAlerts] = useState(true);
  const accountOrdersRef = useRef<OrderRecord[]>([]);
  const guestOrdersRef = useRef<OrderRecord[]>([]);
  const accountListenerReadyRef = useRef(false);
  const guestListenerReadyRef = useRef(false);
  const alertedNotificationKeysRef = useRef(new Set<string>());

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (
        monthPickerOpen &&
        monthPickerRef.current &&
        !monthPickerRef.current.contains(event.target as Node)
      ) {
        setMonthPickerOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [monthPickerOpen]);

  useEffect(() => {
    if (loading) return;
    if (!user) return setAllowed(false);
    getIdTokenResult(user, true)
      .then((token) => setAllowed(token.claims.admin === true))
      .catch(() => setAllowed(false));
  }, [user, loading]);

  useEffect(() => {
    if (!allowed || !user) return;

    let cancelled = false;

    const loadCustomerStats = async () => {
      try {
        const token = await user.getIdToken();
        const response = await fetch("/api/admin/users", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load customers.");
        if (cancelled) return;

        const users = Array.isArray(data.users) ? data.users : [];
        setCustomerStats({
          total: users.length,
          active: users.filter((account: any) => account.disabled !== true).length,
          verified: users.filter((account: any) => account.emailVerified === true).length,
          admins: users.filter((account: any) => account.isAdmin === true).length,
        });
      } catch (error) {
        console.error("Unable to load dashboard customer stats:", error);
      }
    };

    void loadCustomerStats();
    return () => {
      cancelled = true;
    };
  }, [allowed, user]);

  useEffect(() => {
    if (!allowed) return;

    return onSnapshot(
      doc(firestore, "siteAssets", "dashboard"),
      (snapshot) => {
        const data = snapshot.data();
        const rawTargets = data?.monthlyTargets;
        const parsedTargets: Record<string, number> = {};

        if (rawTargets && typeof rawTargets === "object") {
          for (const [key, value] of Object.entries(rawTargets)) {
            const numericValue = Number(value);
            if (Number.isFinite(numericValue) && numericValue >= 0) {
              parsedTargets[key] = numericValue;
            }
          }
        }

        setMonthlyTargets(parsedTargets);
      },
      (error) => console.error("Unable to load dashboard targets:", error),
    );
  }, [allowed]);

  useEffect(() => {
    const selectedTarget = monthlyTargets[selectedMonth] ?? DEFAULT_MONTHLY_SALES_TARGET;
    setTargetDraft(String(selectedTarget));
    setEditingTarget(false);
    setTargetMessage("");
  }, [monthlyTargets, selectedMonth]);

  useEffect(() => {
    if (!allowed) return;

    return onSnapshot(
      collection(firestore, "products"),
      (snapshot) => {
        const categories: Record<string, string> = {};
        const catalog: Record<string, ProductMeta> = {};

        snapshot.docs.forEach((productDoc) => {
          const data = productDoc.data();
          const category = String(data.category || "OTHER").trim().toUpperCase();
          const productId = String(data.id ?? productDoc.id);
          const name = String(data.name || data.productName || `Product ${productId}`);

          const images: Record<string, string> = {};

          if (data.images && typeof data.images === "object") {
            for (const [colorKey, value] of Object.entries(data.images)) {
              if (typeof value === "string" && value.trim()) {
                images[normalizeColorKey(String(colorKey))] = value;
              }
            }
          }

          let image: string | null = null;
          if (typeof data.image === "string") image = data.image;
          if (!image && typeof data.imageURL === "string") image = data.imageURL;
          if (!image && typeof data.photoURL === "string") image = data.photoURL;
          if (!image) {
            image = Object.values(images)[0] || null;
          }

          const meta: ProductMeta = {
            id: productId,
            name,
            category,
            image,
            images,
          };

          // Support both the Firestore document ID and a product's own id field.
          categories[String(productDoc.id)] = category;
          catalog[String(productDoc.id)] = meta;

          if (data.id !== undefined && data.id !== null) {
            categories[String(data.id)] = category;
            catalog[String(data.id)] = meta;
          }
        });

        setProductCategories(categories);
        setProductCatalog(catalog);
      },
      (error) => console.error("Unable to load dashboard products:", error),
    );
  }, [allowed]);

  useEffect(() => {
    if (!allowed || !user) return;

    let cancelled = false;

    const loadWishlistAnalytics = async () => {
      try {
        const token = await user.getIdToken();

        const response = await fetch("/api/admin/dashboard/wishlists", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Unable to load wishlist analytics.",
          );
        }

        if (cancelled) return;

        const wishlists = Array.isArray(data.wishlists)
          ? data.wishlists
              .map((wishlist: any): WishlistSnapshot | null => {
                if (!wishlist || typeof wishlist !== "object") {
                  return null;
                }

                const ownerId = String(wishlist.ownerId || "");
                const rawItems = Array.isArray(wishlist.items)
                  ? wishlist.items
                  : [];

                const items = rawItems.filter(
                  (item: unknown): item is WishlistSnapshotItem =>
                    Boolean(
                      item &&
                        typeof item === "object" &&
                        "id" in item &&
                        (item as { id?: unknown }).id !== undefined,
                    ),
                );

                return ownerId
                  ? {
                      ownerId,
                      items,
                    }
                  : null;
              })
              .filter(
                (wishlist: WishlistSnapshot | null): wishlist is WishlistSnapshot =>
                  wishlist !== null,
              )
          : [];

        setWishlistSnapshots(wishlists);
      } catch (error) {
        console.error("Unable to load wishlist analytics:", error);

        if (!cancelled) {
          setWishlistSnapshots([]);
        }
      }
    };

    void loadWishlistAnalytics();

    const refreshTimer = window.setInterval(() => {
      void loadWishlistAnalytics();
    }, 30_000);

    return () => {
      cancelled = true;
      window.clearInterval(refreshTimer);
    };
  }, [allowed, user]);

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

    const syncOrderState = () => {
      const combined = [...accountOrdersRef.current, ...guestOrdersRef.current].sort(
        (a, b) =>
          (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0),
      );
      setAllOrders(combined);
      setNotifications(combined.slice(0, 8));
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
        accountOrdersRef.current = snapshot.docs.map((order) =>
          mapOrderRecord(order.id, "account", order.data()),
        );
        accountListenerReadyRef.current = true;
        syncOrderState();
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
        guestOrdersRef.current = snapshot.docs.map((order) =>
          mapOrderRecord(order.id, "guest", order.data()),
        );
        guestListenerReadyRef.current = true;
        syncOrderState();
      },
    );

    return () => {
      stopAccounts();
      stopGuests();
      accountListenerReadyRef.current = false;
      guestListenerReadyRef.current = false;
    };
  }, [allowed, newOrderAlerts, statusAlerts]);

  const dashboard = useMemo(() => {
    const monthStart = dateFromMonthKey(selectedMonth);
    const nextMonthStart = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
    const previousMonthStart = new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, 1);
    const daysInMonth = new Date(
      monthStart.getFullYear(),
      monthStart.getMonth() + 1,
      0,
    ).getDate();

    const selectedMonthAllOrders = allOrders.filter((order) => {
      const date = getOrderDate(order);
      return date && date >= monthStart && date < nextMonthStart;
    });

    const previousMonthAllOrders = allOrders.filter((order) => {
      const date = getOrderDate(order);
      return date && date >= previousMonthStart && date < monthStart;
    });

    const selectedRecognizedOrders = selectedMonthAllOrders.filter(isRecognizedSale);
    const previousRecognizedOrders = previousMonthAllOrders.filter(isRecognizedSale);

    const selectedMonthRevenue = selectedRecognizedOrders.reduce(
      (sum, order) => sum + order.totalAmount,
      0,
    );
    const previousMonthRevenue = previousRecognizedOrders.reduce(
      (sum, order) => sum + order.totalAmount,
      0,
    );

    const revenueChange = percentageChange(selectedMonthRevenue, previousMonthRevenue);
    const ordersChange = percentageChange(
      selectedMonthAllOrders.length,
      previousMonthAllOrders.length,
    );

    const daily = Array.from({ length: daysInMonth }, (_, index) => {
      const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), index + 1);
      const next = new Date(monthStart.getFullYear(), monthStart.getMonth(), index + 2);

      const dayOrders = selectedMonthAllOrders.filter((order) => {
        const orderDate = getOrderDate(order);
        return orderDate && orderDate >= date && orderDate < next;
      });

      return {
        day: index + 1,
        label: String(index + 1),
        revenue: dayOrders
          .filter(isRecognizedSale)
          .reduce((sum, order) => sum + order.totalAmount, 0),
        orders: dayOrders.length,
      };
    });

    const previousDaysInMonth = new Date(
      previousMonthStart.getFullYear(),
      previousMonthStart.getMonth() + 1,
      0,
    ).getDate();

    const previousDailyRevenue = Array.from({ length: daysInMonth }, (_, index) => {
      if (index + 1 > previousDaysInMonth) return 0;

      const date = new Date(
        previousMonthStart.getFullYear(),
        previousMonthStart.getMonth(),
        index + 1,
      );
      const next = new Date(
        previousMonthStart.getFullYear(),
        previousMonthStart.getMonth(),
        index + 2,
      );

      return previousRecognizedOrders
        .filter((order) => {
          const orderDate = getOrderDate(order);
          return orderDate && orderDate >= date && orderDate < next;
        })
        .reduce((sum, order) => sum + order.totalAmount, 0);
    });

    const statusMap = new Map<string, number>();
    for (const order of selectedMonthAllOrders) {
      const status = normalizeStatus(order.status) || "unknown";
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
    }
    const statusBreakdown = [...statusMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([status, count]) => ({
        status,
        count,
        percentage: selectedMonthAllOrders.length
          ? (count / selectedMonthAllOrders.length) * 100
          : 0,
      }));

    const categoryMap = new Map<string, number>();
    let totalItems = 0;
    for (const order of selectedMonthAllOrders.filter(
      (entry) => !EXCLUDED_ORDER_STATUSES.has(normalizeStatus(entry.status)),
    )) {
      for (const item of order.items) {
        const quantity = Math.max(1, Number(item.quantity || 1));
        const productKey = item.productId ?? item.id;
        const matchedCategory =
          productKey !== undefined && productKey !== null
            ? productCategories[String(productKey)]
            : undefined;
        const category = matchedCategory || inferCategory(item);
        categoryMap.set(category, (categoryMap.get(category) || 0) + quantity);
        totalItems += quantity;
      }
    }

    const topCategories = [...categoryMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, quantity]) => ({
        name,
        quantity,
        percentage: totalItems ? (quantity / totalItems) * 100 : 0,
      }));

    const monthlyTarget = monthlyTargets[selectedMonth] ?? DEFAULT_MONTHLY_SALES_TARGET;
    const targetProgress = monthlyTarget
      ? Math.min((selectedMonthRevenue / monthlyTarget) * 100, 100)
      : 0;

    return {
      selectedMonthRevenue,
      previousMonthRevenue,
      selectedMonthOrders: selectedMonthAllOrders.length,
      previousMonthOrders: previousMonthAllOrders.length,
      recognizedOrders: selectedRecognizedOrders.length,
      revenueChange,
      ordersChange,
      daily,
      previousDailyRevenue,
      statusBreakdown,
      topCategories,
      totalItems,
      targetProgress,
      monthlyTarget,
      previousMonthLabel: formatMonthLabel(shiftMonthKey(selectedMonth, -1)),
    };
  }, [allOrders, monthlyTargets, productCategories, selectedMonth]);

  const chartMaxRevenue = Math.max(
    ...dashboard.daily.map((day) => day.revenue),
    ...dashboard.previousDailyRevenue,
    1,
  );
  const revenuePoints = useMemo(
    () =>
      buildPolyline(
        dashboard.daily.map((day) => day.revenue),
        chartMaxRevenue,
      ),
    [dashboard.daily, chartMaxRevenue],
  );
  const previousRevenuePoints = useMemo(
    () => buildPolyline(dashboard.previousDailyRevenue, chartMaxRevenue),
    [dashboard.previousDailyRevenue, chartMaxRevenue],
  );

  const wishlistStats = useMemo<WishlistProductStat[]>(() => {
    const stats = new Map<
      string,
      {
        totalSaves: number;
        colors: Map<string, number>;
      }
    >();

    for (const wishlist of wishlistSnapshots) {
      const productsSeenByUser = new Set<string>();
      const colorsSeenByUser = new Set<string>();

      for (const item of wishlist.items) {
        const productId = String(item.id);
        const current = stats.get(productId) || {
          totalSaves: 0,
          colors: new Map<string, number>(),
        };

        if (!productsSeenByUser.has(productId)) {
          current.totalSaves += 1;
          productsSeenByUser.add(productId);
        }

        const colors = Array.isArray(item.colors) ? item.colors : [];
        for (const rawColor of colors) {
          const color = normalizeColorKey(String(rawColor));
          if (!color) continue;

          const colorKey = `${productId}:${color}`;
          if (colorsSeenByUser.has(colorKey)) continue;

          current.colors.set(color, (current.colors.get(color) || 0) + 1);
          colorsSeenByUser.add(colorKey);
        }

        stats.set(productId, current);
      }
    }

    return [...stats.entries()]
      .map(([productId, stat]) => {
        const product = productCatalog[productId];

        const sortedColors = [...stat.colors.entries()]
          .sort((a, b) => b[1] - a[1])
          .map(([name, count]) => ({ name, count }));

        const previewColor = sortedColors[0]?.name || null;
        const colorMatchedImage =
          previewColor && product?.images
            ? product.images[previewColor] || null
            : null;

        return {
          productId,
          name: product?.name || `Product ${productId}`,
          category: product?.category || "OTHER",
          image: colorMatchedImage || product?.image || null,
          previewColor,
          totalSaves: stat.totalSaves,
          colors: sortedColors,
        };
      })
      .sort((a, b) => b.totalSaves - a.totalSaves || a.name.localeCompare(b.name))
      .slice(0, 4);
  }, [productCatalog, wishlistSnapshots]);

  const maxWishlistSaves = Math.max(
    ...wishlistStats.map((item) => item.totalSaves),
    1,
  );

  const categoryColors = ["#214f19", "#c89c4a", "#dfcfad"];


  const metricCards = [
    {
      label: "Sales",
      value: formatCurrency(dashboard.selectedMonthRevenue),
      change: formatChange(dashboard.revenueChange),
      changeCaption: "vs previous month",
      changeValue: dashboard.revenueChange,
      icon: CircleDollarSign,
      accent: true,
      href: null,
    },
    {
      label: "Orders",
      value: dashboard.selectedMonthOrders.toLocaleString("en-PH"),
      change: formatChange(dashboard.ordersChange),
      changeCaption: "vs previous month",
      changeValue: dashboard.ordersChange,
      icon: ShoppingCart,
      accent: false,
      href: `/admin/orders?month=${selectedMonth}`,
    },
    {
      label: "Customer Accounts",
      value: customerStats.total.toLocaleString("en-PH"),
      change: `${customerStats.verified} verified`,
      changeCaption: "",
      changeValue: 0,
      icon: Users,
      accent: false,
      href: "/admin/customers",
    },
  ];

  const saveMonthlyTarget = async () => {
    const numericTarget = Number(targetDraft.replace(/,/g, ""));

    if (!Number.isFinite(numericTarget) || numericTarget < 0) {
      setTargetMessage("Enter a valid target amount.");
      return;
    }

    try {
      setSavingTarget(true);
      setTargetMessage("");

      const nextTargets = {
        ...monthlyTargets,
        [selectedMonth]: Math.round(numericTarget),
      };

      await setDoc(
        doc(firestore, "siteAssets", "dashboard"),
        {
          monthlyTargets: nextTargets,
          updatedAt: serverTimestamp(),
          updatedBy: user?.uid ?? null,
        },
        { merge: true },
      );

      setMonthlyTargets(nextTargets);
      setEditingTarget(false);
      setTargetMessage("Target saved.");
      window.setTimeout(() => setTargetMessage(""), 2200);
    } catch (error) {
      console.error("Unable to save monthly target:", error);
      setTargetMessage("Unable to save target.");
    } finally {
      setSavingTarget(false);
    }
  };

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
          <div ref={monthPickerRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setPickerYear(Number(selectedMonth.slice(0, 4)));
                  setMonthPickerOpen((open) => !open);
                }}
                className={`flex h-[40px] min-w-[240px] items-center gap-3 rounded-xl bg-white px-4 text-left shadow-sm ring-1 transition ${
                  monthPickerOpen
                    ? "ring-gold-400"
                    : "ring-gray-100 hover:ring-forest-200"
                }`}
                aria-haspopup="dialog"
                aria-expanded={monthPickerOpen}
                aria-label="Select dashboard month"
              >
                <CalendarDays
                  size={16}
                  className="shrink-0 text-gold-600"
                />

                <span className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="text-[9px] font-semibold uppercase tracking-[.16em] text-gray-400">
                    Period
                  </span>

                  <span className="truncate text-sm font-semibold text-forest-950">
                    {formatMonthLabel(selectedMonth)}
                  </span>
                </span>

                <ChevronDown
                  size={15}
                  className={`shrink-0 text-gray-400 transition-transform ${
                    monthPickerOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

            {monthPickerOpen && (
              <div className="absolute right-0 top-[calc(100%+10px)] z-[1000] w-[310px] overflow-hidden rounded-2xl border border-[#ddd4c4] bg-[#fffdf8] p-3 shadow-[0_24px_65px_rgba(19,37,25,.18)]">
                <div className="mb-3 flex items-center justify-between rounded-xl bg-[#f6f0e4] px-2 py-2">
                  <button
                    type="button"
                    onClick={() => setPickerYear((year) => year - 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-forest-700 transition hover:bg-white hover:text-forest-950"
                    aria-label="Previous year"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <div className="text-center">
                    <p className="text-[9px] font-semibold uppercase tracking-[.2em] text-gold-600">
                      Select month
                    </p>
                    <p className="font-serif text-lg text-forest-950">{pickerYear}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setPickerYear((year) =>
                        Math.min(Number(currentMonthKey.slice(0, 4)), year + 1),
                      )
                    }
                    disabled={pickerYear >= Number(currentMonthKey.slice(0, 4))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-forest-700 transition hover:bg-white hover:text-forest-950 disabled:cursor-not-allowed disabled:opacity-25"
                    aria-label="Next year"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    "Jan",
                    "Feb",
                    "Mar",
                    "Apr",
                    "May",
                    "Jun",
                    "Jul",
                    "Aug",
                    "Sep",
                    "Oct",
                    "Nov",
                    "Dec",
                  ].map((month, index) => {
                    const monthKey = `${pickerYear}-${String(index + 1).padStart(2, "0")}`;
                    const isSelected = monthKey === selectedMonth;
                    const isFuture = monthKey > currentMonthKey;

                    return (
                      <button
                        key={monthKey}
                        type="button"
                        disabled={isFuture}
                        onClick={() => {
                          setSelectedMonth(monthKey);
                          setMonthPickerOpen(false);
                        }}
                        className={`relative flex h-11 items-center justify-center rounded-xl border text-xs font-semibold transition ${
                          isSelected
                            ? "border-forest-700 bg-forest-800 text-white shadow-sm"
                            : isFuture
                              ? "cursor-not-allowed border-transparent bg-[#faf7f0] text-gray-300"
                              : "border-[#e6dfd2] bg-white text-forest-800 hover:border-gold-400 hover:bg-[#fbf5e8]"
                        }`}
                      >
                        {month}
                        {isSelected && (
                          <Check className="absolute right-1.5 top-1.5 h-3 w-3 text-gold-300" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-[#ece5d8] pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      const currentYear = Number(currentMonthKey.slice(0, 4));
                      setPickerYear(currentYear);
                      setSelectedMonth(currentMonthKey);
                      setMonthPickerOpen(false);
                    }}
                    className="text-[10px] font-semibold uppercase tracking-[.12em] text-gold-700 transition hover:text-gold-500"
                  >
                    Current month
                  </button>

                  <span className="text-[10px] text-gray-400">
                    {formatMonthLabel(selectedMonth)}
                  </span>
                </div>
              </div>
            )}
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
          {metricCards.map(
            ({
              label,
              value,
              change,
              changeCaption,
              changeValue,
              icon: Icon,
              accent,
              href,
            }) => {
              const content = (
                <>
                  <div className="mb-3 flex items-center justify-between">
                    <p className={`text-sm ${accent ? "text-forest-100" : "text-gray-500"}`}>
                      {label}
                    </p>
                    <span
                      className={`rounded-lg p-2 ${accent ? "bg-white/15 text-gold-300" : "bg-forest-100 text-forest-700"}`}
                    >
                      <Icon size={19} />
                    </span>
                  </div>

                  <div className="flex items-end justify-between gap-3">
                    <strong
                      className={`text-2xl xl:text-[1.65rem] ${accent ? "text-white" : "text-forest-950"}`}
                    >
                      {value}
                    </strong>

                    <div
                      className={`text-right text-[10px] font-semibold ${
                        accent
                          ? "text-gold-300"
                          : changeValue < 0
                            ? "text-red-500"
                            : "text-emerald-600"
                      }`}
                    >
                      <span className="block">{change}</span>
                      {changeCaption && (
                        <span
                          className={`block font-normal ${
                            accent ? "text-forest-100" : "text-gray-400"
                          }`}
                        >
                          {changeCaption}
                        </span>
                      )}
                    </div>
                  </div>
                </>
              );

              const className = `rounded-2xl border border-forest-100 p-4 ${
                accent
                  ? "bg-forest-700 text-white"
                  : "bg-gradient-to-br from-white to-forest-50"
              } shadow-sm ${
                href
                  ? "group cursor-pointer transition hover:-translate-y-0.5 hover:border-gold-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
                  : ""
              }`;

              return href ? (
                <Link
                  key={label}
                  href={href}
                  className={className}
                  aria-label={`Open ${label}`}
                >
                  {content}
                </Link>
              ) : (
                <article key={label} className={className}>
                  {content}
                </article>
              );
            },
          )}
        </div>

        <div className="mt-3 grid gap-3 xl:mt-2 xl:min-h-0 xl:flex-[1.18] xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,.8fr)]">
          <article className="min-h-0 rounded-2xl bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="font-serif text-xl text-forest-950">Revenue Analytics</h2>
                <div className="mt-2 flex gap-4 text-xs text-gray-400">
                  <span className="text-forest-700">— {formatMonthLabel(selectedMonth)}</span>
                  <span className="text-gold-600">-- {dashboard.previousMonthLabel}</span>
                </div>
              </div>
              <span className="rounded-lg bg-forest-700 px-3 py-2 text-xs text-white">
                {formatMonthLabel(selectedMonth)}
              </span>
            </div>

            <div className="relative h-48 overflow-hidden xl:h-[calc(100%-3.5rem)] xl:min-h-[150px]">
              <div className="absolute inset-x-0 top-0 bottom-5 flex flex-col justify-between py-2">
                {[1, 0.75, 0.5, 0.25, 0].map((factor) => (
                  <div
                    key={factor}
                    className="border-t border-dashed border-gray-100 text-[10px] text-gray-300"
                  >
                    {formatCurrency(chartMaxRevenue * factor)}
                  </div>
                ))}
              </div>
              <svg
                viewBox="0 0 650 190"
                preserveAspectRatio="none"
                className="absolute inset-x-0 top-0 h-[calc(100%-1.25rem)] w-full"
                aria-label={`Revenue and order activity for ${formatMonthLabel(selectedMonth)}`}
              >
                <polyline
                  points={revenuePoints}
                  fill="none"
                  stroke="#214f19"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <polyline
                  points={previousRevenuePoints}
                  fill="none"
                  stroke="#c89c4a"
                  strokeWidth="3"
                  strokeDasharray="8 8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="absolute inset-x-0 bottom-0 flex justify-between text-[9px] text-gray-400">
                {dashboard.daily.map((day, index) => {
                  const showLabel =
                    index === 0 ||
                    index === dashboard.daily.length - 1 ||
                    day.day === 8 ||
                    day.day === 15 ||
                    day.day === 22;

                  return (
                    <span
                      key={day.label}
                      className={`min-w-0 flex-1 text-center ${showLabel ? "opacity-100" : "opacity-0"}`}
                    >
                      {day.label}
                    </span>
                  );
                })}
              </div>
            </div>
          </article>

          <article className="min-h-0 rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-serif text-xl text-forest-950">Monthly Target</h2>
              <span className="text-[10px] font-semibold uppercase tracking-[.12em] text-gray-400">
                {formatMonthLabel(selectedMonth)}
              </span>
            </div>
            <div className="relative mx-auto mt-3 h-36 w-36 2xl:h-40 2xl:w-40">
              <svg
                viewBox="0 0 120 120"
                className="h-full w-full -rotate-90"
                aria-label={`${dashboard.targetProgress.toFixed(0)} percent monthly target`}
              >
                <circle cx="60" cy="60" r="47" fill="none" stroke="#eadfc8" strokeWidth="14" />
                <circle
                  cx="60"
                  cy="60"
                  r="47"
                  fill="none"
                  stroke="#214f19"
                  strokeWidth="14"
                  strokeLinecap="round"
                  pathLength="100"
                  strokeDasharray={`${dashboard.targetProgress} ${100 - dashboard.targetProgress}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <strong className="text-3xl text-forest-950">
                  {dashboard.targetProgress.toFixed(0)}%
                </strong>
                <div className="mt-1 text-center text-[11px]">
                  <p className={dashboard.revenueChange >= 0 ? "text-emerald-600" : "text-red-500"}>
                    {formatChange(dashboard.revenueChange)}
                  </p>
                  <p className="text-[9px] text-gray-400">vs {dashboard.previousMonthLabel}</p>
                </div>
              </div>
            </div>
            <p className="mt-1 text-center text-sm font-semibold">
              {dashboard.targetProgress >= 100
                ? "Target reached!"
                : dashboard.targetProgress >= 75
                  ? "Great progress!"
                  : "Tracking this month"}
            </p>
            <p className="mx-auto mt-1 max-w-xs text-center text-[11px] leading-4 text-gray-400">
              Revenue is counted only from paid, processing, shipped, delivered, completed or fulfilled orders for the selected month.
            </p>
            <div className="mt-3 rounded-xl bg-[#f5eddf] p-2.5 text-xs">
              <div className="grid grid-cols-2 divide-x text-center">
                <div className="px-2">
                  <div className="flex items-center justify-center gap-1.5">
                    <p className="text-gray-400">Configured Target</p>
                    {!editingTarget && (
                      <button
                        type="button"
                        onClick={() => setEditingTarget(true)}
                        className="text-forest-700 transition hover:text-gold-600"
                        aria-label="Edit monthly target"
                      >
                        <Pencil size={12} />
                      </button>
                    )}
                  </div>
                  {editingTarget ? (
                    <div className="mt-1 flex items-center justify-center gap-1.5">
                      <span className="font-semibold text-forest-900">₱</span>
                      <input
                        value={targetDraft}
                        onChange={(event) => setTargetDraft(event.target.value)}
                        inputMode="numeric"
                        className="w-24 rounded-md border border-forest-200 bg-white px-2 py-1 text-right font-semibold text-forest-950 outline-none focus:border-forest-500"
                        aria-label="Monthly sales target"
                      />
                      <button
                        type="button"
                        disabled={savingTarget}
                        onClick={() => void saveMonthlyTarget()}
                        className="rounded-md bg-forest-700 p-1.5 text-white transition hover:bg-forest-800 disabled:opacity-50"
                        aria-label="Save monthly target"
                      >
                        <Save size={12} />
                      </button>
                    </div>
                  ) : (
                    <strong>{formatCurrency(dashboard.monthlyTarget)}</strong>
                  )}
                </div>
                <div className="px-2">
                  <p className="text-gray-400">Selected Month</p>
                  <strong>{formatCurrency(dashboard.selectedMonthRevenue)}</strong>
                </div>
              </div>
              {targetMessage && (
                <p className={`mt-2 text-center text-[10px] ${targetMessage === "Target saved." ? "text-emerald-600" : "text-red-500"}`}>
                  {targetMessage}
                </p>
              )}
            </div>
          </article>
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-[.8fr_1.5fr_1fr] xl:mt-2 xl:min-h-0 xl:flex-1">
          <article className="min-h-0 overflow-visible rounded-2xl bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-serif text-xl">Top Wishlisted</h2>
                <p className="text-[10px] text-gray-400">Across customer wishlists</p>
              </div>
              <Heart size={19} className="text-gray-400" />
            </div>

            {wishlistStats.length ? (
              <div className="space-y-1.5">
                {wishlistStats.map((item, index) => {
                  const visibleColors = item.colors.slice(0, 3);
                  const extraColors = Math.max(0, item.colors.length - visibleColors.length);

                  return (
                    <div
                      key={item.productId}
                      className="group relative rounded-xl px-2 py-1.5 transition hover:bg-[#f7f2e8]"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-forest-50 text-[10px] font-bold text-forest-700">
                          {index + 1}

                          <div className="pointer-events-none absolute bottom-[calc(100%+10px)] left-1/2 z-[80] hidden w-40 -translate-x-1/2 translate-y-1 overflow-hidden rounded-lg bg-forest-900 p-2 text-white opacity-0 shadow-lg transition-all duration-150 before:absolute before:left-1/2 before:top-full before:-translate-x-1/2 before:border-4 before:border-transparent before:border-t-forest-900 group-hover:block group-hover:translate-y-0 group-hover:opacity-100">
                            <div className="relative mb-2 aspect-[4/3] overflow-hidden rounded-md bg-white/10">
                              {item.image ? (
                                <Image
                                  src={item.image}
                                  alt={`${item.name}${item.previewColor ? ` in ${formatColorLabel(item.previewColor)}` : ""}`}
                                  fill
                                  sizes="160px"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-lg font-semibold text-gold-300">
                                  {item.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <p className="truncate text-xs font-semibold">{item.name}</p>
                            <p className="mt-0.5 truncate text-[10px] text-forest-100">
                              {item.previewColor
                                ? `${formatColorLabel(item.previewColor)} · ${item.colors[0]?.count ?? 0} ${
                                    (item.colors[0]?.count ?? 0) === 1 ? "save" : "saves"
                                  }`
                                : "No color data"}
                            </p>
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-xs font-semibold text-forest-950">
                              {item.name}
                            </p>
                            <span className="ml-auto shrink-0 text-[10px] font-semibold text-forest-700">
                              {item.totalSaves} {item.totalSaves === 1 ? "save" : "saves"}
                            </span>
                          </div>

                          <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[9px] text-gray-400">
                            <span className="shrink-0 capitalize">
                              {item.category.toLowerCase()}
                            </span>
                            {visibleColors.length > 0 && <span className="text-gray-300">•</span>}
                            <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
                              {visibleColors.map((color) => (
                                <span
                                  key={`${item.productId}:${color.name}`}
                                  className="group/color relative flex shrink-0 items-center gap-1"
                                >
                                  <span
                                    className="h-2 w-2 rounded-full border border-black/10"
                                    style={{ background: getColorSwatch(color.name) }}
                                  />
                                  <span>{color.count}</span>

                                  <span className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-[90] hidden -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-lg bg-forest-900 px-3 py-2 text-xs font-medium text-white opacity-0 shadow-lg transition-all duration-150 before:absolute before:left-1/2 before:top-full before:-translate-x-1/2 before:border-4 before:border-transparent before:border-t-forest-900 group-hover/color:block group-hover/color:translate-y-0 group-hover/color:opacity-100">
                                    <span className="flex items-center gap-2">
                                      <span
                                        className="h-2.5 w-2.5 rounded-full border border-white/20"
                                        style={{ background: getColorSwatch(color.name) }}
                                      />
                                      <span>
                                        {formatColorLabel(color.name)} · {color.count}{" "}
                                        {color.count === 1 ? "save" : "saves"}
                                      </span>
                                    </span>
                                  </span>
                                </span>
                              ))}
                              {extraColors > 0 && (
                                <span className="shrink-0">+{extraColors} more</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[#eee5d5]">
                        <div
                          className="h-full rounded-full bg-gold-500"
                          style={{
                            width: `${Math.max(6, (item.totalSaves / maxWishlistSaves) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex min-h-[150px] items-center justify-center text-center text-sm text-gray-400">
                No wishlist data yet.
              </div>
            )}
          </article>

          <article className="min-h-0 overflow-hidden rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-xl">Order Status</h2>
                <p className="text-[10px] text-gray-400">{formatMonthLabel(selectedMonth)}</p>
              </div>
              <BarChart3 className="text-gray-400" size={19} />
            </div>
            {dashboard.statusBreakdown.length ? (
              <div className="mt-4 flex h-[calc(100%-3rem)] min-h-[140px] items-end gap-3 border-b border-gray-100">
                {dashboard.statusBreakdown.map((item, index) => (
                  <Link
                    key={item.status}
                    href={`/admin/orders?status=${encodeURIComponent(
                      item.status,
                    )}&month=${selectedMonth}`}
                    className="group/status flex h-full flex-1 flex-col justify-end rounded-t-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
                    aria-label={`View ${item.status.replace(/-/g, " ")} orders for ${formatMonthLabel(
                      selectedMonth,
                    )}`}
                  >
                    <div className="mb-1 text-center text-[10px] font-semibold text-forest-800 transition group-hover/status:text-gold-700">
                      {item.count}
                    </div>

                    <div
                      className="rounded-t-xl bg-forest-700/90 transition-all group-hover/status:bg-forest-600 group-hover/status:shadow-[0_-3px_10px_rgba(18,60,45,.12)]"
                      style={{
                        height: `${Math.max(8, item.percentage)}%`,
                        opacity: 1 - index * 0.1,
                      }}
                    />

                    <p className="mt-2 truncate text-center text-[9px] capitalize text-gray-400 transition group-hover/status:text-forest-700">
                      {item.status.replace(/-/g, " ")}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex min-h-[140px] items-center justify-center text-sm text-gray-400">
                No orders yet.
              </div>
            )}
          </article>

          <article className="min-h-0 overflow-visible rounded-2xl bg-white p-4 shadow-sm">
            <div className="mb-3 flex justify-between">
              <div>
                <h2 className="font-serif text-xl">Top Categories</h2>
                <p className="text-[10px] text-gray-400">{formatMonthLabel(selectedMonth)}</p>
              </div>
              <Boxes className="text-gray-400" size={19} />
            </div>
            {dashboard.topCategories.length ? (
              <>
                <div
                  className="relative mx-auto h-28 w-28 2xl:h-32 2xl:w-32"
                  onMouseLeave={() => setHoveredCategoryIndex(null)}
                >
                  <svg
                    viewBox="0 0 120 120"
                    className="h-full w-full"
                    role="img"
                    aria-label={`Top categories for ${formatMonthLabel(selectedMonth)}`}
                  >
                    <circle
                      cx="60"
                      cy="60"
                      r="44"
                      fill="none"
                      stroke="#f1eadc"
                      strokeWidth="16"
                    />

                    {dashboard.topCategories.map((category, index) => {
                      const offset = dashboard.topCategories
                        .slice(0, index)
                        .reduce((sum, entry) => sum + entry.percentage, 0);

                      return (
                        <circle
                          key={category.name}
                          cx="60"
                          cy="60"
                          r="44"
                          fill="none"
                          stroke={categoryColors[index % categoryColors.length]}
                          strokeWidth={hoveredCategoryIndex === index ? 18 : 16}
                          pathLength="100"
                          strokeDasharray={`${category.percentage} ${100 - category.percentage}`}
                          strokeDashoffset={-offset}
                          transform="rotate(-90 60 60)"
                          className="cursor-pointer transition-all duration-150"
                          onMouseEnter={() => setHoveredCategoryIndex(index)}
                        >
                        </circle>
                      );
                    })}
                  </svg>

                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xs text-gray-400">Items</span>
                    <strong className="text-xl">{dashboard.totalItems}</strong>
                  </div>

                  {hoveredCategoryIndex !== null &&
                    dashboard.topCategories[hoveredCategoryIndex] && (
                      <div className="pointer-events-none absolute left-1/2 top-0 z-[80] -translate-x-1/2 -translate-y-[calc(100%+10px)] whitespace-nowrap rounded-lg bg-forest-900 px-3 py-2 text-xs font-medium text-white shadow-lg before:absolute before:left-1/2 before:top-full before:-translate-x-1/2 before:border-4 before:border-transparent before:border-t-forest-900">
                        <span className="block capitalize">
                          {dashboard.topCategories[hoveredCategoryIndex].name.toLowerCase()}
                        </span>
                        <span className="mt-0.5 block text-[10px] text-gold-300">
                          {dashboard.topCategories[hoveredCategoryIndex].quantity} items ·{" "}
                          {dashboard.topCategories[hoveredCategoryIndex].percentage.toFixed(1)}%
                        </span>
                      </div>
                    )}
                </div>

                <div className="mt-3 space-y-2 text-xs">
                  {dashboard.topCategories.map((category, index) => (
                    <div
                      key={category.name}
                      className="flex items-center rounded-md px-1 py-0.5"
                    >
                      <span
                        className="mr-2 h-2 w-2 rounded-sm"
                        style={{
                          backgroundColor:
                            categoryColors[index % categoryColors.length],
                        }}
                      />
                      <span className="truncate capitalize text-gray-500">
                        {category.name.toLowerCase()}
                      </span>
                      <span className="ml-auto mr-2 text-[10px] text-gray-400">
                        {category.quantity}
                      </span>
                      <strong>{category.percentage.toFixed(0)}%</strong>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex min-h-[150px] items-center justify-center text-center text-sm text-gray-400">
                No order item data yet.
              </div>
            )}
          </article>
        </div>
      </section>
    </main>
  );
}
