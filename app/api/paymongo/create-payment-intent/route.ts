import { randomUUID } from "node:crypto";

import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

import { getGloveHandDisplay } from "@/data/productOptions";
import { getColorDisplay } from "@/lib/productUtils";
import { validateCoupon } from "@/lib/coupons";
import {
  adminAuth,
  adminFirestore,
} from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

const PAYMONGO_API = "https://api.paymongo.com";

type CheckoutCartItem = {
  id: number;
  color: string;
  size?: string | null;
  hand?: string | null;
  quantity: number;
};

type CheckoutCustomer = {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
};

type CreatePaymentIntentRequest = {
  cart?: CheckoutCartItem[];
  customer?: CheckoutCustomer;
  couponCode?: string | null;

  /*
   * Browser totals are NEVER trusted as payment amounts.
   * They are only consistency checks so the server can reject
   * a stale cart/coupon before creating a PayMongo intent.
   */
  expectedSubtotal?: number;
  expectedTotal?: number;
};

type PayMongoPaymentIntentResponse = {
  data?: {
    id?: string;
    attributes?: {
      amount?: number;
      currency?: string;
      status?: string;
      client_key?: string;
      payment_method_allowed?: string[];
    };
  };
  errors?: Array<{
    code?: string;
    detail?: string;
    source?: {
      pointer?: string;
    };
  }>;
};

type FirestoreProduct = {
  id?: number | string;
  name?: string;
  price?: number | string;
  category?: string;
  colors?: string[];
  active?: boolean;
};

function getPayMongoAuthorization(
  secretKey: string,
) {
  return `Basic ${Buffer.from(
    `${secretKey}:`,
  ).toString("base64")}`;
}

