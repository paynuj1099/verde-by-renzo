import {
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";

import {
  getAuth,
} from "firebase-admin/auth";

import {
  getFirestore,
} from "firebase-admin/firestore";

const projectId =
  process.env.FIREBASE_ADMIN_PROJECT_ID;

const clientEmail =
  process.env.FIREBASE_ADMIN_CLIENT_EMAIL;

const privateKey =
  process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n",
  );

if (!projectId) {
  throw new Error(
    "Missing FIREBASE_ADMIN_PROJECT_ID environment variable.",
  );
}

if (!clientEmail) {
  throw new Error(
    "Missing FIREBASE_ADMIN_CLIENT_EMAIL environment variable.",
  );
}

if (!privateKey) {
  throw new Error(
    "Missing FIREBASE_ADMIN_PRIVATE_KEY environment variable.",
  );
}

const firebaseAdminApp =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });

export const adminAuth =
  getAuth(firebaseAdminApp);

/*
 * IMPORTANT:
 *
 * Your Verde project uses a NAMED Firestore
 * database whose database ID is:
 *
 * default
 *
 * This is different from Firebase's special:
 *
 * (default)
 *
 * Passing "default" here makes Firebase Admin
 * use the same Firestore database as the
 * client-side application.
 */
export const adminFirestore =
  getFirestore(
    firebaseAdminApp,
    "default",
  );

/*
 * Verify that the incoming API request belongs
 * to a signed-in Firebase administrator.
 */
export async function verifyAdminRequest(
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
      "UNAUTHENTICATED",
    );
  }

  const idToken =
    authorization
      .slice(7)
      .trim();

  if (!idToken) {
    throw new Error(
      "UNAUTHENTICATED",
    );
  }

  const decodedToken =
    await adminAuth.verifyIdToken(
      idToken,
    );

  if (
    decodedToken.admin !== true
  ) {
    throw new Error(
      "FORBIDDEN",
    );
  }

  return decodedToken;
}

/*
 * Standard response handler for protected
 * administrator API routes.
 */
export function getAdminErrorResponse(
  error: unknown,
) {
  console.error(
    "Admin API error:",
    error,
  );

  if (error instanceof Error) {
    if (
      error.message ===
      "UNAUTHENTICATED"
    ) {
      return Response.json(
        {
          error:
            "You must be signed in.",
        },
        {
          status: 401,
        },
      );
    }

    if (
      error.message ===
      "FORBIDDEN"
    ) {
      return Response.json(
        {
          error:
            "Administrator access is required.",
        },
        {
          status: 403,
        },
      );
    }
  }

  const firebaseError =
    error as {
      code?: string | number;
      message?: string;
    };

  return Response.json(
    {
      error:
        firebaseError.message ||
        "An unexpected server error occurred.",

      code:
        firebaseError.code ??
        "unknown",
    },
    {
      status: 500,
    },
  );
}