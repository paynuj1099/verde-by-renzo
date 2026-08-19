import {
  adminAuth,
  adminFirestore,
  getAdminErrorResponse,
  verifyAdminRequest,
} from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProviderInfo = {
  providerId: string;
  label: string;
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
};

type CreateUserBody = {
  displayName?: string;
  email?: string;
  password?: string;
};

function getProviderLabel(providerId: string) {
  switch (providerId) {
    case "google.com":
      return "Google";

    case "github.com":
      return "GitHub";

    case "microsoft.com":
      return "Microsoft";

    case "apple.com":
      return "Apple";

    case "facebook.com":
      return "Facebook";

    case "twitter.com":
      return "Twitter";

    case "phone":
      return "Phone";

    case "password":
      return "Email";

    default:
      return providerId;
  }
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidTemporaryPassword(password: string) {
  /*
   * Stronger than Firebase's minimum.
   *
   * Require:
   * - 12 characters
   * - lowercase
   * - uppercase
   * - number
   */
  return (
    password.length >= 12 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password)
  );
}

/**
 * GET
 *
 * Lists the real Firebase Authentication users.
 */
export async function GET(request: Request) {
  try {
    await verifyAdminRequest(request);

    const users = [];
    let nextPageToken: string | undefined;

    do {
      const result = await adminAuth.listUsers(
        1000,
        nextPageToken,
      );

      for (const user of result.users) {
        const providers: ProviderInfo[] =
          user.providerData.map((provider) => ({
            providerId: provider.providerId,
            label: getProviderLabel(provider.providerId),
            uid: provider.uid,
            email: provider.email ?? null,
            displayName: provider.displayName ?? null,
            photoURL: provider.photoURL ?? null,
          }));

        /*
         * Password-only accounts can have no external
         * providerData entries.
         */
        if (providers.length === 0 && user.email) {
          providers.push({
            providerId: "password",
            label: "Email",
            uid: user.uid,
            email: user.email,
            displayName: user.displayName ?? null,
            photoURL: user.photoURL ?? null,
          });
        }

        users.push({
          uid: user.uid,
          displayName: user.displayName ?? null,
          email: user.email ?? null,
          emailVerified: user.emailVerified,
          photoURL: user.photoURL ?? null,
          phoneNumber: user.phoneNumber ?? null,
          disabled: user.disabled,

          isAdmin:
            user.customClaims?.admin === true,

          customClaims:
            user.customClaims ?? {},

          providers,

          createdAt:
            user.metadata.creationTime ?? null,

          lastLoginAt:
            user.metadata.lastSignInTime ?? null,

          tokensValidAfterTime:
            user.tokensValidAfterTime ?? null,
        });
      }

      nextPageToken = result.pageToken;
    } while (nextPageToken);

    users.sort((a, b) => {
      const first = a.createdAt
        ? new Date(a.createdAt).getTime()
        : 0;

      const second = b.createdAt
        ? new Date(b.createdAt).getTime()
        : 0;

      return second - first;
    });

    return Response.json({
      users,
    });
  } catch (error) {
    return getAdminErrorResponse(error);
  }
}

/**
 * POST
 *
 * Creates a new Email/Password Firebase account.
 *
 * Only an authenticated administrator can call this route.
 */
export async function POST(request: Request) {
  let createdUid: string | null = null;

  try {
    await verifyAdminRequest(request);

    const body =
      (await request.json()) as CreateUserBody;

    const displayName =
      body.displayName?.trim() ?? "";

    const email =
      body.email?.trim().toLowerCase() ?? "";

    const password =
      body.password ?? "";

    if (!displayName) {
      return Response.json(
        {
          error:
            "Customer name is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!email || !isValidEmail(email)) {
      return Response.json(
        {
          error:
            "Enter a valid email address.",
        },
        {
          status: 400,
        },
      );
    }

    if (!isValidTemporaryPassword(password)) {
      return Response.json(
        {
          error:
            "Temporary password must be at least 12 characters and contain uppercase, lowercase and a number.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * Prevent duplicate accounts.
     */
    try {
      await adminAuth.getUserByEmail(email);

      return Response.json(
        {
          error:
            "A Firebase account already exists with this email address.",
        },
        {
          status: 409,
        },
      );
    } catch (error) {
      const firebaseError = error as {
        code?: string;
      };

      if (
        firebaseError.code !==
        "auth/user-not-found"
      ) {
        throw error;
      }
    }

    /*
     * Create the Firebase Authentication user.
     */
    const user =
      await adminAuth.createUser({
        email,
        password,
        displayName,
        emailVerified: false,
        disabled: false,
      });

    createdUid = user.uid;

    /*
     * Important:
     *
     * The user is always created as a normal customer.
     * Creating a user from this dialog never grants admin.
     */
    await adminAuth.setCustomUserClaims(
      user.uid,
      {
        mustChangePassword: true,
      },
    );

    /*
     * Create the matching Firestore profile.
     */
    await adminFirestore
      .collection("users")
      .doc(user.uid)
      .set({
        uid: user.uid,

        displayName,
        email,

        provider: "password",

        role: "customer",
        disabled: false,

        createdByAdmin: true,
        mustChangePassword: true,

        createdAt:
          FieldValue.serverTimestamp(),

        lastLoginAt: null,
      });

    /*
     * Generate a Firebase password-reset URL.
     *
     * We intentionally DO NOT store this URL in Firestore.
     */
    const resetLink =
      await adminAuth.generatePasswordResetLink(
        email,
      );

    return Response.json(
      {
        success: true,

        user: {
          uid: user.uid,
          email: user.email ?? email,
          displayName:
            user.displayName ?? displayName,
        },

        resetLink,

        message:
          "Customer account created successfully.",
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    /*
     * If something fails after Auth creation,
     * attempt to roll back the new account.
     */
    if (createdUid) {
      try {
        await adminAuth.deleteUser(
          createdUid,
        );
      } catch (rollbackError) {
        console.error(
          "Failed to rollback Firebase Auth user:",
          rollbackError,
        );
      }

      try {
        await adminFirestore
          .collection("users")
          .doc(createdUid)
          .delete();
      } catch (rollbackError) {
        console.error(
          "Failed to rollback Firestore profile:",
          rollbackError,
        );
      }
    }

    const firebaseError = error as {
      code?: string;
      message?: string;
    };

    if (
      firebaseError.code ===
      "auth/email-already-exists"
    ) {
      return Response.json(
        {
          error:
            "An account already exists with this email address.",
        },
        {
          status: 409,
        },
      );
    }

    if (
      firebaseError.code ===
      "auth/invalid-password"
    ) {
      return Response.json(
        {
          error:
            "The temporary password is invalid.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      firebaseError.code ===
      "auth/invalid-email"
    ) {
      return Response.json(
        {
          error:
            "The email address is invalid.",
        },
        {
          status: 400,
        },
      );
    }

    return getAdminErrorResponse(
      error,
    );
  }
}