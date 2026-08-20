"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  collection,
  onSnapshot,
} from "firebase/firestore";
import { getIdTokenResult } from "firebase/auth";
import {
  BadgePercent,
  CalendarDays,
  Infinity as InfinityIcon,
  Pencil,
  Plus,
  Search,
  Tag,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { firestore } from "@/lib/firebase";
import AdminPageSkeleton from "@/components/AdminPageSkeleton";
import AdminToast from "@/components/AdminToast";
import AdminConfirmModal from "@/components/AdminConfirmModal";
import AdminSelect from "@/components/AdminSelect";

type CouponType =
  | "percentage"
  | "fixed";

type CouponRecord = {
  docId: string;
  code: string;
  active: boolean;
  type: CouponType;
  value: number;
  minimumSpend?: number | null;
  maximumDiscount?: number | null;
  startsAt?: string | null;
  expiresAt?: string | null;
  usageLimit?: number | null;
  usageCount?: number;
  applicableProducts?: Array<
    number | string
  >;
  applicableCategories?: string[];
  createdAt?: string | null;
  updatedAt?: string | null;
};

type ProductOption = {
  docId: string;
  id: number;
  name: string;
  category: string;
  active?: boolean;
};

type CouponForm = {
  code: string;
  active: boolean;
  type: CouponType;
  value: string;
  minimumSpend: string;
  maximumDiscount: string;
  usageLimit: string;
  startsAt: string;
  expiresAt: string;
  applicableProducts: number[];
  applicableCategories: string[];
};

const emptyForm: CouponForm = {
  code: "",
  active: true,
  type: "percentage",
  value: "",
  minimumSpend: "",
  maximumDiscount: "",
  usageLimit: "",
  startsAt: "",
  expiresAt: "",
  applicableProducts: [],
  applicableCategories: [],
};

const normalizeCouponCode = (
  value: string,
) =>
  value
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");

const money = (
  value: number | null | undefined,
) =>
  Number(value || 0).toLocaleString(
    "en-PH",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
  );

const nullableNumber = (
  value: string,
) => {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);

  return Number.isFinite(parsed)
    ? parsed
    : null;
};

const timestampToInput = (
  value?: string | null,
) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const localDate = new Date(
    date.getTime() -
      date.getTimezoneOffset() *
        60 *
        1000,
  );

  return localDate
    .toISOString()
    .slice(0, 16);
};

const inputToIso = (
  value: string,
) => {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? null
    : date.toISOString();
};

const formatDate = (
  value?: string | null,
) => {
  if (!value) return "No limit";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "No limit";
  }

  return date.toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const getCouponAvailability = (
  coupon: CouponRecord,
) => {
  const now = new Date();

  if (!coupon.active) {
    return {
      label: "Inactive",
      className:
        "bg-gray-100 text-gray-600",
    };
  }

  if (
    coupon.startsAt &&
    now < new Date(coupon.startsAt)
  ) {
    return {
      label: "Scheduled",
      className:
        "bg-blue-50 text-blue-700",
    };
  }

  if (
    coupon.expiresAt &&
    now > new Date(coupon.expiresAt)
  ) {
    return {
      label: "Expired",
      className:
        "bg-red-50 text-red-700",
    };
  }

  if (
    coupon.usageLimit !== null &&
    coupon.usageLimit !== undefined &&
    Number(coupon.usageCount || 0) >=
      Number(coupon.usageLimit)
  ) {
    return {
      label:
        Number(coupon.usageLimit) === 0
          ? "Disabled by limit"
          : "Limit reached",
      className:
        "bg-amber-50 text-amber-700",
    };
  }

  return {
    label: "Active",
    className:
      "bg-[#dfe8df] text-[#24452c]",
  };
};

