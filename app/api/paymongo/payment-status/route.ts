import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

import {
  adminAuth,
  adminFirestore,
} from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

const PAYMONGO_API =
  "https://api.paymongo.com";

type PaymentStatusRequest = {
  paymentIntentId?: string;
  reference?: string;
};

type PaymentAttempt = {
  reference?: string;
  userId?: string | null;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  items?: unknown[];
  totalItems?: number;
  subtotalAmount?: number;
  discountAmount?: number;
  couponCode?: string | null;
  couponType?: "percentage" | "fixed" | null;
  couponValue?: number | null;
  couponDocPath?: string | null;
  couponEligibleSubtotal?: number | null;
  totalAmount?: number;
  amountInCentavos?: number;
  currency?: string;
  paymentMethod?: string;
  paymongoPaymentIntentId?: string;
  paymongoPaymentMethods?: string[];
  createdAt?: unknown;
  finalized?: boolean;
  paymentStatus?: string;
  status?: string;
};

type PayMongoPayment = {
  id?: string;
  attributes?: {
    status?: string;
    amount?: number;
    fee?: number;
    net_amount?: number;
    failed_code?: string | null;
    failed_message?: string | null;
    failure_code?: string | null;
    failure_message?: string | null;
    created_at?: number;
    updated_at?: number;
    source?: {
      type?: string;
    };
  };
};

