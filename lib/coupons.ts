import { adminFirestore } from "@/lib/firebaseAdmin";

export type CouponCartLine = {
  id: number;
  category?: string | null;
  subtotal: number;
};

type CouponDocument = {
  code?: string;
  active?: boolean;
  type?: "percentage" | "fixed";
  value?: number | string;
  minimumSpend?: number | string | null;
  maximumDiscount?: number | string | null;
  startsAt?: unknown;
  expiresAt?: unknown;
  usageLimit?: number | string | null;
  usageCount?: number | string | null;
  applicableProducts?: Array<number | string>;
  applicableCategories?: string[];
};

export type AppliedCoupon = {
  couponDocPath: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minimumSpend: number;
  maximumDiscount: number | null;
  eligibleSubtotal: number;
  discountAmount: number;
  totalAmount: number;
};

export type CouponValidationResult =
  | {
      valid: true;
      coupon: AppliedCoupon;
    }
  | {
      valid: false;
      code: string;
      error: string;
    };

export function normalizeCouponCode(value: unknown) {
  return typeof value === "string"
    ? value.trim().toUpperCase().replace(/\s+/g, "")
    : "";
}

function toNumber(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function toDate(value: unknown): Date | null {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  ) {
    const date = (value as { toDate: () => Date }).toDate();
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}

async function findCouponDocument(code: string) {
  const couponsRef = adminFirestore.collection("coupons");

  /*
   * Preferred schema: use the normalized coupon code as the
   * document ID, e.g. coupons/VERDE10.
   */
  const directSnapshot = await couponsRef.doc(code).get();

  if (directSnapshot.exists) {
    return directSnapshot;
  }

  /*
   * Fallback for coupon documents created with random IDs.
   */
  const querySnapshot = await couponsRef
    .where("code", "==", code)
    .limit(1)
    .get();

  return querySnapshot.empty ? null : querySnapshot.docs[0];
}

export async function validateCoupon(params: {
  code: unknown;
  subtotal: number;
  items: CouponCartLine[];
  userId?: string | null;
  now?: Date;
}): Promise<CouponValidationResult> {
  const code = normalizeCouponCode(params.code);
  const subtotal = roundMoney(params.subtotal);
  const now = params.now || new Date();

  if (!code) {
    return {
      valid: false,
      code: "COUPON_REQUIRED",
      error: "Enter a coupon code.",
    };
  }

  const couponSnapshot = await findCouponDocument(code);

  if (!couponSnapshot?.exists) {
    return {
      valid: false,
      code: "COUPON_NOT_FOUND",
      error: "This coupon code is not valid.",
    };
  }

  const data = couponSnapshot.data() as CouponDocument;
  const storedCode = normalizeCouponCode(data.code || couponSnapshot.id);

  if (storedCode !== code) {
    return {
      valid: false,
      code: "COUPON_NOT_FOUND",
      error: "This coupon code is not valid.",
    };
  }

  if (data.active === false) {
    return {
      valid: false,
      code: "COUPON_INACTIVE",
      error: "This coupon is currently inactive.",
    };
  }

  /*
   * Verde coupon rule:
   * A coupon can be redeemed only once per authenticated
   * Firebase account. Guests can still checkout normally,
   * but they must sign in before applying a coupon.
   */
  const userId =
    typeof params.userId === "string"
      ? params.userId.trim()
      : "";

  if (!userId) {
    return {
      valid: false,
      code: "COUPON_ACCOUNT_REQUIRED",
      error: "Sign in to use coupons. Each coupon can only be used once per account.",
    };
  }

  const redemptionRef = adminFirestore.doc(
    `users/${userId}/couponRedemptions/${code}`,
  );
  const redemptionSnapshot = await redemptionRef.get();

  if (redemptionSnapshot.exists) {
    return {
      valid: false,
      code: "COUPON_ALREADY_REDEEMED",
      error: "You have already used this coupon on your account.",
    };
  }

  const startsAt = toDate(data.startsAt);
  const expiresAt = toDate(data.expiresAt);

  if (startsAt && now < startsAt) {
    return {
      valid: false,
      code: "COUPON_NOT_STARTED",
      error: "This coupon is not active yet.",
    };
  }

  if (expiresAt && now > expiresAt) {
    return {
      valid: false,
      code: "COUPON_EXPIRED",
      error: "This coupon has expired.",
    };
  }

  /*
   * usageLimit semantics:
   *
   * - field missing / null / empty = unlimited global uses
   * - 0 = coupon cannot be used at all
   * - 1 = one successful redemption globally
   * - N = N successful redemptions globally
   *
   * We must NOT use `usageLimit > 0` here because that
   * incorrectly treats 0 as unlimited.
   */
  const hasUsageLimit =
    data.usageLimit !== undefined &&
    data.usageLimit !== null &&
    String(data.usageLimit).trim() !== "";

  const usageLimit = hasUsageLimit
    ? Math.max(
        0,
        Math.floor(
          toNumber(data.usageLimit, 0),
        ),
      )
    : null;

  const usageCount = Math.max(
    0,
    Math.floor(
      toNumber(data.usageCount, 0),
    ),
  );

  if (
    usageLimit !== null &&
    usageCount >= usageLimit
  ) {
    return {
      valid: false,
      code: "COUPON_USAGE_LIMIT_REACHED",
      error: "This coupon has reached its usage limit.",
    };
  }

  const minimumSpend = Math.max(0, roundMoney(toNumber(data.minimumSpend, 0)));

  if (subtotal + 0.001 < minimumSpend) {
    return {
      valid: false,
      code: "COUPON_MINIMUM_SPEND",
      error: `Spend at least ₱${minimumSpend.toLocaleString("en-PH")} to use this coupon.`,
    };
  }

  const applicableProducts = new Set(
    Array.isArray(data.applicableProducts)
      ? data.applicableProducts
          .map((value) => Number(value))
          .filter((value) => Number.isFinite(value))
      : [],
  );

  const applicableCategories = new Set(
    Array.isArray(data.applicableCategories)
      ? data.applicableCategories
          .filter((value): value is string => typeof value === "string")
          .map((value) => value.trim().toUpperCase())
          .filter(Boolean)
      : [],
  );

  const hasRestrictions =
    applicableProducts.size > 0 || applicableCategories.size > 0;

  const eligibleSubtotal = roundMoney(
    params.items.reduce((total, item) => {
      if (!hasRestrictions) {
        return total + item.subtotal;
      }

      const productMatches = applicableProducts.has(item.id);
      const categoryMatches = Boolean(
        item.category && applicableCategories.has(item.category.trim().toUpperCase()),
      );

      return productMatches || categoryMatches
        ? total + item.subtotal
        : total;
    }, 0),
  );

  if (eligibleSubtotal <= 0) {
    return {
      valid: false,
      code: "COUPON_NOT_APPLICABLE",
      error: "This coupon does not apply to the items in your cart.",
    };
  }

  const type = data.type;
  const value = roundMoney(toNumber(data.value, 0));

  if (type !== "percentage" && type !== "fixed") {
    return {
      valid: false,
      code: "COUPON_INVALID_CONFIGURATION",
      error: "This coupon is not configured correctly.",
    };
  }

  if (
    value <= 0 ||
    (type === "percentage" && value > 100)
  ) {
    return {
      valid: false,
      code: "COUPON_INVALID_CONFIGURATION",
      error: "This coupon is not configured correctly.",
    };
  }

  let discountAmount =
    type === "percentage"
      ? eligibleSubtotal * (value / 100)
      : value;

  const maximumDiscountRaw = toNumber(data.maximumDiscount, 0);
  const maximumDiscount =
    maximumDiscountRaw > 0
      ? roundMoney(maximumDiscountRaw)
      : null;

  if (maximumDiscount !== null) {
    discountAmount = Math.min(discountAmount, maximumDiscount);
  }

  discountAmount = roundMoney(
    Math.min(discountAmount, eligibleSubtotal, subtotal),
  );

  if (discountAmount <= 0) {
    return {
      valid: false,
      code: "COUPON_NO_DISCOUNT",
      error: "This coupon does not reduce the total for the current cart.",
    };
  }

  return {
    valid: true,
    coupon: {
      couponDocPath: couponSnapshot.ref.path,
      code,
      type,
      value,
      minimumSpend,
      maximumDiscount,
      eligibleSubtotal,
      discountAmount,
      totalAmount: roundMoney(Math.max(0, subtotal - discountAmount)),
    },
  };
}