export default function CouponsAdminPage() {
  const {
    user,
    loading,
  } = useAuth();

  const [
    allowed,
    setAllowed,
  ] = useState<boolean | null>(
    null,
  );

  const [
    coupons,
    setCoupons,
  ] = useState<CouponRecord[]>(
    [],
  );

  const [
    products,
    setProducts,
  ] = useState<ProductOption[]>(
    [],
  );

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("all");

  const [
    formOpen,
    setFormOpen,
  ] = useState(false);

  const [
    editingCode,
    setEditingCode,
  ] = useState<string | null>(
    null,
  );

  const [
    form,
    setForm,
  ] = useState<CouponForm>(
    emptyForm,
  );

  const [
    productSearch,
    setProductSearch,
  ] = useState("");

  const [
    confirmSave,
    setConfirmSave,
  ] = useState(false);

  const [
    deleteTarget,
    setDeleteTarget,
  ] = useState<CouponRecord | null>(
    null,
  );

  const loadCoupons = async (
    currentUser = user,
  ) => {
    if (!currentUser) {
      return;
    }

    const idToken =
      await currentUser.getIdToken();

    const response =
      await fetch(
        "/api/admin/coupons",
        {
          headers: {
            Authorization:
              `Bearer ${idToken}`,
          },
          cache: "no-store",
        },
      );

    const result =
      (await response
        .json()
        .catch(() => null)) as
        | {
            coupons?: CouponRecord[];
            error?: string;
          }
        | null;

    if (!response.ok) {
      throw new Error(
        result?.error ||
          "Unable to load coupons.",
      );
    }

    setCoupons(
      Array.isArray(
        result?.coupons,
      )
        ? result.coupons
        : [],
    );
  };

  useEffect(() => {
    if (loading) return;

    if (!user) {
      setAllowed(false);
      return;
    }

    let stopProducts:
      | (() => void)
      | undefined;

    let cancelled = false;

    getIdTokenResult(
      user,
      true,
    )
      .then((token) => {
        if (cancelled) return;

        const isAdmin =
          token.claims.admin === true;

        setAllowed(isAdmin);

        if (!isAdmin) return;

        loadCoupons(user).catch(
          (error) => {
            console.error(error);
            setMessage(
              error instanceof Error
                ? error.message
                : "Unable to load coupons.",
            );
          },
        );

        stopProducts = onSnapshot(
          collection(
            firestore,
            "products",
          ),
          (snapshot) => {
            setProducts(
              snapshot.docs
                .map(
                  (entry) =>
                    ({
                      docId:
                        entry.id,
                      ...entry.data(),
                    }) as ProductOption,
                )
                .filter(
                  (product) =>
                    Number.isFinite(
                      Number(
                        product.id,
                      ),
                    ),
                )
                .sort((a, b) =>
                  a.name.localeCompare(
                    b.name,
                  ),
                ),
            );
          },
          (error) => {
            console.error(error);
            setMessage(
              "Unable to load products for coupon restrictions.",
            );
          },
        );
      })
      .catch((error) => {
        console.error(error);
        setAllowed(false);
      });

    return () => {
      cancelled = true;
      stopProducts?.();
    };
  }, [
    user,
    loading,
  ]);

  useEffect(() => {
    if (!message) return;

    const timeout =
      window.setTimeout(
        () => setMessage(""),
        3200,
      );

    return () =>
      window.clearTimeout(
        timeout,
      );
  }, [message]);

  useEffect(() => {
    if (!formOpen) return;

    const previousOverflow =
      document.body.style
        .overflow;

    document.body.style.overflow =
      "hidden";

    const onKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (
        event.key ===
          "Escape" &&
        !saving
      ) {
        closeForm();
      }
    };

    window.addEventListener(
      "keydown",
      onKeyDown,
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        onKeyDown,
      );
    };
  }, [
    formOpen,
    saving,
  ]);

  const categories =
    useMemo(
      () =>
        Array.from(
          new Set(
            products
              .map((product) =>
                String(
                  product.category ||
                    "",
                )
                  .trim()
                  .toUpperCase(),
              )
              .filter(Boolean),
          ),
        ).sort(),
      [products],
    );

  const filteredProducts =
    useMemo(() => {
      const query =
        productSearch
          .trim()
          .toLowerCase();

      if (!query) {
        return products;
      }

      return products.filter(
        (product) =>
          `${product.name} ${product.category} ${product.id}`
            .toLowerCase()
            .includes(query),
      );
    }, [
      products,
      productSearch,
    ]);

  const filteredCoupons =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return coupons.filter(
        (coupon) => {
          const availability =
            getCouponAvailability(
              coupon,
            );

          const matchesSearch =
            !query ||
            `${coupon.code} ${coupon.type} ${availability.label}`
              .toLowerCase()
              .includes(query);

          const matchesStatus =
            statusFilter ===
              "all" ||
            (statusFilter ===
              "active" &&
              availability.label ===
                "Active") ||
            (statusFilter ===
              "inactive" &&
              availability.label ===
                "Inactive") ||
            (statusFilter ===
              "scheduled" &&
              availability.label ===
                "Scheduled") ||
            (statusFilter ===
              "expired" &&
              availability.label ===
                "Expired") ||
            (statusFilter ===
              "limited" &&
              (availability.label ===
                "Limit reached" ||
                availability.label ===
                  "Disabled by limit"));

          return (
            matchesSearch &&
            matchesStatus
          );
        },
      );
    }, [
      coupons,
      search,
      statusFilter,
    ]);

  const totalRedemptions =
    useMemo(
      () =>
        coupons.reduce(
          (
            total,
            coupon,
          ) =>
            total +
            Number(
              coupon.usageCount ||
                0,
            ),
          0,
        ),
      [coupons],
    );

  const activeCount =
    useMemo(
      () =>
        coupons.filter(
          (coupon) =>
            getCouponAvailability(
              coupon,
            ).label ===
            "Active",
        ).length,
      [coupons],
    );

  const unavailableCount =
    coupons.length -
    activeCount;

  const openAdd = () => {
    setEditingCode(null);
    setForm(emptyForm);
    setProductSearch("");
    setMessage("");
    setFormOpen(true);
  };

  const openEdit = (
    coupon: CouponRecord,
  ) => {
    setEditingCode(
      coupon.docId,
    );

    setForm({
      code:
        coupon.code ||
        coupon.docId,
      active:
        coupon.active !== false,
      type:
        coupon.type ||
        "percentage",
      value:
        String(
          coupon.value ?? "",
        ),
      minimumSpend:
        coupon.minimumSpend ===
          null ||
        coupon.minimumSpend ===
          undefined
          ? ""
          : String(
              coupon.minimumSpend,
            ),
      maximumDiscount:
        coupon.maximumDiscount ===
          null ||
        coupon.maximumDiscount ===
          undefined
          ? ""
          : String(
              coupon.maximumDiscount,
            ),
      usageLimit:
        coupon.usageLimit ===
          null ||
        coupon.usageLimit ===
          undefined
          ? ""
          : String(
              coupon.usageLimit,
            ),
      startsAt:
        timestampToInput(
          coupon.startsAt,
        ),
      expiresAt:
        timestampToInput(
          coupon.expiresAt,
        ),
      applicableProducts:
        (
          coupon.applicableProducts ||
          []
        )
          .map(Number)
          .filter(
            Number.isFinite,
          ),
      applicableCategories:
        (
          coupon.applicableCategories ||
          []
        )
          .map((category) =>
            String(category)
              .trim()
              .toUpperCase(),
          )
          .filter(Boolean),
    });

    setProductSearch("");
    setMessage("");
    setFormOpen(true);
  };

  const closeForm = () => {
    if (saving) return;

    setEditingCode(null);
    setForm(emptyForm);
    setProductSearch("");
    setFormOpen(false);
    setConfirmSave(false);
  };

  const validateForm = () => {
    const code =
      normalizeCouponCode(
        form.code,
      );

    if (
      !/^[A-Z0-9_-]{3,32}$/.test(
        code,
      )
    ) {
      return "Coupon code must be 3-32 characters using letters, numbers, dashes, or underscores.";
    }

    const value =
      Number(form.value);

    if (
      !Number.isFinite(
        value,
      ) ||
      value <= 0
    ) {
      return "Enter a valid discount value greater than 0.";
    }

    if (
      form.type ===
        "percentage" &&
      value > 100
    ) {
      return "Percentage discounts cannot be greater than 100%.";
    }

    const minimumSpend =
      nullableNumber(
        form.minimumSpend,
      );

    if (
      minimumSpend !== null &&
      minimumSpend < 0
    ) {
      return "Minimum spend cannot be negative.";
    }

    const maximumDiscount =
      nullableNumber(
        form.maximumDiscount,
      );

    if (
      maximumDiscount !==
        null &&
      maximumDiscount < 0
    ) {
      return "Maximum discount cannot be negative.";
    }

    const usageLimit =
      nullableNumber(
        form.usageLimit,
      );

    if (
      usageLimit !== null &&
      (!Number.isInteger(
        usageLimit,
      ) ||
        usageLimit < 0)
    ) {
      return "Usage limit must be a whole number of 0 or greater.";
    }

    if (
      form.startsAt &&
      form.expiresAt &&
      new Date(
        form.expiresAt,
      ).getTime() <=
        new Date(
          form.startsAt,
        ).getTime()
    ) {
      return "Expiry must be later than the start date.";
    }

    return "";
  };

  const requestSave = (
    event: FormEvent,
  ) => {
    event.preventDefault();

    const validationError =
      validateForm();

    if (validationError) {
      setMessage(
        validationError,
      );
      return;
    }

    setConfirmSave(true);
  };

  const saveCoupon =
    async () => {
      const validationError =
        validateForm();

      if (validationError) {
        setConfirmSave(false);
        setMessage(
          validationError,
        );
        return;
      }

      const code =
        normalizeCouponCode(
          form.code,
        );

      const existingCoupon =
        editingCode
          ? coupons.find(
              (coupon) =>
                coupon.docId ===
                editingCode,
            )
          : null;

      if (
        !editingCode &&
        coupons.some(
          (coupon) =>
            coupon.docId ===
              code ||
            normalizeCouponCode(
              coupon.code,
            ) === code,
        )
      ) {
        setConfirmSave(false);
        setMessage(
          `Coupon ${code} already exists.`,
        );
        return;
      }

      setSaving(true);
      setConfirmSave(false);
      setMessage("");

      try {
        const minimumSpend =
          nullableNumber(
            form.minimumSpend,
          );

        const maximumDiscount =
          nullableNumber(
            form.maximumDiscount,
          );

        const usageLimit =
          nullableNumber(
            form.usageLimit,
          );

        if (!user) {
          throw new Error(
            "Authentication required.",
          );
        }

        const idToken =
          await user.getIdToken();

        const payload = {
          code,
          active:
            form.active,
          type:
            form.type,
          value:
            Number(
              form.value,
            ),
          minimumSpend:
            minimumSpend ??
            0,
          maximumDiscount,
          usageLimit:
            usageLimit ===
            null
              ? null
              : Math.floor(
                  usageLimit,
                ),
          startsAt:
            inputToIso(
              form.startsAt,
            ),
          expiresAt:
            inputToIso(
              form.expiresAt,
            ),
          applicableProducts:
            Array.from(
              new Set(
                form.applicableProducts,
              ),
            ),
          applicableCategories:
            Array.from(
              new Set(
                form.applicableCategories.map(
                  (
                    category,
                  ) =>
                    category
                      .trim()
                      .toUpperCase(),
                ),
              ),
            ).filter(
              Boolean,
            ),
        };

        const response =
          await fetch(
            "/api/admin/coupons",
            {
              method:
                existingCoupon
                  ? "PATCH"
                  : "POST",
              headers: {
                "Content-Type":
                  "application/json",
                Authorization:
                  `Bearer ${idToken}`,
              },
              body:
                existingCoupon
                  ? JSON.stringify({
                      docId:
                        existingCoupon.docId,
                      action:
                        "update",
                      payload,
                    })
                  : JSON.stringify(
                      payload,
                    ),
            },
          );

        const result =
          (await response
            .json()
            .catch(() => null)) as
            | {
                success?: boolean;
                error?: string;
              }
            | null;

        if (!response.ok) {
          throw new Error(
            result?.error ||
              "Unable to save coupon.",
          );
        }

        await loadCoupons(user);

        setMessage(
          existingCoupon
            ? `Coupon ${code} updated.`
            : `Coupon ${code} created.`,
        );

        closeForm();
      } catch (error) {
        console.error(error);

        setMessage(
          "Unable to save coupon. Confirm your admin role and Firestore rules.",
        );
      } finally {
        setSaving(false);
      }
    };

  const toggleCoupon =
    async (
      coupon: CouponRecord,
    ) => {
      if (!user) return;

      try {
        const idToken =
          await user.getIdToken();

        const response =
          await fetch(
            "/api/admin/coupons",
            {
              method: "PATCH",
              headers: {
                "Content-Type":
                  "application/json",
                Authorization:
                  `Bearer ${idToken}`,
              },
              body: JSON.stringify({
                docId:
                  coupon.docId,
                action:
                  "toggle",
              }),
            },
          );

        const result =
          (await response
            .json()
            .catch(() => null)) as
            | {
                error?: string;
              }
            | null;

        if (!response.ok) {
          throw new Error(
            result?.error ||
              "Unable to update coupon status.",
          );
        }

        await loadCoupons(user);

        setMessage(
          `${coupon.code} ${coupon.active ? "disabled" : "enabled"}.`,
        );
      } catch (error) {
        console.error(error);

        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to update coupon status.",
        );
      }
    };

  const confirmDelete =
    async () => {
      if (
        !deleteTarget ||
        !user
      ) {
        return;
      }

      setSaving(true);

      try {
        const idToken =
          await user.getIdToken();

        const response =
          await fetch(
            "/api/admin/coupons",
            {
              method: "DELETE",
              headers: {
                "Content-Type":
                  "application/json",
                Authorization:
                  `Bearer ${idToken}`,
              },
              body: JSON.stringify({
                docId:
                  deleteTarget.docId,
              }),
            },
          );

        const result =
          (await response
            .json()
            .catch(() => null)) as
            | {
                error?: string;
              }
            | null;

        if (!response.ok) {
          throw new Error(
            result?.error ||
              "Unable to delete coupon.",
          );
        }

        await loadCoupons(user);

        setMessage(
          `Coupon ${deleteTarget.code} deleted.`,
        );

        setDeleteTarget(
          null,
        );
      } catch (error) {
        console.error(error);

        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to delete coupon.",
        );
      } finally {
        setSaving(false);
      }
    };

  const toggleProduct = (
    productId: number,
  ) => {
    setForm((current) => ({
      ...current,
      applicableProducts:
        current.applicableProducts.includes(
          productId,
        )
          ? current.applicableProducts.filter(
              (id) =>
                id !==
                productId,
            )
          : [
              ...current.applicableProducts,
              productId,
            ],
    }));
  };

  const toggleCategory = (
    category: string,
  ) => {
    setForm((current) => ({
      ...current,
      applicableCategories:
        current.applicableCategories.includes(
          category,
        )
          ? current.applicableCategories.filter(
              (value) =>
                value !==
                category,
            )
          : [
              ...current.applicableCategories,
              category,
            ],
    }));
  };

  if (
    loading ||
    allowed === null
  ) {
    return (
      <AdminPageSkeleton />
    );
  }

  if (!allowed) {
    return (
      <main className="min-h-screen bg-[#f4f7f2] pt-24 text-center">
        Administrator access required.
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f7f2] py-6 sm:py-8">
      <div className="mx-auto w-full max-w-[1480px] px-5 lg:px-8">
        <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-gold-600">
              Administration
            </p>

            <h1 className="font-serif text-3xl text-forest-950">
              Coupon Management
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Create and manage checkout
              discounts stored in
              Firestore.
            </p>
          </div>

          <button
            type="button"
            onClick={openAdd}
            className="flex items-center gap-2 rounded-lg bg-forest-700 px-5 py-3 font-semibold text-white transition hover:bg-forest-800"
          >
            <Plus size={18} />
            Add Coupon
          </button>
        </header>

        <AdminToast
          message={message}
          onDismiss={() =>
            setMessage("")
          }
          tone={
            message.includes(
              "Unable",
            ) ||
            message.includes(
              "cannot",
            ) ||
            message.includes(
              "already",
            ) ||
            message.includes(
              "valid",
            ) ||
            message.includes(
              "required",
            )
              ? "error"
              : "success"
          }
        />

        <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[.14em] text-gray-500">
                Coupons
              </p>
              <Tag
                size={18}
                className="text-gold-600"
              />
            </div>
            <p className="mt-3 text-2xl font-bold text-forest-950">
              {coupons.length}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[.14em] text-gray-500">
                Active now
              </p>
              <BadgePercent
                size={18}
                className="text-forest-700"
              />
            </div>
            <p className="mt-3 text-2xl font-bold text-forest-950">
              {activeCount}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[.14em] text-gray-500">
                Unavailable
              </p>
              <CalendarDays
                size={18}
                className="text-gray-500"
              />
            </div>
            <p className="mt-3 text-2xl font-bold text-forest-950">
              {unavailableCount}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[.14em] text-gray-500">
                Redemptions
              </p>
              <Users
                size={18}
                className="text-gold-600"
              />
            </div>
            <p className="mt-3 text-2xl font-bold text-forest-950">
              {totalRedemptions}
            </p>
          </div>
        </section>

        <section className="rounded-2xl border bg-white p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
            <label className="relative block">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target
                      .value,
                  )
                }
                placeholder="Search coupon code..."
                className="w-full rounded-lg border py-2.5 pl-10 pr-3"
              />
            </label>

            <AdminSelect
              value={
                statusFilter
              }
              onChange={
                setStatusFilter
              }
              ariaLabel="Filter coupons by status"
              options={[
                {
                  value: "all",
                  label:
                    "All statuses",
                },
                {
                  value:
                    "active",
                  label: "Active",
                },
                {
                  value:
                    "inactive",
                  label:
                    "Inactive",
                },
                {
                  value:
                    "scheduled",
                  label:
                    "Scheduled",
                },
                {
                  value:
                    "expired",
                  label:
                    "Expired",
                },
                {
                  value:
                    "limited",
                  label:
                    "Limit reached",
                },
              ]}
            />
          </div>

          <div className="mt-4 overflow-x-auto rounded-xl border border-gray-100">
            <div className="min-w-[1080px]">
              <div className="grid grid-cols-[1.3fr_1fr_1.2fr_1fr_1.6fr_1fr_120px] gap-4 bg-gray-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-[.12em] text-gray-500">
                <span>Coupon</span>
                <span>Discount</span>
                <span>Schedule</span>
                <span>Usage</span>
                <span>
                  Restrictions
                </span>
                <span>Status</span>
                <span className="text-right">
                  Actions
                </span>
              </div>

              {filteredCoupons.map(
                (coupon) => {
                  const availability =
                    getCouponAvailability(
                      coupon,
                    );

                  const usageLimit =
                    coupon.usageLimit;

                  const usageCount =
                    Number(
                      coupon.usageCount ||
                        0,
                    );

                  const productCount =
                    (
                      coupon.applicableProducts ||
                      []
                    ).length;

                  const categoryCount =
                    (
                      coupon.applicableCategories ||
                      []
                    ).length;

                  return (
                    <div
                      key={
                        coupon.docId
                      }
                      className="grid grid-cols-[1.3fr_1fr_1.2fr_1fr_1.6fr_1fr_120px] items-center gap-4 border-t border-gray-100 px-4 py-4 text-sm transition hover:bg-forest-50/40"
                    >
                      <div>
                        <p className="font-bold tracking-wide text-forest-950">
                          {
                            coupon.code
                          }
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          One use per
                          account
                        </p>
                      </div>

                      <div>
                        <p className="font-semibold text-forest-900">
                          {coupon.type ===
                          "percentage"
                            ? `${coupon.value}% off`
                            : `₱${money(coupon.value)} off`}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          Min. spend{" "}
                          {Number(
                            coupon.minimumSpend ||
                              0,
                          ) >
                          0
                            ? `₱${money(coupon.minimumSpend)}`
                            : "None"}
                        </p>

                        {coupon.maximumDiscount !==
                          null &&
                          coupon.maximumDiscount !==
                            undefined &&
                          Number(
                            coupon.maximumDiscount,
                          ) >
                            0 && (
                            <p className="mt-1 text-xs text-gray-500">
                              Max ₱
                              {money(
                                coupon.maximumDiscount,
                              )}
                            </p>
                          )}
                      </div>

                      <div className="text-xs text-gray-600">
                        <p>
                          Start:{" "}
                          {formatDate(
                            coupon.startsAt,
                          )}
                        </p>
                        <p className="mt-1">
                          End:{" "}
                          {formatDate(
                            coupon.expiresAt,
                          )}
                        </p>
                      </div>

                      <div>
                        {usageLimit ===
                          null ||
                        usageLimit ===
                          undefined ? (
                          <div className="flex items-center gap-1.5 font-semibold text-forest-800">
                            <InfinityIcon
                              size={
                                15
                              }
                            />
                            Unlimited
                          </div>
                        ) : (
                          <>
                            <p className="font-semibold text-forest-900">
                              {
                                usageCount
                              }{" "}
                              /{" "}
                              {
                                usageLimit
                              }
                            </p>

                            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                              <div
                                className="h-full rounded-full bg-forest-600"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    Number(
                                      usageLimit,
                                    ) <=
                                      0
                                      ? 100
                                      : (usageCount /
                                          Number(
                                            usageLimit,
                                          )) *
                                          100,
                                  )}%`,
                                }}
                              />
                            </div>
                          </>
                        )}
                      </div>

                      <div className="text-xs text-gray-600">
                        {productCount ===
                          0 &&
                        categoryCount ===
                          0 ? (
                          <span className="font-medium text-forest-700">
                            All products
                          </span>
                        ) : (
                          <div className="space-y-1">
                            {productCount >
                              0 && (
                              <p>
                                {
                                  productCount
                                }{" "}
                                product
                                {productCount ===
                                1
                                  ? ""
                                  : "s"}
                              </p>
                            )}

                            {categoryCount >
                              0 && (
                              <p>
                                {
                                  categoryCount
                                }{" "}
                                categor
                                {categoryCount ===
                                1
                                  ? "y"
                                  : "ies"}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${availability.className}`}
                        >
                          {
                            availability.label
                          }
                        </span>
                      </div>

                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            toggleCoupon(
                              coupon,
                            )
                          }
                          className={`rounded-lg px-2.5 py-2 text-xs font-semibold transition ${
                            coupon.active
                              ? "text-amber-700 hover:bg-amber-50"
                              : "text-forest-700 hover:bg-forest-50"
                          }`}
                          aria-label={
                            coupon.active
                              ? `Disable ${coupon.code}`
                              : `Enable ${coupon.code}`
                          }
                        >
                          {coupon.active
                            ? "Disable"
                            : "Enable"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            openEdit(
                              coupon,
                            )
                          }
                          className="rounded-lg p-2 text-forest-700 transition hover:bg-forest-50"
                          aria-label={`Edit ${coupon.code}`}
                        >
                          <Pencil
                            size={
                              16
                            }
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setDeleteTarget(
                              coupon,
                            )
                          }
                          className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
                          aria-label={`Delete ${coupon.code}`}
                        >
                          <Trash2
                            size={
                              16
                            }
                          />
                        </button>
                      </div>
                    </div>
                  );
                },
              )}

              {!filteredCoupons.length && (
                <div className="border-t border-gray-100 px-4 py-14 text-center text-sm text-gray-500">
                  No coupons match
                  the current filters.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {formOpen && (
        <div
          className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="coupon-form-title"
          onMouseDown={(
            event,
          ) => {
            if (
              event.target ===
                event.currentTarget &&
              !saving
            ) {
              closeForm();
            }
          }}
        >
          <form
            onSubmit={
              requestSave
            }
            className="flex h-dvh w-full max-w-5xl flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[92vh] sm:rounded-2xl"
          >
            <div className="flex flex-none items-start justify-between border-b border-t-4 border-t-gold-500 px-4 py-4 sm:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[.16em] text-gold-600">
                  Coupon setup
                </p>

                <h2
                  id="coupon-form-title"
                  className="mt-1 font-serif text-2xl text-forest-950"
                >
                  {editingCode
                    ? `Edit ${form.code}`
                    : "Create Coupon"}
                </h2>
              </div>

              <button
                type="button"
                onClick={
                  closeForm
                }
                disabled={
                  saving
                }
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                aria-label="Close coupon form"
              >
                <X
                  size={20}
                />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
                <div className="space-y-6">
                  <section>
                    <h3 className="font-semibold text-forest-950">
                      Discount
                      details
                    </h3>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <label className="text-sm font-medium">
                        Coupon code
                        <input
                          required
                          value={
                            form.code
                          }
                          disabled={
                            Boolean(
                              editingCode,
                            )
                          }
                          onChange={(
                            event,
                          ) =>
                            setForm(
                              (
                                current,
                              ) => ({
                                ...current,
                                code: normalizeCouponCode(
                                  event
                                    .target
                                    .value,
                                ),
                              }),
                            )
                          }
                          placeholder="VERDE10"
                          className="mt-1 w-full rounded-lg border p-3 uppercase disabled:bg-gray-50 disabled:text-gray-500"
                        />
                        <span className="mt-1 block text-[11px] font-normal text-gray-500">
                          The code is
                          also used as
                          the Firestore
                          document ID.
                        </span>
                      </label>

                      <label className="text-sm font-medium">
                        Discount type
                        <AdminSelect
                          value={
                            form.type
                          }
                          onChange={(
                            value,
                          ) =>
                            setForm(
                              (
                                current,
                              ) => ({
                                ...current,
                                type:
                                  value as CouponType,
                              }),
                            )
                          }
                          ariaLabel="Coupon discount type"
                          className="mt-1 font-normal"
                          options={[
                            {
                              value:
                                "percentage",
                              label:
                                "Percentage",
                            },
                            {
                              value:
                                "fixed",
                              label:
                                "Fixed amount",
                            },
                          ]}
                        />
                      </label>

                      <label className="text-sm font-medium">
                        {form.type ===
                        "percentage"
                          ? "Percentage off"
                          : "Amount off"}
                        <div className="relative mt-1">
                          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            {form.type ===
                            "percentage"
                              ? "%"
                              : "₱"}
                          </span>
                          <input
                            required
                            type="number"
                            min="0.01"
                            max={
                              form.type ===
                              "percentage"
                                ? "100"
                                : undefined
                            }
                            step="0.01"
                            value={
                              form.value
                            }
                            onChange={(
                              event,
                            ) =>
                              setForm(
                                (
                                  current,
                                ) => ({
                                  ...current,
                                  value:
                                    event
                                      .target
                                      .value,
                                }),
                              )
                            }
                            className="w-full rounded-lg border py-3 pl-9 pr-3"
                          />
                        </div>
                      </label>

                      <label className="flex items-center gap-3 rounded-xl border bg-gray-50 p-3 text-sm font-medium sm:self-end">
                        <input
                          type="checkbox"
                          checked={
                            form.active
                          }
                          onChange={(
                            event,
                          ) =>
                            setForm(
                              (
                                current,
                              ) => ({
                                ...current,
                                active:
                                  event
                                    .target
                                    .checked,
                              }),
                            )
                          }
                          className="h-4 w-4 accent-forest-700"
                        />
                        Active coupon
                      </label>
                    </div>
                  </section>

                  <section>
                    <h3 className="font-semibold text-forest-950">
                      Limits
                    </h3>

                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <label className="text-sm font-medium">
                        Minimum spend
                        <div className="relative mt-1">
                          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            ₱
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={
                              form.minimumSpend
                            }
                            onChange={(
                              event,
                            ) =>
                              setForm(
                                (
                                  current,
                                ) => ({
                                  ...current,
                                  minimumSpend:
                                    event
                                      .target
                                      .value,
                                }),
                              )
                            }
                            placeholder="0"
                            className="w-full rounded-lg border py-3 pl-8 pr-3"
                          />
                        </div>
                      </label>

                      <label className="text-sm font-medium">
                        Max discount
                        <div className="relative mt-1">
                          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            ₱
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={
                              form.maximumDiscount
                            }
                            onChange={(
                              event,
                            ) =>
                              setForm(
                                (
                                  current,
                                ) => ({
                                  ...current,
                                  maximumDiscount:
                                    event
                                      .target
                                      .value,
                                }),
                              )
                            }
                            placeholder="No cap"
                            className="w-full rounded-lg border py-3 pl-8 pr-3"
                          />
                        </div>
                      </label>

                      <label className="text-sm font-medium">
                        Global usage
                        limit
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={
                            form.usageLimit
                          }
                          onChange={(
                            event,
                          ) =>
                            setForm(
                              (
                                current,
                              ) => ({
                                ...current,
                                usageLimit:
                                  event
                                    .target
                                    .value,
                              }),
                            )
                          }
                          placeholder="Unlimited"
                          className="mt-1 w-full rounded-lg border p-3"
                        />
                        <span className="mt-1 block text-[11px] font-normal leading-4 text-gray-500">
                          Blank =
                          unlimited.
                          0 = nobody
                          can redeem.
                        </span>
                      </label>
                    </div>

                    <div className="mt-3 rounded-xl border border-[#e8ddc8] bg-[#fbf8f1] p-3 text-xs leading-5 text-gray-600">
                      <strong className="text-forest-800">
                        Per-account
                        protection:
                      </strong>{" "}
                      the backend
                      automatically
                      allows each
                      signed-in
                      account to use
                      a coupon only
                      once. The
                      global usage
                      limit above is
                      separate.
                    </div>
                  </section>

                  <section>
                    <h3 className="font-semibold text-forest-950">
                      Schedule
                    </h3>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <label className="text-sm font-medium">
                        Starts at
                        <input
                          type="datetime-local"
                          value={
                            form.startsAt
                          }
                          onChange={(
                            event,
                          ) =>
                            setForm(
                              (
                                current,
                              ) => ({
                                ...current,
                                startsAt:
                                  event
                                    .target
                                    .value,
                              }),
                            )
                          }
                          className="mt-1 w-full rounded-lg border p-3"
                        />
                        <span className="mt-1 block text-[11px] font-normal text-gray-500">
                          Leave blank
                          to start
                          immediately.
                        </span>
                      </label>

                      <label className="text-sm font-medium">
                        Expires at
                        <input
                          type="datetime-local"
                          value={
                            form.expiresAt
                          }
                          onChange={(
                            event,
                          ) =>
                            setForm(
                              (
                                current,
                              ) => ({
                                ...current,
                                expiresAt:
                                  event
                                    .target
                                    .value,
                              }),
                            )
                          }
                          className="mt-1 w-full rounded-lg border p-3"
                        />
                        <span className="mt-1 block text-[11px] font-normal text-gray-500">
                          Leave blank
                          for no
                          expiry.
                        </span>
                      </label>
                    </div>
                  </section>
                </div>

                <div className="space-y-6">
                  <section>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-forest-950">
                          Category
                          restrictions
                        </h3>
                        <p className="mt-1 text-xs text-gray-500">
                          Leave all
                          unchecked
                          to allow
                          every
                          category.
                        </p>
                      </div>

                      {form.applicableCategories.length >
                        0 && (
                        <button
                          type="button"
                          onClick={() =>
                            setForm(
                              (
                                current,
                              ) => ({
                                ...current,
                                applicableCategories:
                                  [],
                              }),
                            )
                          }
                          className="text-xs font-semibold text-forest-700"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {categories.map(
                        (
                          category,
                        ) => {
                          const selected =
                            form.applicableCategories.includes(
                              category,
                            );

                          return (
                            <button
                              key={
                                category
                              }
                              type="button"
                              onClick={() =>
                                toggleCategory(
                                  category,
                                )
                              }
                              className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                                selected
                                  ? "border-forest-700 bg-forest-700 text-white"
                                  : "border-gray-200 bg-white text-gray-600 hover:border-forest-300"
                              }`}
                            >
                              {
                                category
                              }
                            </button>
                          );
                        },
                      )}

                      {!categories.length && (
                        <p className="text-sm text-gray-500">
                          No product
                          categories
                          found.
                        </p>
                      )}
                    </div>
                  </section>

                  <section>
                    <div className="flex flex-wrap items-end justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-forest-950">
                          Product
                          restrictions
                        </h3>
                        <p className="mt-1 text-xs text-gray-500">
                          Category
                          and product
                          rules are
                          combined
                          with OR.
                        </p>
                      </div>

                      {form.applicableProducts.length >
                        0 && (
                        <button
                          type="button"
                          onClick={() =>
                            setForm(
                              (
                                current,
                              ) => ({
                                ...current,
                                applicableProducts:
                                  [],
                              }),
                            )
                          }
                          className="text-xs font-semibold text-forest-700"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <label className="relative mt-3 block">
                      <Search
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        value={
                          productSearch
                        }
                        onChange={(
                          event,
                        ) =>
                          setProductSearch(
                            event
                              .target
                              .value,
                          )
                        }
                        placeholder="Search products..."
                        className="w-full rounded-lg border py-2.5 pl-9 pr-3 text-sm"
                      />
                    </label>

                    <div className="mt-3 max-h-[360px] space-y-2 overflow-y-auto rounded-xl border bg-gray-50 p-2">
                      {filteredProducts.map(
                        (
                          product,
                        ) => {
                          const productId =
                            Number(
                              product.id,
                            );

                          const selected =
                            form.applicableProducts.includes(
                              productId,
                            );

                          return (
                            <label
                              key={
                                product.docId
                              }
                              className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 transition ${
                                selected
                                  ? "border-forest-300 bg-forest-50"
                                  : "border-transparent bg-white hover:border-gray-200"
                              }`}
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-forest-950">
                                  {
                                    product.name
                                  }
                                </p>
                                <p className="mt-0.5 text-[11px] uppercase tracking-wide text-gray-500">
                                  {
                                    product.category
                                  }{" "}
                                  · #
                                  {
                                    product.id
                                  }
                                </p>
                              </div>

                              <input
                                type="checkbox"
                                checked={
                                  selected
                                }
                                onChange={() =>
                                  toggleProduct(
                                    productId,
                                  )
                                }
                                className="h-4 w-4 flex-none accent-forest-700"
                              />
                            </label>
                          );
                        },
                      )}

                      {!filteredProducts.length && (
                        <p className="p-5 text-center text-sm text-gray-500">
                          No
                          products
                          found.
                        </p>
                      )}
                    </div>
                  </section>

                  <section className="rounded-xl border border-forest-100 bg-forest-50 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[.16em] text-forest-700">
                      Coupon
                      preview
                    </p>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-lg font-black tracking-[.12em] text-forest-950">
                          {normalizeCouponCode(
                            form.code,
                          ) ||
                            "COUPON"}
                        </p>

                        <p className="mt-1 text-sm text-gray-600">
                          {form.value
                            ? form.type ===
                              "percentage"
                              ? `${form.value}% off eligible items`
                              : `₱${form.value} off eligible items`
                            : "Enter a discount value"}
                        </p>
                      </div>

                      <BadgePercent
                        size={30}
                        className="flex-none text-gold-600"
                      />
                    </div>

                    <div className="mt-4 grid gap-2 text-xs text-gray-600 sm:grid-cols-2">
                      <span>
                        Global:{" "}
                        {form.usageLimit ===
                        ""
                          ? "Unlimited"
                          : `${form.usageLimit} uses`}
                      </span>
                      <span>
                        Account: 1
                        use
                      </span>
                      <span>
                        Products:{" "}
                        {form.applicableProducts.length ||
                          "All"}
                      </span>
                      <span>
                        Categories:{" "}
                        {form.applicableCategories.length ||
                          "All"}
                      </span>
                    </div>
                  </section>
                </div>
              </div>
            </div>

            <div className="flex flex-none flex-col-reverse gap-2 border-t bg-white p-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
              <button
                type="button"
                onClick={
                  closeForm
                }
                disabled={
                  saving
                }
                className="rounded-lg border px-5 py-3 font-semibold text-gray-700 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  saving
                }
                className="rounded-lg bg-forest-700 px-5 py-3 font-semibold text-white transition hover:bg-forest-800 disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingCode
                    ? "Save Changes"
                    : "Create Coupon"}
              </button>
            </div>
          </form>
        </div>
      )}

      <AdminConfirmModal
        open={
          confirmSave
        }
        title={
          editingCode
            ? "Save coupon changes?"
            : "Create coupon?"
        }
        description={
          editingCode
            ? `Save the updated settings for ${form.code}? Existing successful redemptions remain recorded.`
            : `Create ${normalizeCouponCode(form.code) || "this coupon"} in Firestore? Each account will be able to redeem it once after successful payment.`
        }
        confirmLabel={
          saving
            ? "Saving..."
            : editingCode
              ? "Save Changes"
              : "Create Coupon"
        }
        tone="success"
        onConfirm={
          saveCoupon
        }
        onCancel={() =>
          setConfirmSave(
            false,
          )
        }
      />

      <AdminConfirmModal
        open={Boolean(
          deleteTarget,
        )}
        title="Delete coupon?"
        description={`${deleteTarget?.code || "This coupon"} will be permanently removed from the coupons collection. Existing order and account redemption history will remain in Firestore.`}
        confirmLabel={
          saving
            ? "Deleting..."
            : "Delete Coupon"
        }
        tone="danger"
        onConfirm={
          confirmDelete
        }
        onCancel={() =>
          setDeleteTarget(
            null,
          )
        }
      />
    </main>
  );
}
