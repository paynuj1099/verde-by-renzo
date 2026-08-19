import {
  adminAuth,
  adminFirestore,
  getAdminErrorResponse,
  verifyAdminRequest,
} from "@/lib/firebaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: {
    uid: string;
  };
};

type UpdateBody = {
  action?:
    | "setAdmin"
    | "setDisabled"
    | "revokeSessions"
    | "generateVerificationLink"
    | "updateProfile"
    | "setPassword"
    | "unlinkProvider";

  admin?: boolean;
  disabled?: boolean;
  displayName?: string;
  phoneNumber?: string;
  password?: string;
  providerId?: string;
};

const ALLOWED_UNLINK_PROVIDERS = new Set([
  "google.com",
  "github.com",
  "microsoft.com",
  "apple.com",
  "facebook.com",
  "twitter.com",
  "phone",
  "password",
]);

function normalizePhoneNumber(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  if (!/^\+[1-9]\d{7,14}$/.test(trimmed)) {
    throw new Error(
      "Phone number must use international E.164 format, for example +639171234567.",
    );
  }

  return trimmed;
}

/**
 * PATCH
 *
 * Protected Firebase Authentication account management.
 */
export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  try {
    const currentAdmin =
      await verifyAdminRequest(request);

    const uid = context.params.uid;

    if (!uid) {
      return Response.json(
        { error: "User UID is required." },
        { status: 400 },
      );
    }

    const body =
      (await request.json()) as UpdateBody;

    if (body.action === "setAdmin") {
      if (typeof body.admin !== "boolean") {
        return Response.json(
          {
            error:
              "The admin value must be true or false.",
          },
          { status: 400 },
        );
      }

      if (
        uid === currentAdmin.uid &&
        body.admin === false
      ) {
        return Response.json(
          {
            error:
              "You cannot remove your own administrator access.",
          },
          { status: 400 },
        );
      }

      const user =
        await adminAuth.getUser(uid);

      const claims: Record<string, unknown> = {
        ...(user.customClaims ?? {}),
      };

      if (body.admin) {
        claims.admin = true;
      } else {
        delete claims.admin;
      }

      await adminAuth.setCustomUserClaims(
        uid,
        claims,
      );

      await adminAuth.revokeRefreshTokens(uid);

      return Response.json({
        success: true,
        uid,
        isAdmin: body.admin,
      });
    }

    if (body.action === "setDisabled") {
      if (typeof body.disabled !== "boolean") {
        return Response.json(
          {
            error:
              "The disabled value must be true or false.",
          },
          { status: 400 },
        );
      }

      if (
        uid === currentAdmin.uid &&
        body.disabled === true
      ) {
        return Response.json(
          {
            error:
              "You cannot disable your own administrator account.",
          },
          { status: 400 },
        );
      }

      const updatedUser =
        await adminAuth.updateUser(uid, {
          disabled: body.disabled,
        });

      await adminFirestore
        .collection("users")
        .doc(uid)
        .set(
          {
            disabled: updatedUser.disabled,
          },
          { merge: true },
        );

      if (body.disabled) {
        await adminAuth.revokeRefreshTokens(uid);
      }

      return Response.json({
        success: true,
        uid,
        disabled: updatedUser.disabled,
      });
    }

    if (body.action === "revokeSessions") {
      if (uid === currentAdmin.uid) {
        return Response.json(
          {
            error:
              "You cannot revoke your own sessions from this page.",
          },
          { status: 400 },
        );
      }

      await adminAuth.revokeRefreshTokens(uid);

      return Response.json({
        success: true,
        uid,
      });
    }

    if (
      body.action ===
      "generateVerificationLink"
    ) {
      const user =
        await adminAuth.getUser(uid);

      if (!user.email) {
        return Response.json(
          {
            error:
              "This Firebase account does not have an email address.",
          },
          { status: 400 },
        );
      }

      if (user.emailVerified) {
        return Response.json(
          {
            error:
              "This email address is already verified.",
          },
          { status: 400 },
        );
      }

      const verificationLink =
        await adminAuth.generateEmailVerificationLink(
          user.email,
        );

      return Response.json({
        success: true,
        uid,
        email: user.email,
        verificationLink,
      });
    }

    if (body.action === "updateProfile") {
      const displayName =
        typeof body.displayName === "string"
          ? body.displayName.trim()
          : "";

      const rawPhone =
        typeof body.phoneNumber === "string"
          ? body.phoneNumber
          : "";

      if (!displayName) {
        return Response.json(
          {
            error:
              "Customer name is required.",
          },
          { status: 400 },
        );
      }

      let phoneNumber: string | null;

      try {
        phoneNumber = normalizePhoneNumber(
          rawPhone,
        );
      } catch (phoneError) {
        return Response.json(
          {
            error:
              phoneError instanceof Error
                ? phoneError.message
                : "Invalid phone number.",
          },
          { status: 400 },
        );
      }

      const updatedUser =
        await adminAuth.updateUser(uid, {
          displayName,
          phoneNumber,
        });

      await adminFirestore
        .collection("users")
        .doc(uid)
        .set(
          {
            displayName,
            phone: phoneNumber,
            phoneNumber,
          },
          { merge: true },
        );

      return Response.json({
        success: true,
        user: {
          uid: updatedUser.uid,
          displayName:
            updatedUser.displayName ?? null,
          phoneNumber:
            updatedUser.phoneNumber ?? null,
        },
      });
    }

    if (body.action === "setPassword") {
      const password =
        typeof body.password === "string"
          ? body.password
          : "";

      if (password.length < 12) {
        return Response.json(
          {
            error:
              "Password must be at least 12 characters.",
          },
          { status: 400 },
        );
      }

      if (
        !/[a-z]/.test(password) ||
        !/[A-Z]/.test(password) ||
        !/\d/.test(password)
      ) {
        return Response.json(
          {
            error:
              "Password must contain uppercase, lowercase, and a number.",
          },
          { status: 400 },
        );
      }

      const user =
        await adminAuth.getUser(uid);

      const hasPasswordProvider =
        user.providerData.some(
          (provider) =>
            provider.providerId === "password",
        ) || Boolean(user.passwordHash);

      if (!hasPasswordProvider) {
        return Response.json(
          {
            error:
              "This account does not currently have Email/Password sign-in connected.",
          },
          { status: 400 },
        );
      }

      await adminAuth.updateUser(uid, {
        password,
      });

      await adminAuth.revokeRefreshTokens(uid);

      return Response.json({
        success: true,
        uid,
      });
    }

    if (body.action === "unlinkProvider") {
      const providerId =
        typeof body.providerId === "string"
          ? body.providerId.trim()
          : "";

      if (
        !providerId ||
        !ALLOWED_UNLINK_PROVIDERS.has(
          providerId,
        )
      ) {
        return Response.json(
          {
            error:
              "A valid provider is required.",
          },
          { status: 400 },
        );
      }

      const user =
        await adminAuth.getUser(uid);

      const linkedProviders = new Set(
        user.providerData.map(
          (provider) => provider.providerId,
        ),
      );

      if (user.passwordHash) {
        linkedProviders.add("password");
      }

      if (!linkedProviders.has(providerId)) {
        return Response.json(
          {
            error:
              "That sign-in provider is not connected to this Firebase account.",
          },
          { status: 400 },
        );
      }

      if (linkedProviders.size <= 1) {
        return Response.json(
          {
            error:
              "You cannot disconnect the account's only sign-in provider.",
          },
          { status: 400 },
        );
      }

      const updatedUser =
        await adminAuth.updateUser(uid, {
          providersToUnlink: [providerId],
        });

      const providers =
        updatedUser.providerData.map(
          (provider) => provider.providerId,
        );

      if (
        providerId !== "password" &&
        user.passwordHash
      ) {
        providers.push("password");
      }

      await adminFirestore
        .collection("users")
        .doc(uid)
        .set(
          {
            providers: Array.from(
              new Set(providers),
            ),
          },
          { merge: true },
        );

      await adminAuth.revokeRefreshTokens(uid);

      return Response.json({
        success: true,
        uid,
        providerId,
      });
    }

    return Response.json(
      { error: "Invalid admin action." },
      { status: 400 },
    );
  } catch (error) {
    return getAdminErrorResponse(error);
  }
}