async function getAuthenticatedUserId(
  request: Request,
) {
  const authorization =
    request.headers.get(
      "authorization",
    );

  if (
    !authorization?.startsWith(
      "Bearer ",
    )
  ) {
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
    await adminAuth.verifyIdToken(
      idToken,
    );

  return decodedToken.uid;
}

/*
 * ============================
 * LIVE FIRESTORE PRODUCT
 * ============================
 *
 * Payment pricing must come from the same Firestore catalog
 * that the admin dashboard updates. We deliberately do NOT
 * fall back to the static products.ts price because that can
 * silently charge an old amount.
 */
async function getLiveProductById(
  productId: number,
) {
  const productsRef =
    adminFirestore.collection(
      "products",
    );

  let snapshot =
    await productsRef
      .where("id", "==", productId)
      .limit(1)
      .get();

  /*
   * Older data may have stored id as a string.
   */
  if (snapshot.empty) {
    snapshot =
      await productsRef
        .where(
          "id",
          "==",
          String(productId),
        )
        .limit(1)
        .get();
  }

  if (snapshot.empty) {
    return null;
  }

  const document = snapshot.docs[0];
  const data =
    document.data() as FirestoreProduct;

  const id = Number(data.id);
  const price = Number(data.price);

  if (
    !Number.isFinite(id) ||
    id !== productId ||
    !data.name?.trim() ||
    !Number.isFinite(price) ||
    price <= 0 ||
    data.active === false
  ) {
    return null;
  }

  return {
    docId: document.id,
    id,
    name: data.name.trim(),
    price,
    category:
      typeof data.category === "string"
        ? data.category.trim()
        : "",
    colors:
      Array.isArray(data.colors)
        ? data.colors
        : [],
  };
}

async function getActivePaymentMethods(
  secretKey: string,
) {
  const requestedMethods = [
    "qrph",
    "paymaya",
  ];

  try {
    const response = await fetch(
      `${PAYMONGO_API}/v1/merchants/capabilities/payment_methods`,
      {
        method: "GET",
        headers: {
          Authorization:
            getPayMongoAuthorization(
              secretKey,
            ),
          Accept:
            "application/json",
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      console.warn(
        "Unable to retrieve PayMongo capabilities. Using QR Ph.",
      );

      return ["qrph"];
    }

    const payload =
      (await response.json()) as unknown;

    let activeMethods: string[] = [];

    if (Array.isArray(payload)) {
      activeMethods =
        payload.filter(
          (
            value,
          ): value is string =>
            typeof value ===
            "string",
        );
    } else if (
      typeof payload ===
        "object" &&
      payload !== null &&
      "data" in payload &&
      Array.isArray(
        (
          payload as {
            data?: unknown;
          }
        ).data,
      )
    ) {
      const data =
        (
          payload as {
            data: unknown[];
          }
        ).data;

      activeMethods = data
        .map((item) => {
          if (
            typeof item ===
            "string"
          ) {
            return item;
          }

          if (
            typeof item ===
              "object" &&
            item !== null &&
            "id" in item &&
            typeof (
              item as {
                id?: unknown;
              }
            ).id === "string"
          ) {
            return (
              item as {
                id: string;
              }
            ).id;
          }

          return null;
        })
        .filter(
          (
            value,
          ): value is string =>
            Boolean(value),
        );
    }

    const availableMethods =
      requestedMethods.filter(
        (method) =>
          activeMethods.includes(
            method,
          ),
      );

    return availableMethods.length > 0
      ? availableMethods
      : ["qrph"];
  } catch (error) {
    console.error(
      "PayMongo capability check failed:",
      error,
    );

    return ["qrph"];
  }
}

export async function POST(
  request: Request,
) {
  const secretKey =
    process.env.PAYMONGO_SECRET_KEY;

  if (!secretKey) {
    return NextResponse.json(
      {
        error:
          "PayMongo is not configured on the server.",
      },
      {
        status: 500,
      },
    );
  }

  try {
    const userId =
      await getAuthenticatedUserId(
        request,
      );

    const body =
      (await request.json()) as
        CreatePaymentIntentRequest;

    const cart =
      Array.isArray(body.cart)
        ? body.cart
        : [];

    const customer =
      body.customer || {};

    if (cart.length === 0) {
      return NextResponse.json(
        {
          error:
            "Your cart is empty.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !customer.name?.trim() ||
      !customer.email?.trim() ||
      !customer.phone?.trim() ||
      !customer.address?.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "Complete your delivery information before checkout.",
        },
        {
          status: 400,
        },
      );
    }

    let totalAmount = 0;
    let totalItems = 0;

    const validatedCart: Array<{
      id: number;
      color: string;
      size?: string | null;
      hand?: string | null;
      quantity: number;
      productName: string;
      category: string;
      unitPrice: number;
      subtotal: number;
      variant: string;
    }> = [];

    for (const item of cart) {
      const quantity =
        Number(item.quantity);

      if (
        !Number.isInteger(
          quantity,
        ) ||
        quantity < 1 ||
        quantity > 99
      ) {
        return NextResponse.json(
          {
            error:
              "One or more cart quantities are invalid.",
          },
          {
            status: 400,
          },
        );
      }

      const product =
        await getLiveProductById(
          item.id,
        );

      if (!product) {
        return NextResponse.json(
          {
            error:
              "One or more products are unavailable or missing from the live Firestore catalog. Refresh your cart and try again.",
          },
          {
            status: 409,
          },
        );
      }

      if (
        product.colors.length > 0 &&
        !product.colors.includes(
          item.color,
        )
      ) {
        return NextResponse.json(
          {
            error:
              `${product.name} is no longer available in the selected color. Refresh your cart and choose another option.`,
          },
          {
            status: 409,
          },
        );
      }

      const subtotal =
        product.price * quantity;

      const variantParts = [
        getColorDisplay(
          item.color,
        ),
        item.size
          ? `Size ${item.size}`
          : null,
        item.hand
          ? getGloveHandDisplay(
              item.hand,
            )
          : null,
      ].filter(Boolean);

      validatedCart.push({
        id: item.id,
        color: item.color,
        size:
          item.size || null,
        hand:
          item.hand || null,
        quantity,
        productName:
          product.name,
        category:
          product.category,
        unitPrice:
          product.price,
        subtotal,
        variant:
          variantParts.join(
            " • ",
          ),
      });

      totalItems += quantity;
      totalAmount += subtotal;
    }

    totalAmount =
      Math.round(
        totalAmount * 100,
      ) / 100;

    const subtotalAmount = totalAmount;

    /*
     * First verify the non-discounted cart subtotal against
     * the same live Firestore prices used by the server.
     */
    const expectedSubtotal =
      Number(body.expectedSubtotal);

    if (
      Number.isFinite(expectedSubtotal) &&
      Math.abs(
        expectedSubtotal - subtotalAmount,
      ) > 0.009
    ) {
      return NextResponse.json(
        {
          code: "PRICE_MISMATCH",
          error:
            "The cart subtotal changed before payment. Refresh the page and review the updated prices before generating a QR code.",
          displayedSubtotal: expectedSubtotal,
          serverSubtotal: subtotalAmount,
        },
        { status: 409 },
      );
    }

    /*
     * Coupon validation is repeated here even if the browser
     * already called /api/coupons/validate. The browser's
     * discount is never trusted.
     */
    let appliedCoupon:
      | Awaited<ReturnType<typeof validateCoupon>>
      | null = null;

    if (body.couponCode?.trim()) {
      if (!userId) {
        return NextResponse.json(
          {
            code: "COUPON_ACCOUNT_REQUIRED",
            error:
              "Sign in to use coupons. Each coupon can only be used once per account.",
          },
          {
            status: 401,
          },
        );
      }

      appliedCoupon = await validateCoupon({
        code: body.couponCode,
        subtotal: subtotalAmount,
        items: validatedCart.map((item) => ({
          id: item.id,
          category: item.category,
          subtotal: item.subtotal,
        })),
        userId,
      });

      if (!appliedCoupon.valid) {
        return NextResponse.json(
          {
            code: appliedCoupon.code,
            error: appliedCoupon.error,
          },
          { status: 409 },
        );
      }
    }

    const coupon =
      appliedCoupon?.valid
        ? appliedCoupon.coupon
        : null;

    const discountAmount =
      coupon?.discountAmount || 0;

    totalAmount =
      coupon?.totalAmount ??
      subtotalAmount;

    /*
     * expectedTotal is the amount displayed AFTER discounts.
     * This rejects stale coupon calculations before PayMongo.
     */
    const expectedTotal =
      Number(body.expectedTotal);

    if (
      Number.isFinite(expectedTotal) &&
      Math.abs(
        expectedTotal - totalAmount,
      ) > 0.009
    ) {
      return NextResponse.json(
        {
          code: "TOTAL_MISMATCH",
          error:
            "The checkout total changed before payment. Re-apply your coupon and review the updated total before generating a QR code.",
          displayedTotal: expectedTotal,
          serverTotal: totalAmount,
        },
        { status: 409 },
      );
    }

    const amountInCentavos =
      Math.round(
        totalAmount * 100,
      );

    if (
      amountInCentavos < 100
    ) {
      return NextResponse.json(
        {
          error:
            "The payment amount is below PayMongo's minimum transaction amount.",
        },
        {
          status: 400,
        },
      );
    }

    const orderReference =
      `VBR-${Date.now()
        .toString(36)
        .toUpperCase()}-${randomUUID()
        .slice(0, 8)
        .toUpperCase()}`;

    const paymentMethods =
      await getActivePaymentMethods(
        secretKey,
      );

    const response = await fetch(
      `${PAYMONGO_API}/v1/payment_intents`,
      {
        method: "POST",
        headers: {
          Authorization:
            getPayMongoAuthorization(
              secretKey,
            ),
          "Content-Type":
            "application/json",
          Accept:
            "application/json",
        },
        body: JSON.stringify({
          data: {
            attributes: {
              amount:
                amountInCentavos,
              currency:
                "PHP",
              payment_method_allowed:
                paymentMethods,
              description:
                `Verde by Renzo Order ${orderReference}`,
              metadata: {
                order_reference:
                  orderReference,
                ...(coupon
                  ? {
                      coupon_code:
                        coupon.code,
                    }
                  : {}),
              },
            },
          },
        }),
        cache: "no-store",
      },
    );

    const result =
      (await response
        .json()
        .catch(() => null)) as
        | PayMongoPaymentIntentResponse
        | null;

    if (!response.ok) {
      console.error(
        "PayMongo Payment Intent creation failed:",
        response.status,
        result?.errors,
      );

      const payMongoMessage =
        result?.errors?.[0]
          ?.detail;

      return NextResponse.json(
        {
          error:
            payMongoMessage ||
            "Unable to initialize PayMongo payment.",
        },
        {
          status:
            response.status >= 400 &&
            response.status < 500
              ? 400
              : 502,
        },
      );
    }

    const paymentIntentId =
      result?.data?.id;

    const clientKey =
      result?.data
        ?.attributes
        ?.client_key;

    if (
      !paymentIntentId ||
      !clientKey
    ) {
      throw new Error(
        "PayMongo did not return a valid Payment Intent.",
      );
    }

    /*
     * ============================
     * SAVE PAYMENT ATTEMPT ONLY
     * ============================
     *
     * IMPORTANT:
     * We no longer create an order under:
     *
     * users/{uid}/orders
     * guestOrders/{reference}
     *
     * just because a Payment Intent / QR was created.
     *
     * An actual order is created only after PayMongo
     * reports that the Payment Intent succeeded.
     *
     * This temporary record gives the status/webhook
     * handler the server-validated cart/customer data
     * it needs to finalize the paid order safely.
     */
    const paymentAttemptData = {
      reference:
        orderReference,
      userId:
        userId || null,
      customer: {
        name:
          customer.name.trim(),
        email:
          customer.email.trim(),
        phone:
          customer.phone.trim(),
        address:
          customer.address.trim(),
      },
      items:
        validatedCart,
      totalItems,
      subtotalAmount,
      discountAmount,
      couponCode:
        coupon?.code || null,
      couponType:
        coupon?.type || null,
      couponValue:
        coupon?.value ?? null,
      couponDocPath:
        coupon?.couponDocPath || null,
      couponEligibleSubtotal:
        coupon?.eligibleSubtotal ?? null,
      totalAmount,
      amountInCentavos,
      currency:
        "PHP",
      status:
        "awaiting_payment_method",
      paymentStatus:
        "unpaid",
      paymentMethod:
        "paymongo",
      paymongoPaymentIntentId:
        paymentIntentId,
      paymongoPaymentMethods:
        paymentMethods,
      livemode:
        secretKey.startsWith(
          "sk_live_",
        ),
      finalized:
        false,
      createdAt:
        FieldValue.serverTimestamp(),
      updatedAt:
        FieldValue.serverTimestamp(),

      /*
       * Useful later if you enable Firestore TTL
       * for the paymentAttempts collection.
       */
      expiresAt:
        new Date(
          Date.now() +
            35 * 60 * 1000,
        ),
    };

    await adminFirestore
      .doc(
        `paymentAttempts/${paymentIntentId}`,
      )
      .set(
        paymentAttemptData,
      );

    return NextResponse.json({
      paymentIntentId,
      clientKey,
      reference:
        orderReference,
      amount:
        amountInCentavos,
      subtotalAmount,
      discountAmount,
      couponCode:
        coupon?.code || null,
      couponType:
        coupon?.type || null,
      couponValue:
        coupon?.value ?? null,
      totalAmount,
      paymentMethods,
    });
  } catch (error) {
    console.error(
      "Create PayMongo Payment Intent failed:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to initialize payment.",
      },
      {
        status: 500,
      },
    );
  }
}
