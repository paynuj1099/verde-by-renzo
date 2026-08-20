import {
  FieldValue,
  Timestamp,
} from "firebase-admin/firestore";
import {
  adminAuth,
  adminFirestore,
} from "@/lib/firebaseAdmin";

type CouponType =
  | "percentage"
  | "fixed";

type CouponPayload = {
  code?: string;
  active?: boolean;
  type?: CouponType;
  value?: number;
  minimumSpend?: number | null;
  maximumDiscount?: number | null;
  usageLimit?: number | null;
  startsAt?: string | null;
  expiresAt?: string | null;
  applicableProducts?: Array<number | string>;
  applicableCategories?: string[];
};

const normalizeCouponCode = (
  value: unknown,
) =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");

async function requireAdmin(
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
    throw new Error(
      "UNAUTHORIZED",
    );
  }

  const token =
    authorization
      .slice(
        "Bearer ".length,
      )
      .trim();

  if (!token) {
    throw new Error(
      "UNAUTHORIZED",
    );
  }

  const decoded =
    await adminAuth.verifyIdToken(
      token,
    );

  if (
    decoded.admin !== true
  ) {
    throw new Error(
      "FORBIDDEN",
    );
  }

  return decoded;
}

function errorResponse(
  error: unknown,
) {
  console.error(
    "Admin coupons API error:",
    error,
  );

  if (
    error instanceof Error &&
    error.message ===
      "UNAUTHORIZED"
  ) {
    return Response.json(
      {
        error:
          "Authentication required.",
      },
      {
        status: 401,
      },
    );
  }

  if (
    error instanceof Error &&
    error.message ===
      "FORBIDDEN"
  ) {
    return Response.json(
      {
        error:
          "Administrator access required.",
      },
      {
        status: 403,
      },
    );
  }

  return Response.json(
    {
      error:
        error instanceof Error
          ? error.message
          : "Unable to manage coupons.",
    },
    {
      status: 500,
    },
  );
}

function toIso(
  value: unknown,
) {
  if (!value) return null;

  if (
    value instanceof Timestamp
  ) {
    return value
      .toDate()
      .toISOString();
  }

  if (
    value instanceof Date
  ) {
    return value.toISOString();
  }

  if (
    typeof value ===
      "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (
      value as {
        toDate?: unknown;
      }
    ).toDate ===
      "function"
  ) {
    return (
      value as {
        toDate: () => Date;
      }
    )
      .toDate()
      .toISOString();
  }

  return null;
}

function parseOptionalDate(
  value: unknown,
) {
  if (
    typeof value !==
      "string" ||
    !value.trim()
  ) {
    return null;
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    throw new Error(
      "Invalid coupon date.",
    );
  }

  return Timestamp.fromDate(
    date,
  );
}

function validatePayload(
  payload: CouponPayload,
) {
  const code =
    normalizeCouponCode(
      payload.code,
    );

  if (
    !/^[A-Z0-9_-]{3,32}$/.test(
      code,
    )
  ) {
    throw new Error(
      "Coupon code must be 3-32 characters using letters, numbers, dashes, or underscores.",
    );
  }

  if (
    payload.type !==
      "percentage" &&
    payload.type !==
      "fixed"
  ) {
    throw new Error(
      "Invalid coupon type.",
    );
  }

  const value =
    Number(
      payload.value,
    );

  if (
    !Number.isFinite(
      value,
    ) ||
    value <= 0
  ) {
    throw new Error(
      "Discount value must be greater than 0.",
    );
  }

  if (
    payload.type ===
      "percentage" &&
    value > 100
  ) {
    throw new Error(
      "Percentage discounts cannot exceed 100%.",
    );
  }

  const minimumSpend =
    payload.minimumSpend ===
      null ||
    payload.minimumSpend ===
      undefined
      ? 0
      : Number(
          payload.minimumSpend,
        );

  if (
    !Number.isFinite(
      minimumSpend,
    ) ||
    minimumSpend < 0
  ) {
    throw new Error(
      "Minimum spend cannot be negative.",
    );
  }

  const maximumDiscount =
    payload.maximumDiscount ===
      null ||
    payload.maximumDiscount ===
      undefined
      ? null
      : Number(
          payload.maximumDiscount,
        );

  if (
    maximumDiscount !==
      null &&
    (!Number.isFinite(
      maximumDiscount,
    ) ||
      maximumDiscount < 0)
  ) {
    throw new Error(
      "Maximum discount cannot be negative.",
    );
  }

  const usageLimit =
    payload.usageLimit ===
      null ||
    payload.usageLimit ===
      undefined
      ? null
      : Number(
          payload.usageLimit,
        );

  if (
    usageLimit !== null &&
    (!Number.isInteger(
      usageLimit,
    ) ||
      usageLimit < 0)
  ) {
    throw new Error(
      "Usage limit must be a whole number of 0 or greater.",
    );
  }

  const startsAt =
    parseOptionalDate(
      payload.startsAt,
    );

  const expiresAt =
    parseOptionalDate(
      payload.expiresAt,
    );

  if (
    startsAt &&
    expiresAt &&
    expiresAt.toMillis() <=
      startsAt.toMillis()
  ) {
    throw new Error(
      "Expiry must be later than the start date.",
    );
  }

  const applicableProducts =
    Array.from(
      new Set(
        (
          payload.applicableProducts ||
          []
        )
          .map(Number)
          .filter(
            Number.isFinite,
          ),
      ),
    );

  const applicableCategories =
    Array.from(
      new Set(
        (
          payload.applicableCategories ||
          []
        )
          .map(
            (category) =>
              String(
                category,
              )
                .trim()
                .toUpperCase(),
          )
          .filter(Boolean),
      ),
    );

  return {
    code,
    active:
      payload.active !==
      false,
    type:
      payload.type,
    value,
    minimumSpend,
    maximumDiscount,
    usageLimit,
    startsAt,
    expiresAt,
    applicableProducts,
    applicableCategories,
  };
}

