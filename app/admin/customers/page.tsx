"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  Github,
  Apple,
  KeyRound,
  Loader2,
  Mail,
  Pencil,
  Phone,
  Plus,
  Power,
  RefreshCcw,
  Search,
  Send,
  Shield,
  ShieldCheck,
  ShieldMinus,
  Sparkles,
  Trash2,
  UserCheck,
  Users,
  UserX,
  Unlink,
  X,
} from "lucide-react";

import { firebaseAuth } from "@/lib/firebase";
import AdminSelect from "@/components/AdminSelect";
import AdminConfirmModal from "@/components/AdminConfirmModal";

type ProviderInfo = {
  providerId: string;
  label: string;
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
};

type Customer = {
  uid: string;
  displayName?: string | null;
  email?: string | null;
  emailVerified: boolean;
  photoURL?: string | null;
  phoneNumber?: string | null;

  disabled: boolean;
  isAdmin: boolean;

  customClaims: Record<string, unknown>;

  providers: ProviderInfo[];

  createdAt?: string | null;
  lastLoginAt?: string | null;
  tokensValidAfterTime?: string | null;
};

type ConfirmAction =
  | {
      type: "admin";
      customer: Customer;
      value: boolean;
    }
  | {
      type: "disabled";
      customer: Customer;
      value: boolean;
    }
  | {
      type: "revoke";
      customer: Customer;
    }
  | {
      type: "delete";
      customer: Customer;
    }
  | {
      type: "unlink";
      customer: Customer;
      provider: ProviderInfo;
    };

type CreatedAccount = {
  uid: string;
  email: string;
  displayName: string;
  resetLink: string;
};

type VerificationLinkState = {
  uid: string;
  email: string;
  displayName: string;
  verificationLink: string;
};

const ITEMS_PER_PAGE = 10;

function getCustomerName(
  customer: Customer,
) {
  if (customer.displayName?.trim()) {
    return customer.displayName;
  }

  if (customer.email) {
    return customer.email.split("@")[0];
  }

  return "Unnamed Customer";
}

function getInitials(
  customer: Customer,
) {
  const name =
    getCustomerName(customer);

  return name
    .split(" ")
    .map((part) =>
      part.charAt(0),
    )
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(
  value?: string | null,
) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-PH",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  ).format(date);
}

function formatDateTime(
  value?: string | null,
) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-PH",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    },
  ).format(date);
}

async function getAdminToken() {
  const user =
    firebaseAuth.currentUser;

  if (!user) {
    throw new Error(
      "Your administrator session has expired. Please sign in again.",
    );
  }

  return user.getIdToken();
}

function generateTemporaryPassword() {
  const uppercase =
    "ABCDEFGHJKLMNPQRSTUVWXYZ";

  const lowercase =
    "abcdefghijkmnopqrstuvwxyz";

  const numbers =
    "23456789";

  const symbols =
    "!@#$%&*?";

  const all =
    uppercase +
    lowercase +
    numbers +
    symbols;

  const randomCharacter = (
    source: string,
  ) => {
    const values =
      new Uint32Array(1);

    crypto.getRandomValues(values);

    return source[
      values[0] % source.length
    ];
  };

  const characters = [
    randomCharacter(uppercase),
    randomCharacter(lowercase),
    randomCharacter(numbers),
    randomCharacter(symbols),
  ];

  for (let index = 0; index < 12; index++) {
    characters.push(
      randomCharacter(all),
    );
  }

  /*
   * Secure shuffle.
   */
  for (
    let index =
      characters.length - 1;
    index > 0;
    index--
  ) {
    const values =
      new Uint32Array(1);

    crypto.getRandomValues(values);

    const target =
      values[0] % (index + 1);

    [
      characters[index],
      characters[target],
    ] = [
      characters[target],
      characters[index],
    ];
  }

  return characters.join("");
}

function GoogleProviderIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-3.5 w-3.5 shrink-0"
    >
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.52h3.24c1.9-1.75 2.98-4.33 2.98-7.37Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.97-.9 6.63-2.4l-3.24-2.52c-.9.6-2.05.97-3.39.97-2.61 0-4.82-1.76-5.61-4.13H3.04v2.6A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.39 13.92A6.02 6.02 0 0 1 6.08 12c0-.67.11-1.32.31-1.92v-2.6H3.04A10 10 0 0 0 2 12c0 1.61.39 3.14 1.04 4.52l3.35-2.6Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.95c1.47 0 2.79.5 3.83 1.5l2.87-2.87C16.97 2.97 14.7 2 12 2a10 10 0 0 0-8.96 5.48l3.35 2.6C7.18 7.71 9.39 5.95 12 5.95Z"
      />
    </svg>
  );
}

function MicrosoftProviderIcon() {
  return (
    <span
      aria-hidden="true"
      className="grid h-3.5 w-3.5 shrink-0 grid-cols-2 gap-[1px]"
    >
      <span className="bg-[#f25022]" />
      <span className="bg-[#7fba00]" />
      <span className="bg-[#00a4ef]" />
      <span className="bg-[#ffb900]" />
    </span>
  );
}

function ProviderIcon({
  providerId,
}: {
  providerId: string;
}) {
  const id = providerId.toLowerCase();

  if (id === "google.com") {
    return <GoogleProviderIcon />;
  }

  if (id === "github.com") {
    return <Github className="h-3.5 w-3.5 shrink-0" />;
  }

  if (id === "microsoft.com") {
    return <MicrosoftProviderIcon />;
  }

  if (id === "apple.com") {
    return <Apple className="h-3.5 w-3.5 shrink-0" />;
  }

  if (id === "password") {
    return <Mail className="h-3.5 w-3.5 shrink-0" />;
  }

  if (id === "phone") {
    return <Phone className="h-3.5 w-3.5 shrink-0" />;
  }

  return (
    <span
      aria-hidden="true"
      className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-forest-700 text-[7px] font-bold text-white"
    >
      {providerId.charAt(0).toUpperCase()}
    </span>
  );
}

function ProviderBadge({
  provider,
}: {
  provider: ProviderInfo;
}) {
  return (
    <span
      title={provider.providerId}
      className="inline-flex items-center gap-1.5 rounded-md border border-forest-100 bg-forest-50 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-forest-700"
    >
      <ProviderIcon providerId={provider.providerId} />
      <span>{provider.label}</span>
    </span>
  );
}

