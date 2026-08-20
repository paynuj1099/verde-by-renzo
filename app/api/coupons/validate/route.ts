import { NextResponse } from "next/server";

import { adminAuth, adminFirestore } from "@/lib/firebaseAdmin";
import { validateCoupon } from "@/lib/coupons";

export const runtime = "nodejs";

type CartItem = {
  id?: number;
  quantity?: number;
};

type FirestoreProduct = {
  id?: number | string;
  name?: string;
  price?: number | string;
  category?: string;
  active?: boolean;
};

type ValidateCouponRequest = {
  couponCode?: string;
  cart?: CartItem[];
};

async function getAuthenticatedUserId(
  request: Request,
) {
  const authorization =
    request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const idToken =
    authorization
      .slice("Bearer ".length)
      .trim();

  if (!idToken) {
    return null;
  }

  const decodedToken =
    await adminAuth.verifyIdToken(idToken);

  return decodedToken.uid;
}

async function getLiveProductById(productId: number) {
  const productsRef = adminFirestore.collection("products");

  let snapshot = await productsRef
    .where("id", "==", productId)
    .limit(1)
    .get();

  if (snapshot.empty) {
    snapshot = await productsRef
      .where("id", "==", String(productId))
      .limit(1)
      .get();
  }

  if (snapshot.empty) return null;

  const document = snapshot.docs[0];
  const data = document.data() as FirestoreProduct;
  const id = Number(data.id);
  const price = Number(data.price);

  if (
    !Number.isFinite(id) ||
    id !== productId ||
    !Number.isFinite(price) ||
    price <= 0 ||
    data.active === false
  ) {
    return null;
  }

  return {
    id,
    price,
    category:
      typeof data.category === "string"
        ? data.category.trim()
        : "",
  };
}

export async function POST(request: Request) {
  try {
    const userId =
      await getAuthenticatedUserId(request);

    if (!userId) {
      return NextResponse.json(
        {
          valid: false,
          code: "COUPON_ACCOUNT_REQUIRED",
          error: "Sign in to use coupons. Each coupon can only be used once per account.",
        },
        { status: 401 },
      );
    }

    const body = (await request.json()) as ValidateCouponRequest;
    const cart = Array.isArray(body.cart) ? body.cart : [];

    if (!body.couponCode?.trim()) {
      return NextResponse.json(
        {
          valid: false,
          code: "COUPON_REQUIRED",
          error: "Enter a coupon code.",
        },
        { status: 400 },
      );
    }

    if (cart.length === 0) {
      return NextResponse.json(
        {
          valid: false,
          code: "EMPTY_CART",
          error: "Your cart is empty.",
        },
        { status: 400 },
      );
    }

    let subtotal = 0;
    const couponItems: Array<{
      id: number;
      category: string;
      subtotal: number;
    }> = [];

    for (const item of cart) {
      const id = Number(item.id);
      const quantity = Number(item.quantity);

      if (
        !Number.isInteger(id) ||
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > 99
      ) {
        return NextResponse.json(
          {
            valid: false,
            code: "INVALID_CART",
            error: "One or more cart items are invalid.",
          },
          { status: 400 },
        );
      }

      const product = await getLiveProductById(id);

      if (!product) {
        return NextResponse.json(
          {
            valid: false,
            code: "PRODUCT_UNAVAILABLE",
            error: "One or more products are no longer available. Refresh your cart and try again.",
          },
          { status: 409 },
        );
      }

      const lineSubtotal = product.price * quantity;
      subtotal += lineSubtotal;
      couponItems.push({
        id,
        category: product.category,
        subtotal: lineSubtotal,
      });
    }

    subtotal = Math.round(subtotal * 100) / 100;

    const result = await validateCoupon({
      code: body.couponCode,
      subtotal,
      items: couponItems,
      userId,
    });

    if (!result.valid) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      ...result.coupon,
      subtotal,
    });
  } catch (error) {
    console.error("Coupon validation failed:", error);

    return NextResponse.json(
      {
        valid: false,
        code: "COUPON_VALIDATION_FAILED",
        error: "Unable to validate this coupon right now.",
      },
      { status: 500 },
    );
  }
}