/**
 * DELETE
 *
 * Deletes the customer's authentication account and
 * non-essential account data while preserving historical
 * order records.
 */
export async function DELETE(
  request: Request,
  context: RouteContext,
) {
  try {
    const currentAdmin =
      await verifyAdminRequest(request);

    const uid = context.params.uid;

    if (!uid) {
      return Response.json(
        { error: "User UID is required." },
        { status: 400 },
      );
    }

    if (uid === currentAdmin.uid) {
      return Response.json(
        {
          error:
            "You cannot delete your own administrator account.",
        },
        { status: 400 },
      );
    }

    await adminAuth.getUser(uid);

    const profileReference =
      adminFirestore
        .collection("users")
        .doc(uid);

    await adminFirestore.recursiveDelete(
      profileReference.collection("devices"),
    );

    await adminFirestore.recursiveDelete(
      profileReference.collection("data"),
    );

    const profileSnapshot =
      await profileReference.get();

    if (profileSnapshot.exists) {
      await profileReference.delete();
    }

    await adminAuth.deleteUser(uid);

    return Response.json({
      success: true,
      uid,
      deletedAccount: {
        authenticationDeleted: true,
        profileDeleted: true,
        devicesDeleted: true,
        privateDataDeleted: true,
        ordersPreserved: true,
      },
    });
  } catch (error) {
    return getAdminErrorResponse(error);
  }
}