function CustomerSkeleton() {
  return (
    <>
      {Array.from({
        length: 6,
      }).map((_, index) => (
        <div
          key={index}
          className="grid animate-pulse grid-cols-[minmax(230px,1.4fr)_minmax(210px,1.4fr)_minmax(180px,1.2fr)_120px_140px_70px] items-center gap-4 border-b border-gray-100 px-5 py-4 last:border-b-0"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gray-100" />

            <div className="space-y-2">
              <div className="h-3 w-32 rounded bg-gray-100" />
              <div className="h-2.5 w-20 rounded bg-gray-100" />
            </div>
          </div>

          <div className="h-3 w-36 rounded bg-gray-100" />
          <div className="h-6 w-32 rounded bg-gray-100" />
          <div className="h-6 w-20 rounded bg-gray-100" />
          <div className="h-3 w-24 rounded bg-gray-100" />
          <div className="h-9 w-9 rounded bg-gray-100" />
        </div>
      ))}
    </>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-4 border-b border-gray-100 py-3.5 last:border-b-0">
      <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#69786f]">
        {label}
      </span>

      <span className="break-all text-right text-xs text-gray-700">
        {value}
      </span>
    </div>
  );
}

export default function AdminCustomersPage() {
  const [
    customers,
    setCustomers,
  ] = useState<Customer[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("all");

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  const [
    selectedCustomer,
    setSelectedCustomer,
  ] = useState<Customer | null>(
    null,
  );

  const [
    confirmAction,
    setConfirmAction,
  ] = useState<ConfirmAction | null>(
    null,
  );

  const [
    actionLoading,
    setActionLoading,
  ] = useState(false);

  /*
   * Create Customer modal.
   */
  const [
    showCreateCustomer,
    setShowCreateCustomer,
  ] = useState(false);

  const [
    createName,
    setCreateName,
  ] = useState("");

  const [
    createEmail,
    setCreateEmail,
  ] = useState("");

  const [
    createPassword,
    setCreatePassword,
  ] = useState("");

  const [
    showCreatePassword,
    setShowCreatePassword,
  ] = useState(false);

  const [
    creatingCustomer,
    setCreatingCustomer,
  ] = useState(false);

  const [
    createdAccount,
    setCreatedAccount,
  ] = useState<CreatedAccount | null>(
    null,
  );

  const [
    copiedResetLink,
    setCopiedResetLink,
  ] = useState(false);

  const [
    verificationLink,
    setVerificationLink,
  ] = useState<VerificationLinkState | null>(null);

  const [
    verificationLoading,
    setVerificationLoading,
  ] = useState(false);

  const [
    copiedVerificationLink,
    setCopiedVerificationLink,
  ] = useState(false);

  const [
    editingCustomer,
    setEditingCustomer,
  ] = useState<Customer | null>(null);

  const [
    editDisplayName,
    setEditDisplayName,
  ] = useState("");

  const [
    editPhoneNumber,
    setEditPhoneNumber,
  ] = useState("");

  const [
    profileSaving,
    setProfileSaving,
  ] = useState(false);

  const [
    passwordCustomer,
    setPasswordCustomer,
  ] = useState<Customer | null>(null);

  const [
    newPassword,
    setNewPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    showNewPassword,
    setShowNewPassword,
  ] = useState(false);

  const [
    passwordSaving,
    setPasswordSaving,
  ] = useState(false);

  const currentUserUid =
    firebaseAuth.currentUser?.uid ??
    null;

  const loadCustomers =
    useCallback(
      async (
        silent = false,
      ) => {
        try {
          if (silent) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          setError("");

          const token =
            await getAdminToken();

          const response =
            await fetch(
              "/api/admin/users",
              {
                method: "GET",

                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },

                cache: "no-store",
              },
            );

          const data =
            await response.json();

          if (!response.ok) {
            throw new Error(
              data.error ||
                "Unable to load users.",
            );
          }

          setCustomers(
            data.users ?? [],
          );
        } catch (loadError) {
          console.error(
            "Unable to load Firebase users:",
            loadError,
          );

          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load customers.",
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [],
    );

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    statusFilter,
  ]);

  const filteredCustomers =
    useMemo(() => {
      const value = search
        .trim()
        .toLowerCase();

      return customers.filter(
        (customer) => {
          const name =
            getCustomerName(
              customer,
            ).toLowerCase();

          const email =
            customer.email?.toLowerCase() ??
            "";

          const providers =
            customer.providers
              .map((provider) =>
                provider.label.toLowerCase(),
              )
              .join(" ");

          const matchesSearch =
            !value ||
            name.includes(value) ||
            email.includes(value) ||
            providers.includes(value);

          const matchesStatus =
            statusFilter === "all" ||
            (statusFilter ===
              "active" &&
              !customer.disabled) ||
            (statusFilter ===
              "disabled" &&
              customer.disabled) ||
            (statusFilter ===
              "admin" &&
              customer.isAdmin) ||
            (statusFilter ===
              "customer" &&
              !customer.isAdmin);

          return (
            matchesSearch &&
            matchesStatus
          );
        },
      );
    }, [
      customers,
      search,
      statusFilter,
    ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredCustomers.length /
        ITEMS_PER_PAGE,
    ),
  );

  const paginatedCustomers =
    filteredCustomers.slice(
      (currentPage - 1) *
        ITEMS_PER_PAGE,
      currentPage *
        ITEMS_PER_PAGE,
    );

  const stats = useMemo(
    () => ({
      total: customers.length,

      active:
        customers.filter(
          (customer) =>
            !customer.disabled,
        ).length,

      disabled:
        customers.filter(
          (customer) =>
            customer.disabled,
        ).length,

      admins:
        customers.filter(
          (customer) =>
            customer.isAdmin,
        ).length,
    }),
    [customers],
  );

  function openCreateCustomer() {
    setCreateName("");
    setCreateEmail("");
    setCreatePassword(
      generateTemporaryPassword(),
    );

    setCreatedAccount(null);
    setCopiedResetLink(false);
    setShowCreatePassword(false);

    setShowCreateCustomer(true);
  }

  function closeCreateCustomer() {
    if (creatingCustomer) {
      return;
    }

    setShowCreateCustomer(false);
    setCreatedAccount(null);
  }

  async function createCustomer() {
    try {
      setCreatingCustomer(true);
      setError("");
      setSuccess("");

      const token =
        await getAdminToken();

      const response =
        await fetch(
          "/api/admin/users",
          {
            method: "POST",

            headers: {
              Authorization:
                `Bearer ${token}`,

              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              displayName:
                createName.trim(),
              email:
                createEmail.trim(),
              password:
                createPassword,
            }),
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to create customer.",
        );
      }

      /*
       * The reset link is still useful even though
       * the modal now closes automatically. Try to
       * copy it to the clipboard before closing.
       */
      let resetLinkCopied = false;

      if (data.resetLink) {
        try {
          await navigator.clipboard.writeText(
            data.resetLink,
          );
          resetLinkCopied = true;
        } catch (copyError) {
          console.warn(
            "Customer created, but the reset link could not be copied automatically:",
            copyError,
          );
        }
      }

      /*
       * Close and reset the Create Customer modal
       * immediately after the server confirms success.
       */
      setShowCreateCustomer(false);
      setCreatedAccount(null);
      setCopiedResetLink(false);
      setShowCreatePassword(false);

      setCreateName("");
      setCreateEmail("");
      setCreatePassword("");

      setSuccess(
        resetLinkCopied
          ? "Customer account created. Password reset link copied to clipboard."
          : "Customer account created successfully.",
      );

      /*
       * Refresh the table in place. No browser refresh
       * should be required.
       */
      await loadCustomers(true);
    } catch (createError) {
      console.error(
        "Unable to create customer:",
        createError,
      );

      setError(
        createError instanceof Error
          ? createError.message
          : "Unable to create customer.",
      );
    } finally {
      setCreatingCustomer(false);
    }
  }

  async function copyResetLink() {
    if (!createdAccount) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        createdAccount.resetLink,
      );

      setCopiedResetLink(true);

      window.setTimeout(
        () =>
          setCopiedResetLink(false),
        2000,
      );
    } catch (copyError) {
      console.error(
        "Unable to copy link:",
        copyError,
      );

      setError(
        "Unable to copy the password reset link.",
      );
    }
  }

  async function generateVerificationLink(
    customer: Customer,
  ) {
    if (!customer.email) {
      setError(
        "This account does not have an email address to verify.",
      );
      return;
    }

    if (customer.emailVerified) {
      setSuccess(
        "This email address is already verified.",
      );
      return;
    }

    try {
      setVerificationLoading(true);
      setError("");
      setSuccess("");
      setCopiedVerificationLink(false);

      const token = await getAdminToken();

      const response = await fetch(
        `/api/admin/users/${customer.uid}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "generateVerificationLink",
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to generate the verification link.",
        );
      }

      setVerificationLink({
        uid: customer.uid,
        email: customer.email,
        displayName: getCustomerName(customer),
        verificationLink: data.verificationLink,
      });
    } catch (verificationError) {
      console.error(
        "Unable to generate verification link:",
        verificationError,
      );

      setError(
        verificationError instanceof Error
          ? verificationError.message
          : "Unable to generate the verification link.",
      );
    } finally {
      setVerificationLoading(false);
    }
  }

  async function copyVerificationLink() {
    if (!verificationLink) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        verificationLink.verificationLink,
      );

      setCopiedVerificationLink(true);

      window.setTimeout(
        () => setCopiedVerificationLink(false),
        2000,
      );
    } catch (copyError) {
      console.error(
        "Unable to copy verification link:",
        copyError,
      );

      setError(
        "Unable to copy the email verification link.",
      );
    }
  }


  function openEditCustomer(
    customer: Customer,
  ) {
    setEditingCustomer(customer);
    setEditDisplayName(
      customer.displayName ?? "",
    );
    setEditPhoneNumber(
      customer.phoneNumber ?? "",
    );
  }

  async function saveCustomerProfile() {
    if (!editingCustomer) {
      return;
    }

    try {
      setProfileSaving(true);
      setError("");
      setSuccess("");

      const token =
        await getAdminToken();

      const response = await fetch(
        `/api/admin/users/${editingCustomer.uid}`,
        {
          method: "PATCH",
          headers: {
            Authorization:
              `Bearer ${token}`,
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            action: "updateProfile",
            displayName:
              editDisplayName.trim(),
            phoneNumber:
              editPhoneNumber.trim(),
          }),
        },
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to update customer profile.",
        );
      }

      setEditingCustomer(null);

      setSelectedCustomer(
        (current) =>
          current &&
          current.uid ===
            editingCustomer.uid
            ? {
                ...current,
                displayName:
                  data.user.displayName,
                phoneNumber:
                  data.user.phoneNumber,
              }
            : current,
      );

      setSuccess(
        "Customer profile updated.",
      );

      await loadCustomers(true);
    } catch (profileError) {
      console.error(
        "Unable to update customer profile:",
        profileError,
      );

      setError(
        profileError instanceof Error
          ? profileError.message
          : "Unable to update customer profile.",
      );
    } finally {
      setProfileSaving(false);
    }
  }

  function openChangePassword(
    customer: Customer,
  ) {
    setPasswordCustomer(customer);
    setNewPassword("");
    setConfirmPassword("");
    setShowNewPassword(false);
  }

  async function saveCustomerPassword() {
    if (!passwordCustomer) {
      return;
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      setError(
        "The new passwords do not match.",
      );
      return;
    }

    try {
      setPasswordSaving(true);
      setError("");
      setSuccess("");

      const token =
        await getAdminToken();

      const response = await fetch(
        `/api/admin/users/${passwordCustomer.uid}`,
        {
          method: "PATCH",
          headers: {
            Authorization:
              `Bearer ${token}`,
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            action: "setPassword",
            password: newPassword,
          }),
        },
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to change password.",
        );
      }

      setPasswordCustomer(null);
      setNewPassword("");
      setConfirmPassword("");

      setSuccess(
        passwordCustomer.uid ===
          currentUserUid
          ? "Password changed. Your refresh sessions were revoked, so you may be asked to sign in again."
          : "Customer password changed and existing refresh sessions were revoked.",
      );
    } catch (passwordError) {
      console.error(
        "Unable to change password:",
        passwordError,
      );

      setError(
        passwordError instanceof Error
          ? passwordError.message
          : "Unable to change password.",
      );
    } finally {
      setPasswordSaving(false);
    }
  }

  const performAction = async () => {
    if (!confirmAction) {
      return;
    }

    /*
     * Capture the current action before clearing modal
     * state so the async flow never depends on state
     * that we intentionally set to null after success.
     */
    const action = confirmAction;
    const customer = action.customer;

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      const token =
        await getAdminToken();

      let response: Response;

      if (action.type === "delete") {
        response = await fetch(
          `/api/admin/users/${customer.uid}`,
          {
            method: "DELETE",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );
      } else {
        let body: Record<
          string,
          unknown
        >;

        if (action.type === "admin") {
          body = {
            action: "setAdmin",
            admin: action.value,
          };
        } else if (
          action.type === "disabled"
        ) {
          body = {
            action: "setDisabled",
            disabled: action.value,
          };
        } else if (
          action.type === "unlink"
        ) {
          body = {
            action: "unlinkProvider",
            providerId:
              action.provider.providerId,
          };
        } else {
          body = {
            action: "revokeSessions",
          };
        }

        response = await fetch(
          `/api/admin/users/${customer.uid}`,
          {
            method: "PATCH",

            headers: {
              Authorization:
                `Bearer ${token}`,

              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(body),
          },
        );
      }

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to perform admin action.",
        );
      }

      let message =
        "Account updated successfully.";

      if (action.type === "admin") {
        message = action.value
          ? "Administrator access granted."
          : "Administrator access removed.";
      }

      if (action.type === "disabled") {
        message = action.value
          ? "Account disabled."
          : "Account enabled.";
      }

      if (action.type === "revoke") {
        message =
          "User sessions revoked.";
      }

      if (action.type === "delete") {
        message =
          "Account deleted.";
      }

      if (action.type === "unlink") {
        message =
          `${action.provider.label} disconnected from the account.`;
      }

      /*
       * Close BOTH the confirmation modal and the
       * customer-details modal immediately on success.
       */
      setConfirmAction(null);
      setSelectedCustomer(null);

      setSuccess(message);

      /*
       * Refresh the customer list in place so the UI
       * immediately reflects promote/disable/delete.
       */
      await loadCustomers(true);
    } catch (actionError) {
      console.error(
        "Admin action failed:",
        actionError,
      );

      setError(
        actionError instanceof Error
          ? actionError.message
          : "Unable to perform admin action.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <main className="min-h-screen bg-[#f4f7f2] py-6 text-gray-700 sm:py-8">
        <div className="mx-auto w-full max-w-[1480px] px-5 lg:px-8">
          {/* Header */}
          <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.2em] text-gold-600">
                Administration
              </p>

              <h1 className="font-serif text-3xl text-forest-950">
                Customer Management
              </h1>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
                Manage Firebase Authentication
                accounts, connected providers,
                roles and account access.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <CalendarDays className="h-4 w-4 text-gold-600" />

                {new Intl.DateTimeFormat(
                  "en-PH",
                  {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  },
                ).format(new Date())}
              </div>

              <button
                type="button"
                onClick={() =>
                  void loadCustomers(
                    true,
                  )
                }
                disabled={refreshing}
                className="flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-600 shadow-sm transition hover:border-forest-200 hover:bg-forest-50 hover:text-forest-800 disabled:opacity-50"
              >
                <RefreshCcw
                  className={`h-3.5 w-3.5 ${
                    refreshing
                      ? "animate-spin"
                      : ""
                  }`}
                />

                Refresh
              </button>

              <button
                type="button"
                onClick={
                  openCreateCustomer
                }
                className="flex h-10 items-center gap-2 rounded-lg bg-forest-700 px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-white shadow-sm transition hover:bg-forest-800"
              >
                <Plus className="h-4 w-4" />
                Add Customer
              </button>
            </div>
          </header>

          {error && (
            <div className="mb-5 flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {error}
              </div>

              <button
                type="button"
                onClick={() =>
                  setError("")
                }
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {success && (
            <div className="mb-5 flex items-start justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <div className="flex items-center gap-3">
                <Check className="h-4 w-4 shrink-0" />
                {success}
              </div>

              <button
                type="button"
                onClick={() =>
                  setSuccess("")
                }
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Statistics */}
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Accounts"
              value={
                loading
                  ? "—"
                  : stats.total
              }
              icon={
                <Users size={17} />
              }
            />

            <StatCard
              title="Active Accounts"
              value={
                loading
                  ? "—"
                  : stats.active
              }
              icon={
                <UserCheck
                  size={17}
                />
              }
            />

            <StatCard
              title="Disabled"
              value={
                loading
                  ? "—"
                  : stats.disabled
              }
              icon={
                <UserX size={17} />
              }
            />

            <StatCard
              title="Administrators"
              value={
                loading
                  ? "—"
                  : stats.admins
              }
              icon={
                <ShieldCheck
                  size={17}
                />
              }
            />
          </div>

          {/* Customer table */}
          <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="relative w-full sm:max-w-xl">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value,
                    )
                  }
                  placeholder="Search name, email or provider..."
                  className="h-11 w-full rounded-lg border border-gray-200 bg-white pl-11 pr-4 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:border-forest-300 focus:ring-2 focus:ring-forest-100"
                />
              </div>

              <AdminSelect
                value={statusFilter}
                onChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
                ariaLabel="Filter customer accounts"
                className="w-full sm:w-[220px]"
                options={[
                  { value: "all", label: "All Accounts" },
                  { value: "active", label: "Active" },
                  { value: "disabled", label: "Disabled" },
                  { value: "admin", label: "Administrators" },
                  { value: "customer", label: "Customers" },
                ]}
              />
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[1100px]">
                <div className="grid grid-cols-[minmax(230px,1.4fr)_minmax(210px,1.4fr)_minmax(180px,1.2fr)_120px_140px_70px] gap-4 border-b border-gray-100 bg-gray-50 px-5 py-3">
                  <TableHeading>
                    Account
                  </TableHeading>

                  <TableHeading>
                    Email
                  </TableHeading>

                  <TableHeading>
                    Connected Providers
                  </TableHeading>

                  <TableHeading>
                    Status
                  </TableHeading>

                  <TableHeading>
                    Created
                  </TableHeading>

                  <TableHeading alignRight>
                    View
                  </TableHeading>
                </div>

                {loading ? (
                  <CustomerSkeleton />
                ) : paginatedCustomers.length ===
                  0 ? (
                  <div className="px-6 py-20 text-center">
                    <Users className="mx-auto mb-4 h-8 w-8 text-gray-400" />

                    <h3 className="font-serif text-xl text-forest-950">
                      No accounts found
                    </h3>

                    <p className="mt-2 text-sm text-gray-500">
                      Try changing the
                      search or account
                      filter.
                    </p>
                  </div>
                ) : (
                  paginatedCustomers.map(
                    (customer) => (
                      <div
                        key={
                          customer.uid
                        }
                        className="grid grid-cols-[minmax(230px,1.4fr)_minmax(210px,1.4fr)_minmax(180px,1.2fr)_120px_140px_70px] items-center gap-4 border-b border-gray-100 px-5 py-4 transition hover:bg-forest-50/60 last:border-b-0"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          {customer.photoURL ? (
                            <img
                              src={
                                customer.photoURL
                              }
                              alt={getCustomerName(
                                customer,
                              )}
                              className="h-10 w-10 shrink-0 rounded-full border border-gray-200 object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#3d4b41] bg-[#19251d] text-xs font-semibold text-gold-700">
                              {getInitials(
                                customer,
                              )}
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-medium text-forest-950">
                                {getCustomerName(
                                  customer,
                                )}
                              </p>

                              {customer.isAdmin && (
                                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-gold-700" />
                              )}
                            </div>

                            <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-gray-400">
                              {customer.isAdmin
                                ? "Administrator"
                                : "Customer"}
                            </p>
                          </div>
                        </div>

                        <div className="flex min-w-0 items-center gap-2">
                          <Mail className="h-3.5 w-3.5 shrink-0 text-gray-400" />

                          <span className="truncate text-xs text-gray-600">
                            {customer.email ??
                              "—"}
                          </span>

                          {customer.emailVerified ? (
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.1em] text-emerald-700">
                              <Check className="h-2.5 w-2.5" />
                              Verified
                            </span>
                          ) : (
                            <span className="inline-flex shrink-0 items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.1em] text-amber-700">
                              Unverified
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {customer.providers
                            .length >
                          0 ? (
                            customer.providers.map(
                              (
                                provider,
                                index,
                              ) => (
                                <ProviderBadge
                                  key={`${customer.uid}-${provider.providerId}-${index}`}
                                  provider={
                                    provider
                                  }
                                />
                              ),
                            )
                          ) : (
                            <span className="text-xs text-gray-400">
                              —
                            </span>
                          )}
                        </div>

                        <div>
                          {customer.disabled ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-red-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-current" />
                              Disabled
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-current" />
                              Active
                            </span>
                          )}
                        </div>

                        <span className="text-xs text-gray-500">
                          {formatDate(
                            customer.createdAt,
                          )}
                        </span>

                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedCustomer(
                                customer,
                              )
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:border-forest-200 hover:bg-forest-50 hover:text-forest-700"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ),
                  )
                )}
              </div>
            </div>

            {!loading &&
              filteredCustomers.length >
                0 && (
                <div className="flex flex-col gap-4 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-gray-500">
                    Showing{" "}
                    <span className="text-forest-800">
                      {(currentPage - 1) *
                        ITEMS_PER_PAGE +
                        1}
                    </span>{" "}
                    to{" "}
                    <span className="text-forest-800">
                      {Math.min(
                        currentPage *
                          ITEMS_PER_PAGE,
                        filteredCustomers.length,
                      )}
                    </span>{" "}
                    of{" "}
                    <span className="text-forest-800">
                      {
                        filteredCustomers.length
                      }
                    </span>
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      disabled={
                        currentPage === 1
                      }
                      onClick={() =>
                        setCurrentPage(
                          (page) =>
                            Math.max(
                              1,
                              page - 1,
                            ),
                        )
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:border-forest-200 hover:bg-forest-50 hover:text-forest-800 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    <span className="min-w-20 text-center text-xs text-gray-500">
                      {currentPage} /{" "}
                      {totalPages}
                    </span>

                    <button
                      disabled={
                        currentPage >=
                        totalPages
                      }
                      onClick={() =>
                        setCurrentPage(
                          (page) =>
                            Math.min(
                              totalPages,
                              page + 1,
                            ),
                        )
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:border-forest-200 hover:bg-forest-50 hover:text-forest-800 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
          </section>
        </div>
      </main>

      {/* CREATE CUSTOMER MODAL */}
      {showCreateCustomer && (
        <div
          className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/50 p-4"
          onClick={
            closeCreateCustomer
          }
        >
          <div
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="flex items-start justify-between border-b border-gray-100 px-6 py-6">
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-gold-600">
                  Account Provisioning
                </p>

                <h2 className="font-serif text-2xl text-forest-950">
                  Add Customer
                </h2>
              </div>

              <button
                type="button"
                disabled={
                  creatingCustomer
                }
                onClick={
                  closeCreateCustomer
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-gray-200 hover:text-gold-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {!createdAccount ? (
              <div className="p-6">
                <div className="mb-5 border border-gray-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-700">
                  This creates an
                  Email/Password Firebase
                  account. After creation,
                  send the customer the
                  generated password-reset
                  link so they can choose
                  their own password.
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                      Customer Name
                    </label>

                    <input
                      value={createName}
                      onChange={(event) =>
                        setCreateName(
                          event.target
                            .value,
                        )
                      }
                      placeholder="Juan Dela Cruz"
                      autoComplete="off"
                      className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm text-forest-950 outline-none placeholder:text-gray-400 focus:border-forest-300 focus:ring-2 focus:ring-forest-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                      Email Address
                    </label>

                    <input
                      type="email"
                      value={createEmail}
                      onChange={(event) =>
                        setCreateEmail(
                          event.target
                            .value,
                        )
                      }
                      placeholder="customer@email.com"
                      autoComplete="off"
                      className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm text-forest-950 outline-none placeholder:text-gray-400 focus:border-forest-300 focus:ring-2 focus:ring-forest-100"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <label className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                        Temporary Password
                      </label>

                      <button
                        type="button"
                        onClick={() =>
                          setCreatePassword(
                            generateTemporaryPassword(),
                          )
                        }
                        className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-gold-600 hover:text-gold-600"
                      >
                        <Sparkles className="h-3 w-3" />
                        Generate
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type={
                          showCreatePassword
                            ? "text"
                            : "password"
                        }
                        value={
                          createPassword
                        }
                        onChange={(
                          event,
                        ) =>
                          setCreatePassword(
                            event.target
                              .value,
                          )
                        }
                        autoComplete="new-password"
                        className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 pr-12 font-mono text-sm text-forest-950 outline-none focus:border-forest-300 focus:ring-2 focus:ring-forest-100"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowCreatePassword(
                            (value) =>
                              !value,
                          )
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gold-700"
                      >
                        {showCreatePassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    <p className="mt-2 text-[11px] leading-5 text-gray-500">
                      Minimum 12
                      characters with an
                      uppercase letter,
                      lowercase letter and
                      number.
                    </p>
                  </div>
                </div>

                <div className="mt-7 flex justify-end gap-3">
                  <button
                    type="button"
                    disabled={
                      creatingCustomer
                    }
                    onClick={
                      closeCreateCustomer
                    }
                    className="rounded-lg border border-gray-200 px-5 py-2.5 text-xs font-semibold text-gray-600 hover:border-gray-200"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={
                      creatingCustomer ||
                      !createName.trim() ||
                      !createEmail.trim() ||
                      !createPassword
                    }
                    onClick={() =>
                      void createCustomer()
                    }
                    className="flex min-w-36 items-center justify-center gap-2 rounded-lg bg-forest-700 px-5 py-2.5 text-xs font-bold text-white hover:bg-forest-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {creatingCustomer ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Create Account
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6">
                <div className="mb-6 flex h-12 w-12 items-center justify-center border border-[#31513b] bg-emerald-50 text-emerald-700">
                  <Check className="h-5 w-5" />
                </div>

                <h3 className="font-serif text-xl text-forest-950">
                  Account Created
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  The Firebase account
                  has been created. Send
                  the password reset link
                  below to the customer.
                </p>

                <div className="mt-6 border border-gray-200 bg-white p-4">
                  <DetailRow
                    label="Customer"
                    value={
                      createdAccount.displayName
                    }
                  />

                  <DetailRow
                    label="Email"
                    value={
                      createdAccount.email
                    }
                  />

                  <DetailRow
                    label="UID"
                    value={
                      createdAccount.uid
                    }
                  />
                </div>

                <div className="mt-5">
                  <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-600">
                    Password Reset Link
                  </label>

                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={
                        createdAccount.resetLink
                      }
                      className="h-11 min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-500 outline-none"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        void copyResetLink()
                      }
                      className="flex h-11 shrink-0 items-center gap-2 border border-gray-200 bg-amber-50 px-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-gold-700 hover:bg-amber-100"
                    >
                      {copiedResetLink ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>

                  <p className="mt-3 text-[11px] leading-5 text-gray-500">
                    Send this link
                    privately to the
                    customer. They can
                    use it to set their
                    own password.
                  </p>
                </div>

                <div className="mt-7 flex justify-end">
                  <button
                    type="button"
                    onClick={
                      closeCreateCustomer
                    }
                    className="bg-forest-700 px-6 py-2.5 text-xs font-bold text-white hover:bg-forest-800"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CUSTOMER DETAILS */}
      {selectedCustomer && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4"
          onClick={() =>
            setSelectedCustomer(null)
          }
        >
          <div
            className="max-h-[88vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-gray-100 bg-white shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="flex items-start justify-between border-b border-gray-100 border-t-4 border-t-gold-500 px-5 py-4 sm:px-6">
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-gold-600">
                  Account Details
                </p>

                <h2 className="font-serif text-2xl text-forest-950">
                  {getCustomerName(
                    selectedCustomer,
                  )}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedCustomer(
                    null,
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-gray-200 hover:text-gold-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-5 p-5 sm:p-6 md:grid-cols-[minmax(0,1.2fr)_minmax(300px,.8fr)]">
              <div className="flex items-center gap-4 md:col-span-2">
                {selectedCustomer.photoURL ? (
                  <img
                    src={
                      selectedCustomer.photoURL
                    }
                    alt={getCustomerName(
                      selectedCustomer,
                    )}
                    className="h-16 w-16 rounded-full border border-gray-200 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-gray-200 bg-forest-50 font-serif text-xl text-[#d8ae58]">
                    {getInitials(
                      selectedCustomer,
                    )}
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-base font-medium text-forest-950">
                      {getCustomerName(
                        selectedCustomer,
                      )}
                    </p>

                    {selectedCustomer.isAdmin && (
                      <ShieldCheck className="h-4 w-4 text-gold-700" />
                    )}
                  </div>

                  <p className="mt-1 text-sm text-[#7f8d84]">
                    {selectedCustomer.email ??
                      "No email"}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-forest-100 bg-forest-50/60 p-4 md:col-start-2 md:row-start-2">
                <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-gold-700">
                  Connected Providers
                </p>

                <div className="flex flex-wrap gap-2">
                  {selectedCustomer.providers
                    .length > 0 ? (
                    selectedCustomer.providers.map(
                      (
                        provider,
                        index,
                      ) => (
                        <div
                          key={`${provider.providerId}-${index}`}
                          className="flex items-center gap-2"
                        >
                          <ProviderBadge
                            provider={
                              provider
                            }
                          />

                          <button
                            type="button"
                            disabled={
                              selectedCustomer.providers.length <= 1
                            }
                            onClick={() =>
                              setConfirmAction({
                                type: "unlink",
                                customer:
                                  selectedCustomer,
                                provider,
                              })
                            }
                            className="inline-flex h-7 items-center gap-1.5 rounded-md border border-red-200 bg-white px-2.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <Unlink className="h-3 w-3" />
                            Disconnect
                          </button>
                        </div>
                      ),
                    )
                  ) : (
                    <span className="text-sm text-gray-500">
                      No connected
                      providers.
                    </span>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-gray-100 bg-white px-4 md:col-start-1 md:row-start-2 md:row-span-2">
                <DetailRow
                  label="UID"
                  value={
                    selectedCustomer.uid
                  }
                />

                <DetailRow
                  label="Email"
                  value={
                    selectedCustomer.email ??
                    "—"
                  }
                />

                <DetailRow
                  label="Verified"
                  value={
                    selectedCustomer.emailVerified
                      ? "Yes"
                      : "No"
                  }
                />

                <DetailRow
                  label="Phone"
                  value={
                    selectedCustomer.phoneNumber ??
                    "—"
                  }
                />

                <DetailRow
                  label="Role"
                  value={
                    selectedCustomer.isAdmin
                      ? "Administrator"
                      : "Customer"
                  }
                />

                <DetailRow
                  label="Status"
                  value={
                    selectedCustomer.disabled
                      ? "Disabled"
                      : "Active"
                  }
                />

                <DetailRow
                  label="Created"
                  value={formatDateTime(
                    selectedCustomer.createdAt,
                  )}
                />

                <DetailRow
                  label="Last Login"
                  value={formatDateTime(
                    selectedCustomer.lastLoginAt,
                  )}
                />
              </div>

              <div className="rounded-xl border border-forest-100 bg-[#fbf8f1] p-4 md:col-start-2 md:row-start-3">
                <div className="mb-4 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-gold-700" />

                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-700">
                    Administrative Actions
                  </p>
                </div>

                {selectedCustomer.uid ===
                  currentUserUid && (
                  <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                    This is your
                    currently signed-in
                    account. Dangerous
                    self-management
                    actions are protected
                    by the server.
                  </div>
                )}

                <div className="grid gap-2.5 sm:grid-cols-2">
                  <AdminButton
                    icon={
                      selectedCustomer.isAdmin ? (
                        <ShieldMinus
                          size={15}
                        />
                      ) : (
                        <ShieldCheck
                          size={15}
                        />
                      )
                    }
                    disabled={
                      selectedCustomer.uid ===
                        currentUserUid &&
                      selectedCustomer.isAdmin
                    }
                    onClick={() =>
                      setConfirmAction({
                        type: "admin",
                        customer:
                          selectedCustomer,
                        value:
                          !selectedCustomer.isAdmin,
                      })
                    }
                  >
                    {selectedCustomer.isAdmin
                      ? "Remove Admin"
                      : "Promote to Admin"}
                  </AdminButton>

                  <AdminButton
                    icon={
                      <Power
                        size={15}
                      />
                    }
                    disabled={
                      selectedCustomer.uid ===
                        currentUserUid &&
                      !selectedCustomer.disabled
                    }
                    onClick={() =>
                      setConfirmAction({
                        type: "disabled",
                        customer:
                          selectedCustomer,
                        value:
                          !selectedCustomer.disabled,
                      })
                    }
                  >
                    {selectedCustomer.disabled
                      ? "Enable Account"
                      : "Disable Account"}
                  </AdminButton>

                  <AdminButton
                    icon={
                      <Pencil size={15} />
                    }
                    onClick={() =>
                      openEditCustomer(
                        selectedCustomer,
                      )
                    }
                  >
                    Edit Name & Phone
                  </AdminButton>

                  {selectedCustomer.providers.some(
                    (provider) =>
                      provider.providerId ===
                      "password",
                  ) && (
                    <AdminButton
                      icon={
                        <KeyRound
                          size={15}
                        />
                      }
                      onClick={() =>
                        openChangePassword(
                          selectedCustomer,
                        )
                      }
                    >
                      Change Password
                    </AdminButton>
                  )}

                  {!selectedCustomer.emailVerified &&
                    selectedCustomer.email && (
                      <AdminButton
                        icon={
                          verificationLoading ? (
                            <Loader2
                              size={15}
                              className="animate-spin"
                            />
                          ) : (
                            <Send size={15} />
                          )
                        }
                        disabled={verificationLoading}
                        onClick={() =>
                          void generateVerificationLink(
                            selectedCustomer,
                          )
                        }
                      >
                        Generate Verification Link
                      </AdminButton>
                    )}

                  <AdminButton
                    icon={
                      <KeyRound
                        size={15}
                      />
                    }
                    disabled={
                      selectedCustomer.uid ===
                      currentUserUid
                    }
                    onClick={() =>
                      setConfirmAction({
                        type: "revoke",
                        customer:
                          selectedCustomer,
                      })
                    }
                  >
                    Revoke Sessions
                  </AdminButton>

                  <button
                    type="button"
                    disabled={
                      selectedCustomer.uid ===
                      currentUserUid
                    }
                    onClick={() =>
                      setConfirmAction({
                        type: "delete",
                        customer:
                          selectedCustomer,
                      })
                    }
                    className="flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    <Trash2
                      size={15}
                    />
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EMAIL VERIFICATION LINK */}
      {verificationLink && (
        <div
          className="fixed inset-0 z-[1250] flex items-center justify-center bg-black/50 p-4"
          onClick={() =>
            setVerificationLink(null)
          }
        >
          <div
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="flex items-start justify-between border-b border-gray-100 px-6 py-6">
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-gold-600">
                  Email Verification
                </p>

                <h2 className="font-serif text-2xl text-forest-950">
                  Verification Link Ready
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setVerificationLink(null)
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-gray-200 hover:text-gold-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-5 border border-gray-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-700">
                Send this Firebase verification link privately to the customer.
                After they open it and complete verification, click Refresh on
                the Customers page to update their Verified status.
              </div>

              <div className="mb-5 border border-gray-200 bg-white p-4">
                <DetailRow
                  label="Customer"
                  value={verificationLink.displayName}
                />
                <DetailRow
                  label="Email"
                  value={verificationLink.email}
                />
              </div>

              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-600">
                Verification Link
              </label>

              <div className="flex gap-2">
                <input
                  readOnly
                  value={verificationLink.verificationLink}
                  className="h-11 min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-500 outline-none"
                />

                <button
                  type="button"
                  onClick={() =>
                    void copyVerificationLink()
                  }
                  className="flex h-11 shrink-0 items-center gap-2 border border-gray-200 bg-amber-50 px-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-gold-700 hover:bg-amber-100"
                >
                  {copiedVerificationLink ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </>
                  )}
                </button>
              </div>

              <div className="mt-7 flex justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setVerificationLink(null)
                  }
                  className="bg-forest-700 px-6 py-2.5 text-xs font-bold text-white hover:bg-forest-800"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* EDIT CUSTOMER PROFILE */}
      {editingCustomer && (
        <div
          className="fixed inset-0 z-[1260] flex items-center justify-center bg-black/50 p-4"
          onClick={() => {
            if (!profileSaving) {
              setEditingCustomer(null);
            }
          }}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="flex items-start justify-between border-b border-gray-100 px-6 py-6">
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-gold-600">
                  Customer Profile
                </p>

                <h2 className="font-serif text-2xl text-forest-950">
                  Edit Customer
                </h2>
              </div>

              <button
                type="button"
                disabled={profileSaving}
                onClick={() =>
                  setEditingCustomer(null)
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-gray-200 hover:text-gold-600 disabled:opacity-40"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div>
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                  Display Name
                </label>

                <div className="relative">
                  <Pencil className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <input
                    value={editDisplayName}
                    onChange={(event) =>
                      setEditDisplayName(
                        event.target.value,
                      )
                    }
                    className="h-11 w-full rounded-lg border border-gray-200 bg-white pl-11 pr-4 text-sm text-forest-950 outline-none focus:border-forest-300 focus:ring-2 focus:ring-forest-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                  Phone Number
                </label>

                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <input
                    value={editPhoneNumber}
                    onChange={(event) =>
                      setEditPhoneNumber(
                        event.target.value,
                      )
                    }
                    placeholder="+639171234567"
                    className="h-11 w-full rounded-lg border border-gray-200 bg-white pl-11 pr-4 text-sm text-forest-950 outline-none placeholder:text-gray-400 focus:border-forest-300 focus:ring-2 focus:ring-forest-100"
                  />
                </div>

                <p className="mt-2 text-[11px] leading-5 text-gray-500">
                  Use international E.164 format, for example +639171234567. Leave blank to remove the phone number.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={profileSaving}
                  onClick={() =>
                    setEditingCustomer(null)
                  }
                  className="rounded-lg border border-gray-200 px-5 py-2.5 text-xs font-semibold text-gray-600 hover:border-gray-200 disabled:opacity-40"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={
                    profileSaving ||
                    !editDisplayName.trim()
                  }
                  onClick={() =>
                    void saveCustomerProfile()
                  }
                  className="rounded-lg border flex min-w-32 items-center justify-center gap-2 bg-forest-700 px-5 py-2.5 text-xs font-bold text-white hover:bg-forest-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {profileSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CHANGE CUSTOMER PASSWORD */}
      {passwordCustomer && (
        <div
          className="fixed inset-0 z-[1270] flex items-center justify-center bg-black/50 p-4"
          onClick={() => {
            if (!passwordSaving) {
              setPasswordCustomer(null);
            }
          }}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="flex items-start justify-between border-b border-gray-100 px-6 py-6">
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-gold-600">
                  Account Security
                </p>

                <h2 className="font-serif text-2xl text-forest-950">
                  Change Password
                </h2>
              </div>

              <button
                type="button"
                disabled={passwordSaving}
                onClick={() =>
                  setPasswordCustomer(null)
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-gray-200 hover:text-gold-600 disabled:opacity-40"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-5 border border-gray-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-700">
                This directly changes the Firebase Email/Password credential. Existing refresh sessions will be revoked after the change.
              </div>

              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                    New Password
                  </label>

                  <div className="relative">
                    <input
                      type={
                        showNewPassword
                          ? "text"
                          : "password"
                      }
                      value={newPassword}
                      onChange={(event) =>
                        setNewPassword(
                          event.target.value,
                        )
                      }
                      autoComplete="new-password"
                      className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 pr-12 font-mono text-sm text-forest-950 outline-none focus:border-forest-300 focus:ring-2 focus:ring-forest-100"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowNewPassword(
                          (value) => !value,
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gold-700"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                    Confirm Password
                  </label>

                  <input
                    type={
                      showNewPassword
                        ? "text"
                        : "password"
                    }
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(
                        event.target.value,
                      )
                    }
                    autoComplete="new-password"
                    className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 font-mono text-sm text-forest-950 outline-none focus:border-forest-300 focus:ring-2 focus:ring-forest-100"
                  />

                  <p className="mt-2 text-[11px] leading-5 text-gray-500">
                    Minimum 12 characters with uppercase, lowercase, and a number.
                  </p>
                </div>
              </div>

              <div className="mt-7 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={passwordSaving}
                  onClick={() =>
                    setPasswordCustomer(null)
                  }
                  className="rounded-lg border border-gray-200 px-5 py-2.5 text-xs font-semibold text-gray-600 hover:border-gray-200 disabled:opacity-40"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={
                    passwordSaving ||
                    newPassword.length < 12 ||
                    !confirmPassword
                  }
                  onClick={() =>
                    void saveCustomerPassword()
                  }
                  className="flex min-w-36 items-center justify-center gap-2 rounded-lg bg-forest-700 px-5 py-2.5 text-xs font-bold text-white hover:bg-forest-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {passwordSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating
                    </>
                  ) : (
                    "Change Password"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM ADMIN ACTION */}
      <AdminConfirmModal
        open={confirmAction !== null}
        title={
          confirmAction
            ? getConfirmTitle(confirmAction)
            : ""
        }
        description={
          confirmAction
            ? getConfirmMessage(confirmAction)
            : ""
        }
        confirmLabel={
          actionLoading
            ? "Working..."
            : confirmAction?.type === "delete"
              ? "Delete Account"
              : confirmAction?.type === "disabled" &&
                  confirmAction.value
                ? "Disable Account"
                : confirmAction?.type === "unlink"
                  ? "Disconnect"
                  : confirmAction?.type === "revoke"
                    ? "Revoke Sessions"
                    : "Confirm"
        }
        tone={
          confirmAction?.type === "delete" ||
          (confirmAction?.type === "disabled" &&
            confirmAction.value) ||
          confirmAction?.type === "unlink" ||
          confirmAction?.type === "revoke"
            ? "danger"
            : "success"
        }
        onConfirm={() => {
          if (!actionLoading) {
            void performAction();
          }
        }}
        onCancel={() => {
          if (!actionLoading) {
            setConfirmAction(null);
          }
        }}
      />
    </>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-forest-100 bg-gradient-to-br from-white to-forest-50 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">
          {title}
        </span>

        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-forest-100 text-forest-700">
          {icon}
        </div>
      </div>

      <p className="text-2xl font-bold text-forest-950">
        {value}
      </p>
    </div>
  );
}

function TableHeading({
  children,
  alignRight = false,
}: {
  children: React.ReactNode;
  alignRight?: boolean;
}) {
  return (
    <span
      className={`text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 ${
        alignRight
          ? "text-right"
          : ""
      }`}
    >
      {children}
    </span>
  );
}

function AdminButton({
  children,
  icon,
  onClick,
  disabled = false,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-xs font-semibold text-gray-700 transition hover:border-forest-200 hover:bg-forest-50 hover:text-forest-800 disabled:cursor-not-allowed disabled:opacity-35"
    >
      {icon}
      {children}
    </button>
  );
}

function getConfirmTitle(
  action: ConfirmAction,
) {
  switch (action.type) {
    case "admin":
      return action.value
        ? "Promote to administrator?"
        : "Remove administrator access?";

    case "disabled":
      return action.value
        ? "Disable this account?"
        : "Enable this account?";

    case "revoke":
      return "Revoke all sessions?";

    case "delete":
      return "Delete this account?";

    case "unlink":
      return `Disconnect ${action.provider.label}?`;
  }
}

function getConfirmMessage(
  action: ConfirmAction,
) {
  const name =
    action.customer.email ??
    getCustomerName(
      action.customer,
    );

  switch (action.type) {
    case "admin":
      return action.value
        ? `${name} will receive administrator privileges across protected Verde admin resources.`
        : `${name} will lose administrator privileges and their existing Firebase sessions will be revoked.`;

    case "disabled":
      return action.value
        ? `${name} will be prevented from signing in until the account is enabled again.`
        : `${name} will be allowed to sign in again.`;

    case "revoke":
      return `Firebase refresh tokens for ${name} will be revoked. The user will need to authenticate again.`;

    case "delete":
      return `${name} will be permanently removed from Firebase Authentication. Historical order records will be preserved.`;

    case "unlink":
      return `${action.provider.label} will be disconnected from ${name}. The user will no longer be able to sign in with that provider. Existing refresh sessions will be revoked.`;
  }
}