"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Github,
  KeyRound,
  Link2,
  Mail,
  MapPin,
  PackagePlus,
  Phone,
  ShieldCheck,
  Store,
  Unlink,
  User,
} from "lucide-react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";
import { getIdTokenResult } from "firebase/auth";
import { useAuth } from "@/context/AuthContext";
import AdminConfirmModal from "@/components/AdminConfirmModal";
import LogoutButton from "@/components/LogoutButton";
import { firestore } from "@/lib/firebase";
import {
  getColorDisplay,
  getProductById,
  getProductImage,
} from "@/lib/productUtils";
import type { CartItem } from "@/context/CartContext";

type AccountOrder = {
  id: string;
  totalAmount: number;
  totalItems: number;
  status: string;
  createdAt?: Timestamp;
  items?: CartItem[];
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  trackingNumber?: string;
  carrier?: string;
  trackingNote?: string;
};

type LoginProvider = "google" | "github" | "password" | null;
type LinkedProviderId = "google.com" | "github.com" | "password";

export default function ProfilePage() {
  const router = useRouter();

  const {
    user,
    loading,
    connectedProviders,
    linkGoogleAccount,
    linkGithubAccount,
    unlinkProvider,
    resetPassword,
  } = useAuth();

  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);

  const [loginProvider, setLoginProvider] =
    useState<LoginProvider>(null);

  const [loadingProvider, setLoadingProvider] =
    useState(true);
  const [accountAction, setAccountAction] = useState<
    "google" | "github" | "unlink" | null
  >(null);
  const [passwordActionLoading, setPasswordActionLoading] = useState(false);
  const [accountMessage, setAccountMessage] = useState("");
  const [confirmUnlinkProvider, setConfirmUnlinkProvider] = useState<
    LinkedProviderId | null
  >(null);

  /*
   * Load order history.
   */
  useEffect(() => {
    if (!user) {
      setOrders([]);
      return;
    }

    getDocs(
      query(
        collection(
          firestore,
          "users",
          user.uid,
          "orders",
        ),
        orderBy("createdAt", "desc"),
      ),
    )
      .then((snapshot) =>
        setOrders(
          snapshot.docs.map(
            (item) =>
              ({
                id: item.id,
                ...item.data(),
              }) as AccountOrder,
          ),
        ),
      )
      .catch((error) =>
        console.error(
          "Unable to load order history:",
          error,
        ),
      );
  }, [user]);

  /*
   * Load the actual provider used for this login.
   *
   * AuthContext stores:
   *
   * provider: "google"
   * provider: "github"
   * provider: "password"
   *
   * in:
   *
   * users/{uid}
   */
  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      setLoginProvider(null);
      setLoadingProvider(false);
      return;
    }

    setLoadingProvider(true);

    const loadProvider = async () => {
      try {
        /*
         * First check sessionStorage.
         *
         * This is useful because it represents
         * the exact provider used in this browser session.
         */
        const sessionProvider =
          window.sessionStorage.getItem(
            "verde-login-provider",
          );

        if (
          sessionProvider === "google" ||
          sessionProvider === "github" ||
          sessionProvider === "password"
        ) {
          setLoginProvider(sessionProvider);
          setLoadingProvider(false);
          return;
        }

        /*
         * Fall back to Firestore.
         */
        const profileSnapshot = await getDoc(
          doc(
            firestore,
            "users",
            user.uid,
          ),
        );

        if (profileSnapshot.exists()) {
          const data = profileSnapshot.data();

          const storedProvider = data.provider;

          if (
            storedProvider === "google" ||
            storedProvider === "github" ||
            storedProvider === "password"
          ) {
            setLoginProvider(storedProvider);
            setLoadingProvider(false);
            return;
          }
        }

        /*
         * Final fallback for older accounts
         * that do not yet have provider stored.
         */
        const providerIds =
          user.providerData.map(
            (provider) =>
              provider.providerId,
          );

        if (
          providerIds.length === 1 &&
          providerIds.includes("github.com")
        ) {
          setLoginProvider("github");
        } else if (
          providerIds.length === 1 &&
          providerIds.includes("google.com")
        ) {
          setLoginProvider("google");
        } else if (
          providerIds.length === 1 &&
          providerIds.includes("password")
        ) {
          setLoginProvider("password");
        } else {
          /*
           * If multiple providers are linked and
           * we don't know the login method, don't
           * incorrectly claim Google.
           */
          setLoginProvider(null);
        }
      } catch (error) {
        console.error(
          "Unable to load login provider:",
          error,
        );

        setLoginProvider(null);
      } finally {
        setLoadingProvider(false);
      }
    };

    loadProvider();
  }, [loading, user]);

  useEffect(() => {
    if (!accountMessage) return;
    const timeout = window.setTimeout(() => setAccountMessage(""), 3600);
    return () => window.clearTimeout(timeout);
  }, [accountMessage]);

  /*
   * Check admin role.
   */
  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      setCheckingRole(false);
      return;
    }

    getIdTokenResult(user)
      .then((token) => {
        const admin =
          token.claims.admin === true;

        setIsAdmin(admin);

        if (admin) {
          router.replace(
            "/admin/settings",
          );

          return;
        }

        setCheckingRole(false);
      })
      .catch(() => {
        setIsAdmin(false);
        setCheckingRole(false);
      });
  }, [loading, router, user]);

  if (
    loading ||
    checkingRole ||
    loadingProvider
  ) {
    return (
      <main className="min-h-screen bg-gray-50 pt-32 text-center">
        Loading profile...
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-gray-50 pt-32 text-center">
        <p className="mb-4 text-gray-600">
          Sign in to view your profile.
        </p>

        <Link
          href="/login"
          className="font-semibold text-forest-600"
        >
          Go to login
        </Link>
      </main>
    );
  }

  const name =
    user.displayName ||
    "Verde customer";

  const providerLabel =
    loginProvider === "google"
      ? "Google"
      : loginProvider === "github"
        ? "GitHub"
        : loginProvider === "password"
          ? "Email and password"
          : "Linked account";

  const sessionProviderId: LinkedProviderId | null =
    loginProvider === "google"
      ? "google.com"
      : loginProvider === "github"
        ? "github.com"
        : loginProvider === "password"
          ? "password"
          : null;

  const connectedAccounts =
    connectedProviders.length > 0
      ? connectedProviders
      : sessionProviderId
        ? [sessionProviderId]
        : [];

  const connectGoogleAccount = async () => {
    setAccountAction("google");
    try {
      await linkGoogleAccount();
      setAccountMessage("Google account connected successfully.");
    } catch (error) {
      const code = (error as { code?: string }).code;
      setAccountMessage(
        code === "auth/credential-already-in-use"
          ? "Unable to connect Google. That Google account is already linked to another Verde account."
          : error instanceof Error
            ? error.message
            : "Unable to connect Google account.",
      );
    } finally {
      setAccountAction(null);
    }
  };

  const connectGithubAccount = async () => {
    setAccountAction("github");
    try {
      await linkGithubAccount();
      setAccountMessage("GitHub account connected successfully.");
    } catch (error) {
      const code = (error as { code?: string }).code;
      setAccountMessage(
        code === "auth/credential-already-in-use"
          ? "Unable to connect GitHub. That GitHub account is already linked to another Verde account."
          : error instanceof Error
            ? error.message
            : "Unable to connect GitHub account.",
      );
    } finally {
      setAccountAction(null);
    }
  };

  const disconnectProvider = (providerId: LinkedProviderId) => {
    if (connectedAccounts.length <= 1) {
      setAccountMessage(
        "Your only sign-in method cannot be disconnected. Add another sign-in method first.",
      );
      return;
    }

    setConfirmUnlinkProvider(providerId);
  };

  const confirmAccountUnlink = async () => {
    if (!confirmUnlinkProvider) return;

    const providerId = confirmUnlinkProvider;
    setConfirmUnlinkProvider(null);
    setAccountAction("unlink");
    try {
      await unlinkProvider(providerId);
      setAccountMessage(
        providerId === "google.com"
          ? "Google account disconnected."
          : providerId === "github.com"
            ? "GitHub account disconnected."
            : "Email & Password sign-in disconnected.",
      );
    } catch (error) {
      setAccountMessage(
        error instanceof Error
          ? error.message
          : "Unable to disconnect the selected account.",
      );
    } finally {
      setAccountAction(null);
    }
  };

  const sendReset = async () => {
    if (!user?.email) {
      setAccountMessage(
        "Add an email address to your account before setting a password.",
      );
      return;
    }

    setPasswordActionLoading(true);
    try {
      await resetPassword(user.email);
      setAccountMessage(
        "Password setup link sent. Check your inbox and spam folder.",
      );
    } catch (error) {
      setAccountMessage(
        error instanceof Error
          ? error.message
          : "Unable to send password setup email.",
      );
    } finally {
      setPasswordActionLoading(false);
    }
  };

  const deliveredOrders =
    orders.filter(
      (order) =>
        order.status === "delivered",
    );

  const totalSpent =
    deliveredOrders.reduce(
      (total, order) =>
        total +
        Number(
          order.totalAmount || 0,
        ),
      0,
    );

  return (
    <main className="min-h-screen bg-gradient-to-br from-forest-50 to-white pb-16 pt-32">
      <AdminConfirmModal
        open={confirmUnlinkProvider !== null}
        title={`Disconnect ${
          confirmUnlinkProvider === "google.com"
            ? "Google"
            : confirmUnlinkProvider === "github.com"
              ? "GitHub"
              : "Email & Password"
        }?`}
        description={`You will no longer be able to sign in to this Verde account using ${
          confirmUnlinkProvider === "google.com"
            ? "Google"
            : confirmUnlinkProvider === "github.com"
              ? "GitHub"
              : "your email and password"
        }. Your account data and other connected sign-in methods will remain unchanged.`}
        confirmLabel="Disconnect account"
        tone="danger"
        onConfirm={confirmAccountUnlink}
        onCancel={() => setConfirmUnlinkProvider(null)}
      />

      <div className="container mx-auto max-w-[1240px] px-4">
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="h-28 bg-forest-700" />
            <div className="px-6 pb-8 sm:px-10">
              <section>
            {/* Profile Image */}
            <div className="-mt-12 mb-5 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-forest-100 text-3xl font-semibold text-forest-700 shadow-md">
              {user.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt={name}
                  width={96}
                  height={96}
                  className="h-full w-full object-cover"
                  priority
                />
              ) : (
                name
                  .charAt(0)
                  .toUpperCase()
              )}
            </div>

            {/* Name / Role */}
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-serif text-3xl text-forest-800">
                {name}
              </h1>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                  isAdmin
                    ? "bg-gold-100 text-gold-700"
                    : "bg-forest-50 text-forest-700"
                }`}
              >
                {isAdmin
                  ? "Administrator"
                  : "Customer"}
              </span>
            </div>

            <p className="mt-1 text-gray-500">
              Verde by Renzo account
            </p>

            {/* Account Information */}
            <div className="mt-8 space-y-3 rounded-xl bg-gray-50 p-5">
              <div className="flex items-center gap-3 text-gray-700">
                <User
                  size={19}
                  className="text-forest-600"
                />

                <span>{name}</span>
              </div>

              <div className="flex items-center gap-3 text-gray-700">
                <Mail
                  size={19}
                  className="text-forest-600"
                />

                <span className="break-all">
                  {user.email}
                </span>
              </div>

              <div className="flex items-center gap-3 text-gray-700">
                <ShieldCheck
                  size={19}
                  className="text-forest-600"
                />

                <span>
                  {user.emailVerified
                    ? "Verified"
                    : "Unverified"}{" "}
                  · Signed in with{" "}
                  {providerLabel}
                </span>
              </div>
            </div>

            <section className="mt-5 rounded-xl border border-[#e3ddd1] bg-[#fcfaf5] p-5">
              <div className="mb-4 flex items-center gap-3">
                <Link2 size={20} className="text-gold-600" />
                <div>
                  <h2 className="font-serif text-xl text-forest-800">
                    Connected accounts
                  </h2>
                  <p className="text-xs text-gray-500">
                    Manage the accounts you can use to sign in.
                  </p>
                </div>
              </div>

              {accountMessage && (
                <p className="mb-3 rounded-lg border border-[#e8e2d6] bg-white px-3 py-2 text-xs text-gray-600">
                  {accountMessage}
                </p>
              )}

              <div className="space-y-3">
                <div className="flex flex-col items-stretch gap-3 rounded-xl border border-gray-100 bg-[#f5f3ed] p-3 sm:flex-row sm:items-center sm:p-4">
                  <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-white shadow-sm">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="#4285F4"
                        d="M21.6 12.23c0-.71-.06-1.24-.2-1.79H12v3.26h5.52a4.72 4.72 0 0 1-2.05 3.1v2.67h3.32c1.95-1.79 3.07-4.43 3.07-7.24Z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 22c2.7 0 4.96-.89 6.61-2.42l-3.32-2.67c-.89.6-2.03.96-3.29.96-2.53 0-4.68-1.71-5.45-4.01H3.12v2.75A10 10 0 0 0 12 22Z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M6.55 13.86A6.02 6.02 0 0 1 6.23 12c0-.65.11-1.28.32-1.86V7.39H3.12A10 10 0 0 0 2 12c0 1.65.4 3.21 1.12 4.61l3.43-2.75Z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 6.13c1.47 0 2.79.51 3.83 1.5l2.87-2.88A9.67 9.67 0 0 0 12 2a10 10 0 0 0-8.88 5.39l3.43 2.75c.77-2.3 2.92-4.01 5.45-4.01Z"
                      />
                    </svg>
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-forest-900">Google</p>
                    <p className="text-xs text-gray-500">
                      {connectedAccounts.includes("google.com")
                        ? "Connected to this Verde account"
                        : "Not connected"}
                    </p>
                  </div>

                  {connectedAccounts.includes("google.com") ? (
                    <button
                      type="button"
                      disabled={accountAction !== null || connectedAccounts.length <= 1}
                      onClick={() => disconnectProvider("google.com")}
                      title={
                        connectedAccounts.length <= 1
                          ? "Connect another sign-in method before disconnecting Google."
                          : "Disconnect Google"
                      }
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                    >
                      <Unlink size={14} />
                      Disconnect
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={accountAction !== null}
                      onClick={connectGoogleAccount}
                      className="w-full rounded-lg bg-forest-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-forest-800 disabled:opacity-50 sm:w-auto"
                    >
                      {accountAction === "google" ? "Connecting..." : "Connect"}
                    </button>
                  )}
                </div>

                <div className="flex flex-col items-stretch gap-3 rounded-xl border border-gray-100 bg-[#f5f3ed] p-3 sm:flex-row sm:items-center sm:p-4">
                  <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-white text-[#24292f] shadow-sm">
                    <Github size={21} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-forest-900">GitHub</p>
                    <p className="text-xs text-gray-500">
                      {connectedAccounts.includes("github.com")
                        ? "Connected to this Verde account"
                        : "Not connected"}
                    </p>
                  </div>

                  {connectedAccounts.includes("github.com") ? (
                    <button
                      type="button"
                      disabled={accountAction !== null || connectedAccounts.length <= 1}
                      onClick={() => disconnectProvider("github.com")}
                      title={
                        connectedAccounts.length <= 1
                          ? "Connect another sign-in method before disconnecting GitHub."
                          : "Disconnect GitHub"
                      }
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                    >
                      <Unlink size={14} />
                      Disconnect
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={accountAction !== null}
                      onClick={connectGithubAccount}
                      className="w-full rounded-lg bg-forest-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-forest-800 disabled:opacity-50 sm:w-auto"
                    >
                      {accountAction === "github" ? "Connecting..." : "Connect"}
                    </button>
                  )}
                </div>

                <div className="flex flex-col items-stretch gap-3 rounded-xl border border-gray-100 bg-[#f5f3ed] p-3 sm:flex-row sm:items-center sm:p-4">
                  <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-white text-forest-700 shadow-sm">
                    <KeyRound size={20} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-forest-900">Email &amp; Password</p>
                    <p className="truncate text-xs text-gray-500">
                      {connectedAccounts.includes("password")
                        ? `Connected${user?.email ? ` · ${user.email}` : ""}`
                        : "Not connected"}
                    </p>
                  </div>

                  {connectedAccounts.includes("password") ? (
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                      <button
                        type="button"
                        disabled={accountAction !== null || connectedAccounts.length <= 1}
                        onClick={() => disconnectProvider("password")}
                        title={
                          connectedAccounts.length <= 1
                            ? "Add another sign-in method before disconnecting Email & Password."
                            : "Disconnect Email & Password"
                        }
                        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                      >
                        <Unlink size={14} />
                        Disconnect
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={passwordActionLoading}
                      onClick={sendReset}
                      title="Send a secure email link to set a password for this account"
                      className="flex flex-none items-center gap-1.5 rounded-lg bg-forest-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-forest-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <KeyRound size={14} />
                      {passwordActionLoading ? "Sending..." : "Set password"}
                    </button>
                  )}
                </div>
              </div>

              {connectedAccounts.length <= 1 && (
                <p className="mt-3 text-[11px] leading-5 text-gray-500">
                  Your only sign-in method cannot be disconnected. Add another
                  sign-in method first.
                </p>
              )}
            </section>

            {/* Admin */}
            {isAdmin && (
              <section className="mt-6 rounded-xl border border-gold-200 bg-gold-50 p-5">
                <div className="mb-4">
                  <h2 className="font-serif text-xl text-forest-800">
                    Admin Dashboard
                  </h2>

                  <p className="text-sm text-gray-600">
                    Manage the Firestore
                    catalog and review the
                    public storefront.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Link
                    href="/admin"
                    className="flex items-center justify-center gap-2 rounded-lg bg-forest-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-forest-700"
                  >
                    <PackagePlus
                      size={18}
                    />
                    Open Admin Dashboard
                  </Link>

                  <Link
                    href="/shop"
                    className="flex items-center justify-center gap-2 rounded-lg border border-forest-600 px-4 py-3 font-semibold text-forest-700 transition-colors hover:bg-white"
                  >
                    <Store size={18} />
                    View Storefront
                  </Link>
                </div>
              </section>
            )}

                <LogoutButton className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-5 py-3 font-semibold text-red-600 transition-colors hover:bg-red-50" />
              </section>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-xl sm:p-8">
            {/* Statistics */}
            <section className="space-y-8">
            <section className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-xl bg-[#f5f3ed] p-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-gold-700 shadow-sm">
                  <CircleDollarSign
                    size={19}
                  />
                </span>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                    Total spent
                  </p>

                  <p className="font-serif text-xl text-forest-900">
                    ₱
                    {totalSpent.toLocaleString(
                      "en-PH",
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-[#f5f3ed] p-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-emerald-700 shadow-sm">
                  <CheckCircle2
                    size={19}
                  />
                </span>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                    Delivered orders
                  </p>

                  <p className="font-serif text-xl text-forest-900">
                    {
                      deliveredOrders.length
                    }
                  </p>
                </div>
              </div>
            </section>

            {/* Order History */}
            <section>
              <h2 className="mb-3 font-serif text-xl text-forest-800">
                Order History (
                {orders.length})
              </h2>

              {orders.length ? (
                <div className="space-y-3">
                  {orders.map(
                    (order) => (
                      <div
                        key={order.id}
                        className="overflow-hidden rounded-xl border border-gray-200"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedOrderId(
                              expandedOrderId ===
                                order.id
                                ? null
                                : order.id,
                            )
                          }
                          className="flex w-full items-center justify-between gap-4 p-4 text-left transition-colors hover:bg-gray-50"
                          aria-expanded={
                            expandedOrderId ===
                            order.id
                          }
                        >
                          <div>
                            <p className="font-semibold text-gray-800">
                              {
                                order.totalItems
                              }{" "}
                              item
                              {order.totalItems ===
                              1
                                ? ""
                                : "s"}
                            </p>

                            <p className="text-xs text-gray-500">
                              {order.createdAt
                                ?.toDate()
                                .toLocaleDateString(
                                  "en-PH",
                                ) ||
                                "Processing"}
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="font-semibold text-forest-700">
                                ₱
                                {order.totalAmount.toLocaleString(
                                  "en-PH",
                                )}
                              </p>

                              <p className="text-xs capitalize text-gray-500">
                                {
                                  order.status
                                }
                              </p>
                            </div>

                            <ChevronDown
                              size={18}
                              className={`text-gray-400 transition-transform ${
                                expandedOrderId ===
                                order.id
                                  ? "rotate-180"
                                  : ""
                              }`}
                            />
                          </div>
                        </button>

                        {expandedOrderId ===
                          order.id && (
                          <div className="border-t border-gray-100 bg-gray-50 p-4">
                            <div className="space-y-3">
                              {(
                                order.items || []
                              ).map(
                                (item) => {
                                  const product =
                                    getProductById(
                                      item.id,
                                    );

                                  if (
                                    !product
                                  ) {
                                    return null;
                                  }

                                  const productImage =
                                    getProductImage(
                                      product,
                                      item.color,
                                    );

                                  return (
                                    <div
                                      key={`${item.id}-${item.color}-${item.size || ""}-${item.hand || ""}`}
                                      className="flex gap-3 rounded-lg bg-white p-3"
                                    >
                                      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
                                        {productImage && (
                                          <Image
                                            src={
                                              productImage
                                            }
                                            alt={
                                              product.name
                                            }
                                            fill
                                            sizes="64px"
                                            className="object-cover"
                                          />
                                        )}
                                      </div>

                                      <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-gray-800">
                                          {
                                            product.name
                                          }
                                        </p>

                                        <p className="text-xs text-gray-500">
                                          {getColorDisplay(
                                            item.color,
                                          )}

                                          {item.size
                                            ? ` · Size ${item.size}`
                                            : ""}

                                          {item.hand
                                            ? ` · ${item.hand} hand`
                                            : ""}
                                        </p>

                                        <p className="mt-1 text-xs text-gray-600">
                                          Qty{" "}
                                          {
                                            item.quantity
                                          }{" "}
                                          × ₱
                                          {product.price.toLocaleString(
                                            "en-PH",
                                          )}
                                        </p>
                                      </div>

                                      <p className="text-sm font-semibold text-forest-700">
                                        ₱
                                        {(
                                          product.price *
                                          item.quantity
                                        ).toLocaleString(
                                          "en-PH",
                                        )}
                                      </p>
                                    </div>
                                  );
                                },
                              )}
                            </div>

                            {order.customer && (
                              <div className="mt-4 space-y-2 border-t border-gray-200 pt-4 text-xs text-gray-600">
                                {order
                                  .customer
                                  .phone && (
                                  <p className="flex items-center gap-2">
                                    <Phone
                                      size={
                                        14
                                      }
                                    />

                                    {
                                      order
                                        .customer
                                        .phone
                                    }
                                  </p>
                                )}

                                {order
                                  .customer
                                  .address && (
                                  <p className="flex items-start gap-2">
                                    <MapPin
                                      size={
                                        14
                                      }
                                      className="mt-0.5 flex-shrink-0"
                                    />

                                    {
                                      order
                                        .customer
                                        .address
                                    }
                                  </p>
                                )}
                              </div>
                            )}

                            {(order.trackingNumber ||
                              order.trackingNote) && (
                              <div className="mt-4 rounded-lg border border-forest-100 bg-white p-4 text-sm">
                                <p className="mb-1 font-semibold text-forest-800">
                                  Shipment
                                  tracking
                                </p>

                                {order.trackingNumber && (
                                  <p>
                                    <span className="text-gray-500">
                                      {order.carrier ||
                                        "Carrier"}
                                      :
                                    </span>{" "}
                                    <span className="font-medium">
                                      {
                                        order.trackingNumber
                                      }
                                    </span>
                                  </p>
                                )}

                                {order.trackingNote && (
                                  <p className="mt-2 text-xs text-gray-600">
                                    {
                                      order.trackingNote
                                    }
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">
                  No account orders yet.
                </p>
              )}
            </section>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}