type PayMongoPaymentIntentResponse = {
  data?: {
    id?: string;
    attributes?: {
      amount?: number;
      currency?: string;
      status?: string;
      livemode?: boolean;
      payments?: PayMongoPayment[];
      last_payment_error?: {
        code?: string;
        detail?: string;
        failed_message?: string;
        message?: string;
      } | null;
    };
  };
  errors?: Array<{
    code?: string;
    detail?: string;
  }>;
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
    const body =
      (await request.json()) as
        PaymentStatusRequest;

    const paymentIntentId =
      body.paymentIntentId?.trim();

    const reference =
      body.reference?.trim();

    if (
      !paymentIntentId ||
      !paymentIntentId.startsWith(
        "pi_",
      )
    ) {
      return NextResponse.json(
        {
          error:
            "A valid PayMongo Payment Intent ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const attemptRef =
      adminFirestore.doc(
        `paymentAttempts/${paymentIntentId}`,
      );

    const attemptSnapshot =
      await attemptRef.get();

    if (!attemptSnapshot.exists) {
      return NextResponse.json(
        {
          error:
            "Payment attempt was not found.",
        },
        {
          status: 404,
        },
      );
    }

    const attempt =
      attemptSnapshot.data() as
        PaymentAttempt;

    /*
     * Protect status checks:
     *
     * - signed-in attempts must belong to the
     *   signed-in Firebase user
     * - guest attempts must provide the matching
     *   order reference
     */
    const currentUserId =
      await getAuthenticatedUserId(
        request,
      );

    if (attempt.userId) {
      if (
        !currentUserId ||
        currentUserId !==
          attempt.userId
      ) {
        return NextResponse.json(
          {
            error:
              "You are not allowed to access this payment.",
          },
          {
            status: 403,
          },
        );
      }
    } else if (
      !reference ||
      reference !==
        attempt.reference
    ) {
      return NextResponse.json(
        {
          error:
            "The payment reference is invalid.",
        },
        {
          status: 403,
        },
      );
    }

    /*
     * If this payment has already been finalized,
     * do not call PayMongo or create the order again.
     */
    if (
      attempt.finalized === true &&
      attempt.paymentStatus ===
        "paid"
    ) {
      return NextResponse.json({
        paid: true,
        status:
          "succeeded",
        reference:
          attempt.reference || "",
        totalAmount:
          Number(
            attempt.totalAmount ||
              0,
          ),
      });
    }

    /*
     * Retrieve the authoritative status directly
     * from PayMongo with the secret key.
     */
    const payMongoResponse =
      await fetch(
        `${PAYMONGO_API}/v1/payment_intents/${encodeURIComponent(
          paymentIntentId,
        )}`,
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

    const result =
      (await payMongoResponse
        .json()
        .catch(() => null)) as
        | PayMongoPaymentIntentResponse
        | null;

    if (
      !payMongoResponse.ok ||
      !result?.data
    ) {
      const detail =
        result?.errors?.[0]
          ?.detail;

      return NextResponse.json(
        {
          error:
            detail ||
            "Unable to retrieve the payment status from PayMongo.",
        },
        {
          status:
            payMongoResponse.status >=
              400 &&
            payMongoResponse.status <
              500
              ? payMongoResponse.status
              : 502,
        },
      );
    }

    const attributes =
      result.data.attributes || {};

    const status =
      attributes.status ||
      "unknown";

    const paid =
      status === "succeeded";

    /*
     * ============================
     * FAILURE DETECTION
     * ============================
     *
     * PayMongo Payment Intents do NOT have a terminal
     * "failed" status. A failed attempt may show up in
     * more than one way:
     *
     * 1. last_payment_error is populated
     * 2. attributes.payments contains a Payment whose
     *    status is "failed"
     * 3. the Payment Intent transitions BACK from
     *    awaiting_next_action / processing to
     *    awaiting_payment_method
     *
     * QR Ph test-mode failures can use #2 or #3 even
     * when last_payment_error is null, so checking only
     * last_payment_error is not enough.
     */
    const lastPaymentError =
      attributes.last_payment_error ||
      null;

    const payments =
      Array.isArray(
        attributes.payments,
      )
        ? attributes.payments
        : [];

    const paidPayment =
      payments.find(
        (payment) =>
          payment.attributes
            ?.status === "paid",
      ) ||
      payments[0];

    const failedPayments =
      payments
        .filter(
          (payment) =>
            payment.attributes
              ?.status === "failed",
        )
        .sort((a, b) => {
          const aTime =
            a.attributes?.updated_at ??
            a.attributes?.created_at ??
            0;

          const bTime =
            b.attributes?.updated_at ??
            b.attributes?.created_at ??
            0;

          return bTime - aTime;
        });

    const failedPayment =
      failedPayments[0] ||
      null;

    const previousPayMongoStatus =
      attempt.status || "";

    const returnedToAwaitingPaymentMethod =
      status ===
        "awaiting_payment_method" &&
      (
        previousPayMongoStatus ===
          "awaiting_next_action" ||
        previousPayMongoStatus ===
          "processing"
      );

    /*
     * Once we have already detected a failed attempt,
     * keep returning failed on later polls so the UI
     * does not bounce back to "Waiting for payment".
     */
    const previouslyFailed =
      attempt.paymentStatus ===
        "failed";

    const failed =
      !paid &&
      (
        Boolean(lastPaymentError) ||
        Boolean(failedPayment) ||
        returnedToAwaitingPaymentMethod ||
        previouslyFailed
      );

    const failedPaymentCode =
      failedPayment?.attributes
        ?.failed_code ||
      failedPayment?.attributes
        ?.failure_code ||
      null;

    const failureCode =
      lastPaymentError?.code ||
      failedPaymentCode ||
      null;

    const failedPaymentMessage =
      failedPayment?.attributes
        ?.failed_message ||
      failedPayment?.attributes
        ?.failure_message ||
      null;

    const failureMessage =
      lastPaymentError?.failed_message ||
      lastPaymentError?.detail ||
      lastPaymentError?.message ||
      failedPaymentMessage ||
      (
        failureCode === "RJCT"
          ? "The QR Ph payment was rejected or could not be processed. Generate a new QR and try again."
          : null
      ) ||
      (
        failed
          ? "The payment attempt was not completed. Generate a new QR and try again."
          : null
      );

    if (!paid) {
      /*
       * Useful while testing locally. This is server-side
       * only and does not expose your PayMongo secret key.
       */
      console.log(
        "PayMongo payment status:",
        {
          paymentIntentId,
          currentStatus:
            status,
          previousStatus:
            previousPayMongoStatus,
          paymentStatuses:
            payments.map(
              (payment) =>
                payment.attributes
                  ?.status ||
                "unknown",
            ),
          hasLastPaymentError:
            Boolean(
              lastPaymentError,
            ),
          returnedToAwaitingPaymentMethod,
          failed,
          failureCode,
          failureMessage,
        },
      );

      await attemptRef.set(
        {
          /*
           * Keep the real PayMongo status so that a later
           * transition can still be diagnosed.
           */
          status,
          paymentStatus:
            failed
              ? "failed"
              : "unpaid",
          lastPaymentError,
          failedPaymentId:
            failedPayment?.id ||
            null,
          failureCode,
          failureMessage,
          failedAt:
            failed
              ? FieldValue.serverTimestamp()
              : null,
          updatedAt:
            FieldValue.serverTimestamp(),
        },
        {
          merge: true,
        },
      );

      return NextResponse.json({
        paid: false,
        failed,
        status,
        previousStatus:
          previousPayMongoStatus,
        reference:
          attempt.reference || "",
        totalAmount:
          Number(
            attempt.totalAmount ||
              0,
          ),
        failureCode,
        failureMessage,

        /*
         * Safe diagnostic values for localhost DevTools.
         * These contain statuses/IDs only, never API keys.
         */
        paymentStatuses:
          payments.map(
            (payment) =>
              payment.attributes
                ?.status ||
              "unknown",
          ),
      });
    }

    /*
     * ============================
     * FINALIZE PAID ORDER
     * ============================
     *
     * This is idempotent. Polling can hit this route
     * multiple times without producing duplicate orders.
     */
    await adminFirestore.runTransaction(
      async (transaction) => {
        const latestAttemptSnapshot =
          await transaction.get(
            attemptRef,
          );

        if (
          !latestAttemptSnapshot.exists
        ) {
          throw new Error(
            "Payment attempt disappeared before finalization.",
          );
        }

        const latestAttempt =
          latestAttemptSnapshot.data() as
            PaymentAttempt;

        if (
          latestAttempt.finalized ===
            true &&
          latestAttempt.paymentStatus ===
            "paid"
        ) {
          return;
        }

        const finalReference =
          latestAttempt.reference;

        if (!finalReference) {
          throw new Error(
            "Payment attempt is missing its order reference.",
          );
        }

        const orderRef =
          latestAttempt.userId
            ? adminFirestore.doc(
                `users/${latestAttempt.userId}/orders/${finalReference}`,
              )
            : adminFirestore.doc(
                `guestOrders/${finalReference}`,
              );

        /*
         * If a coupon was used, read it before any transaction
         * writes. The usage counter is incremented only once,
         * after a successful payment, because the finalized guard
         * above makes this transaction idempotent.
         */
        const couponRef =
          latestAttempt.couponDocPath
            ? adminFirestore.doc(
                latestAttempt.couponDocPath,
              )
            : null;

        const couponSnapshot =
          couponRef
            ? await transaction.get(
                couponRef,
              )
            : null;

        /*
         * One redemption document per Firebase account + coupon.
         * This is the server-side source of truth used by future
         * coupon validation requests.
         */
        const couponRedemptionRef =
          latestAttempt.userId &&
          latestAttempt.couponCode
            ? adminFirestore.doc(
                `users/${latestAttempt.userId}/couponRedemptions/${latestAttempt.couponCode}`,
              )
            : null;

        const couponRedemptionSnapshot =
          couponRedemptionRef
            ? await transaction.get(
                couponRedemptionRef,
              )
            : null;

        const orderData = {
          reference:
            finalReference,
          customer:
            latestAttempt.customer ||
            {},
          items:
            latestAttempt.items ||
            [],
          totalItems:
            Number(
              latestAttempt.totalItems ||
                0,
            ),
          subtotalAmount:
            Number(
              latestAttempt.subtotalAmount ??
                latestAttempt.totalAmount ??
                0,
            ),
          discountAmount:
            Number(
              latestAttempt.discountAmount ||
                0,
            ),
          couponCode:
            latestAttempt.couponCode ||
            null,
          couponType:
            latestAttempt.couponType ||
            null,
          couponValue:
            latestAttempt.couponValue ??
            null,
          couponEligibleSubtotal:
            latestAttempt.couponEligibleSubtotal ??
            null,
          totalAmount:
            Number(
              latestAttempt.totalAmount ||
                0,
            ),
          amountInCentavos:
            Number(
              latestAttempt.amountInCentavos ||
                attributes.amount ||
                0,
            ),
          currency:
            latestAttempt.currency ||
            attributes.currency ||
            "PHP",

          /*
           * The actual order appears only now:
           * after PayMongo reports succeeded.
           */
          status:
            "processing",
          paymentStatus:
            "paid",
          paymentMethod:
            "paymongo",

          paymongoPaymentIntentId:
            paymentIntentId,
          paymongoPaymentId:
            paidPayment?.id ||
            null,
          paymongoPaymentStatus:
            status,
          paymongoPaymentSource:
            paidPayment?.attributes
              ?.source?.type ||
            "qrph",
          paymongoFee:
            paidPayment?.attributes
              ?.fee ??
            null,
          paymongoNetAmount:
            paidPayment?.attributes
              ?.net_amount ??
            null,

          createdAt:
            latestAttempt.createdAt ||
            FieldValue.serverTimestamp(),
          paidAt:
            FieldValue.serverTimestamp(),
          updatedAt:
            FieldValue.serverTimestamp(),
        };

        transaction.set(
          orderRef,
          orderData,
          {
            merge: true,
          },
        );

        if (
          couponRef &&
          couponSnapshot?.exists &&
          couponRedemptionRef &&
          !couponRedemptionSnapshot?.exists
        ) {
          /*
           * Mark the coupon as redeemed for this account and
           * increment the global usage counter exactly once.
           *
           * Because both writes are inside this Firestore
           * transaction, repeated polling cannot redeem it twice.
           */
          transaction.set(
            couponRedemptionRef,
            {
              couponCode:
                latestAttempt.couponCode,
              couponDocPath:
                latestAttempt.couponDocPath ||
                null,
              userId:
                latestAttempt.userId,
              orderReference:
                finalReference,
              paymentIntentId,
              paymentId:
                paidPayment?.id ||
                null,
              subtotalAmount:
                Number(
                  latestAttempt.subtotalAmount ??
                    latestAttempt.totalAmount ??
                    0,
                ),
              discountAmount:
                Number(
                  latestAttempt.discountAmount ||
                    0,
                ),
              totalAmount:
                Number(
                  latestAttempt.totalAmount ||
                    0,
                ),
              redeemedAt:
                FieldValue.serverTimestamp(),
            },
            {
              merge: false,
            },
          );

          transaction.update(
            couponRef,
            {
              usageCount:
                FieldValue.increment(1),
              lastRedeemedAt:
                FieldValue.serverTimestamp(),
              updatedAt:
                FieldValue.serverTimestamp(),
            },
          );
        }

        transaction.set(
          attemptRef,
          {
            status:
              "succeeded",
            paymentStatus:
              "paid",
            finalized:
              true,
            finalizedAt:
              FieldValue.serverTimestamp(),
            paymongoPaymentId:
              paidPayment?.id ||
              null,
            updatedAt:
              FieldValue.serverTimestamp(),
          },
          {
            merge: true,
          },
        );
      },
    );

    return NextResponse.json({
      paid: true,
      status:
        "succeeded",
      reference:
        attempt.reference || "",
      totalAmount:
        Number(
          attempt.totalAmount ||
            0,
        ),
      paymentId:
        paidPayment?.id ||
        null,
    });
  } catch (error) {
    console.error(
      "PayMongo payment status error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to check payment status.",
      },
      {
        status: 500,
      },
    );
  }
}