export async function GET(
  request: Request,
) {
  try {
    await requireAdmin(
      request,
    );

    const snapshot =
      await adminFirestore
        .collection(
          "coupons",
        )
        .get();

    const coupons =
      snapshot.docs
        .map((entry) => {
          const data =
            entry.data();

          return {
            docId:
              entry.id,
            code:
              data.code ||
              entry.id,
            active:
              data.active !==
              false,
            type:
              data.type ||
              "percentage",
            value:
              Number(
                data.value ||
                  0,
              ),
            minimumSpend:
              data.minimumSpend ??
              0,
            maximumDiscount:
              data.maximumDiscount ??
              null,
            usageLimit:
              data.usageLimit ??
              null,
            usageCount:
              Number(
                data.usageCount ||
                  0,
              ),
            applicableProducts:
              Array.isArray(
                data.applicableProducts,
              )
                ? data.applicableProducts
                : [],
            applicableCategories:
              Array.isArray(
                data.applicableCategories,
              )
                ? data.applicableCategories
                : [],
            startsAt:
              toIso(
                data.startsAt,
              ),
            expiresAt:
              toIso(
                data.expiresAt,
              ),
            createdAt:
              toIso(
                data.createdAt,
              ),
            updatedAt:
              toIso(
                data.updatedAt,
              ),
          };
        })
        .sort(
          (a, b) =>
            String(
              a.code,
            ).localeCompare(
              String(
                b.code,
              ),
            ),
        );

    return Response.json({
      coupons,
    });
  } catch (error) {
    return errorResponse(
      error,
    );
  }
}

export async function POST(
  request: Request,
) {
  try {
    await requireAdmin(
      request,
    );

    const payload =
      (await request.json()) as CouponPayload;

    const validated =
      validatePayload(
        payload,
      );

    const ref =
      adminFirestore
        .collection(
          "coupons",
        )
        .doc(
          validated.code,
        );

    const existing =
      await ref.get();

    if (existing.exists) {
      return Response.json(
        {
          error:
            `Coupon ${validated.code} already exists.`,
        },
        {
          status: 409,
        },
      );
    }

    await ref.set({
      ...validated,
      usageCount: 0,
      createdAt:
        FieldValue.serverTimestamp(),
      updatedAt:
        FieldValue.serverTimestamp(),
    });

    return Response.json({
      success: true,
      code:
        validated.code,
    });
  } catch (error) {
    return errorResponse(
      error,
    );
  }
}

export async function PATCH(
  request: Request,
) {
  try {
    await requireAdmin(
      request,
    );

    const body =
      (await request.json()) as {
        docId?: string;
        action?:
          | "toggle"
          | "update";
        payload?: CouponPayload;
      };

    const docId =
      normalizeCouponCode(
        body.docId,
      );

    if (!docId) {
      return Response.json(
        {
          error:
            "Coupon document ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const ref =
      adminFirestore
        .collection(
          "coupons",
        )
        .doc(docId);

    const existing =
      await ref.get();

    if (!existing.exists) {
      return Response.json(
        {
          error:
            "Coupon not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (
      body.action ===
      "toggle"
    ) {
      const currentActive =
        existing.data()
          ?.active !== false;

      await ref.set(
        {
          active:
            !currentActive,
          updatedAt:
            FieldValue.serverTimestamp(),
        },
        {
          merge: true,
        },
      );

      return Response.json({
        success: true,
        active:
          !currentActive,
      });
    }

    const validated =
      validatePayload(
        {
          ...(body.payload ||
            {}),
          code: docId,
        },
      );

    await ref.set(
      {
        ...validated,
        code: docId,
        updatedAt:
          FieldValue.serverTimestamp(),
      },
      {
        merge: true,
      },
    );

    return Response.json({
      success: true,
      code: docId,
    });
  } catch (error) {
    return errorResponse(
      error,
    );
  }
}

export async function DELETE(
  request: Request,
) {
  try {
    await requireAdmin(
      request,
    );

    const body =
      (await request.json()) as {
        docId?: string;
      };

    const docId =
      normalizeCouponCode(
        body.docId,
      );

    if (!docId) {
      return Response.json(
        {
          error:
            "Coupon document ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    await adminFirestore
      .collection(
        "coupons",
      )
      .doc(docId)
      .delete();

    return Response.json({
      success: true,
    });
  } catch (error) {
    return errorResponse(
      error,
    );
  }
}
