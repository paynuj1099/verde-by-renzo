"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  getIdTokenResult,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { upload } from "@imagekit/next";
import {
  Bell,
  Camera,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  KeyRound,
  Laptop,
  LogOut,
  MapPin,
  MoreVertical,
  ImageIcon,
  Package,
  Phone,
  RotateCcw,
  Save,
  ShieldCheck,
  Smartphone,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { firebaseAuth, firestore } from "@/lib/firebase";
import AdminPageSkeleton from "@/components/AdminPageSkeleton";
import AdminToast from "@/components/AdminToast";
import AdminConfirmModal from "@/components/AdminConfirmModal";
import AdminImageCropModal from "@/components/AdminImageCropModal";
import { DEVICE_ID_KEY } from "@/components/DevicePresence";
import type { CartItem } from "@/context/CartContext";
import {
  getColorDisplay,
  getProductById,
  getProductImage,
} from "@/lib/productUtils";

type AccountOrder = {
  id: string;
  totalAmount: number;
  totalItems: number;
  status: string;
  createdAt?: Timestamp;
  items?: CartItem[];
  customer?: { phone?: string; address?: string };
  trackingNumber?: string;
  carrier?: string;
  trackingNote?: string;
};

type ConnectedDevice = {
  id: string;
  label: string;
  browser: string;
  os: string;
  type: "mobile" | "desktop";
  online: boolean;
  lastSeen?: Timestamp;
};

function OrderAccordion({
  order,
  expanded,
  onToggle,
}: {
  order: AccountOrder;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 p-4 text-left transition hover:bg-gray-50"
        aria-expanded={expanded}
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-forest-900">
            Order #{order.id.slice(0, 8).toUpperCase()}
          </p>
          <p className="text-xs text-gray-500">
            {order.createdAt?.toDate().toLocaleDateString("en-PH") ||
              "Processing"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-bold text-forest-800">
              ₱{Number(order.totalAmount || 0).toLocaleString("en-PH")}
            </p>
            <p className="text-xs capitalize text-gray-500">
              {order.status || "pre-order"}
            </p>
          </div>
          <ChevronDown
            size={18}
            className={`text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 p-4">
          <div className="space-y-3">
            {(order.items || []).map((item) => {
              const product = getProductById(item.id);
              if (!product) return null;
              const productImage = getProductImage(product, item.color);
              return (
                <div
                  key={`${item.id}-${item.color}-${item.size || ""}-${item.hand || ""}`}
                  className="flex gap-3 rounded-lg bg-white p-3"
                >
                  <div className="relative h-16 w-16 flex-none overflow-hidden rounded-md bg-gray-100">
                    {productImage && (
                      <Image
                        src={productImage}
                        alt={product.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-800">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {getColorDisplay(item.color)}
                      {item.size ? ` · Size ${item.size}` : ""}
                      {item.hand ? ` · ${item.hand} hand` : ""}
                    </p>
                    <p className="mt-1 text-xs text-gray-600">
                      Qty {item.quantity} × ₱
                      {product.price.toLocaleString("en-PH")}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-forest-700">
                    ₱{(product.price * item.quantity).toLocaleString("en-PH")}
                  </p>
                </div>
              );
            })}
          </div>
          {order.customer && (
            <div className="mt-4 space-y-2 border-t border-gray-200 pt-4 text-xs text-gray-600">
              {order.customer.phone && (
                <p className="flex items-center gap-2">
                  <Phone size={14} /> {order.customer.phone}
                </p>
              )}
              {order.customer.address && (
                <p className="flex items-start gap-2">
                  <MapPin size={14} className="mt-0.5 flex-none" />
                  {order.customer.address}
                </p>
              )}
            </div>
          )}
          {(order.trackingNumber || order.trackingNote) && (
            <div className="mt-4 rounded-lg border border-forest-100 bg-white p-4 text-sm">
              <p className="mb-1 font-semibold text-forest-800">
                Shipment tracking
              </p>
              {order.trackingNumber && (
                <p>
                  <span className="text-gray-500">
                    {order.carrier || "Carrier"}:
                  </span>{" "}
                  <span className="font-medium">{order.trackingNumber}</span>
                </p>
              )}
              {order.trackingNote && (
                <p className="mt-2 text-xs text-gray-600">
                  {order.trackingNote}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminSettingsPage() {
  const { user, loading, logout } = useAuth();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [photoFileId, setPhotoFileId] = useState("");
  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);
  const [pendingPhotoPreview, setPendingPhotoPreview] = useState("");
  const [cropSourceFile, setCropSourceFile] = useState<File | null>(null);
  const [cropSourcePreview, setCropSourcePreview] = useState("");
  const [confirmSave, setConfirmSave] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [confirmResetPhoto, setConfirmResetPhoto] = useState(false);
  const [coverPhotoURL, setCoverPhotoURL] = useState("");
  const [coverPhotoFileId, setCoverPhotoFileId] = useState("");
  const [pendingCover, setPendingCover] = useState<File | null>(null);
  const [pendingCoverPreview, setPendingCoverPreview] = useState("");
  const [coverPositionX, setCoverPositionX] = useState(50);
  const [coverPositionY, setCoverPositionY] = useState(50);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const coverDragRef = useRef<{
    startX: number;
    startY: number;
    positionX: number;
    positionY: number;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [newOrderAlerts, setNewOrderAlerts] = useState(true);
  const [statusAlerts, setStatusAlerts] = useState(true);
  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [orderPage, setOrderPage] = useState(1);
  const [totalSpent, setTotalSpent] = useState(0);
  const [completedOrders, setCompletedOrders] = useState(0);
  const [connectedDevices, setConnectedDevices] = useState<ConnectedDevice[]>(
    [],
  );
  const [presenceNow, setPresenceNow] = useState(Date.now());

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setAllowed(false);
      return;
    }
    setDisplayName(user.displayName || "");
    setPhotoURL(user.photoURL || "");
    getDoc(doc(firestore, "users", user.uid))
      .then((snapshot) => {
        const data = snapshot.data();
        setPhone(String(data?.phone || ""));
        setPhotoFileId(String(data?.photoFileId || ""));
        setCoverPhotoURL(String(data?.coverPhotoURL || ""));
        setCoverPhotoFileId(String(data?.coverPhotoFileId || ""));
        setCoverPositionX(Number(data?.coverPositionX ?? 50));
        setCoverPositionY(Number(data?.coverPositionY ?? 50));
      })
      .catch(() => setPhotoFileId(""));
    getIdTokenResult(user, true)
      .then((token) => setAllowed(token.claims.admin === true))
      .catch(() => setAllowed(false));
  }, [loading, user]);

  useEffect(
    () => () => {
      if (pendingPhotoPreview) URL.revokeObjectURL(pendingPhotoPreview);
      if (pendingCoverPreview) URL.revokeObjectURL(pendingCoverPreview);
      if (cropSourcePreview) URL.revokeObjectURL(cropSourcePreview);
    },
    [cropSourcePreview, pendingCoverPreview, pendingPhotoPreview],
  );

  useEffect(() => {
    if (!user) return;
    const ordersCollection = collection(firestore, "users", user.uid, "orders");
    Promise.all([
      getDocs(query(ordersCollection, orderBy("createdAt", "desc"), limit(10))),
      getDocs(ordersCollection),
    ])
      .then(([recentSnapshot, allSnapshot]) => {
        setOrders(
          recentSnapshot.docs.map(
            (item) => ({ id: item.id, ...item.data() }) as AccountOrder,
          ),
        );
        const allOrders = allSnapshot.docs.map(
          (item) => ({ id: item.id, ...item.data() }) as AccountOrder,
        );
        setTotalSpent(
          allOrders
            .filter((order) => order.status === "delivered")
            .reduce(
              (total, order) => total + Number(order.totalAmount || 0),
              0,
            ),
        );
        setCompletedOrders(
          allOrders.filter((order) => order.status === "delivered").length,
        );
      })
      .catch((error) => console.error("Unable to load order history:", error));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const stop = onSnapshot(
      collection(firestore, "users", user.uid, "devices"),
      (snapshot) =>
        setConnectedDevices(
          snapshot.docs
            .map((item) => ({ id: item.id, ...item.data() }) as ConnectedDevice)
            .sort(
              (a, b) =>
                (b.lastSeen?.toMillis() || 0) - (a.lastSeen?.toMillis() || 0),
            ),
        ),
      (error) => console.error("Unable to load connected devices:", error),
    );
    const timer = window.setInterval(() => setPresenceNow(Date.now()), 30_000);
    return () => {
      stop();
      window.clearInterval(timer);
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(
      doc(firestore, "users", user.uid, "settings", "notifications"),
      (snapshot) => {
        const preferences = snapshot.data();
        setNewOrderAlerts(preferences?.newOrderAlerts !== false);
        setStatusAlerts(preferences?.statusAlerts !== false);
      },
      (error) =>
        console.error("Unable to load notification preferences:", error),
    );
  }, [user]);

  const saveNotificationPreferences = async (
    nextNewOrderAlerts: boolean,
    nextStatusAlerts: boolean,
  ) => {
    if (!user) return;
    setNewOrderAlerts(nextNewOrderAlerts);
    setStatusAlerts(nextStatusAlerts);
    try {
      await setDoc(
        doc(firestore, "users", user.uid, "settings", "notifications"),
        {
        newOrderAlerts: nextNewOrderAlerts,
        statusAlerts: nextStatusAlerts,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      setMessage("Notification preferences saved on all devices.");
    } catch (error) {
      console.error("Unable to save notification preferences:", error);
      setMessage("Unable to save notification preferences.");
    }
  };

  const requestProfileSave = (event: FormEvent) => {
    event.preventDefault();
    if (!user || !displayName.trim()) return;
    setConfirmSave(true);
  };

  const saveProfile = async () => {
    setConfirmSave(false);
    if (!user || !displayName.trim()) return;
    setSaving(true);
    let uploadedFileId = "";
    try {
      let nextPhotoURL = photoURL.trim();
      let nextPhotoFileId = photoFileId;

      if (pendingPhoto) {
        const token = await user.getIdToken();
        const response = await fetch("/api/imagekit-auth", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const auth = await response.json();
        if (!response.ok)
          throw new Error(auth.error || "Upload authorization failed.");
        const result = await upload({
          file: pendingPhoto,
          fileName: `admin-profile-${user.uid}-${pendingPhoto.name}`.replace(
            /[^a-zA-Z0-9._-]/g,
            "-",
          ),
          folder: "/verdebyrenzo/profiles",
          useUniqueFileName: true,
          token: auth.token,
          signature: auth.signature,
          expire: auth.expire,
          publicKey: auth.publicKey,
        });
        if (!result.url || !result.fileId)
          throw new Error("ImageKit did not return complete file details.");
        nextPhotoURL = result.url;
        nextPhotoFileId = result.fileId;
        uploadedFileId = result.fileId;
      } else if (nextPhotoURL !== (user.photoURL || "")) {
        nextPhotoFileId = "";
      }

      await updateProfile(user, {
        displayName: displayName.trim(),
        photoURL: nextPhotoURL || null,
      });
      await setDoc(
        doc(firestore, "users", user.uid),
        {
          displayName: displayName.trim(),
          phone: phone.trim(),
          photoURL: nextPhotoURL || null,
          photoFileId: nextPhotoFileId || null,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      if (photoFileId && photoFileId !== nextPhotoFileId) {
        const token = await user.getIdToken();
        const cleanupResponse = await fetch("/api/imagekit-files", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ fileIds: [photoFileId] }),
        });
        if (!cleanupResponse.ok)
          console.error("The previous profile photo could not be removed.");
      }

      if (pendingPhotoPreview) URL.revokeObjectURL(pendingPhotoPreview);
      setPhotoURL(nextPhotoURL);
      setPhotoFileId(nextPhotoFileId);
      setPendingPhoto(null);
      setPendingPhotoPreview("");
      const coverSaved = pendingCover ? await uploadCoverPhoto() : true;
      setMessage(
        coverSaved
          ? "Administrator settings updated."
          : "Profile updated, but the cover photo could not be uploaded.",
      );
    } catch (error) {
      console.error(error);
      if (uploadedFileId) {
        const token = await user.getIdToken();
        await fetch("/api/imagekit-files", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ fileIds: [uploadedFileId] }),
        }).catch(() => undefined);
      }
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to update the administrator profile.",
      );
    } finally {
      setSaving(false);
    }
  };

  const resetProfilePhoto = async () => {
    setConfirmResetPhoto(false);
    if (!user) return;
    setSaving(true);
    try {
      const googlePhotoURL =
        user.providerData.find(
          (provider) => provider.providerId === "google.com",
        )?.photoURL || "";
      await updateProfile(user, { photoURL: googlePhotoURL || null });
      await setDoc(
        doc(firestore, "users", user.uid),
        {
          photoURL: googlePhotoURL || null,
          photoFileId: null,
          coverPhotoURL: null,
          coverPhotoFileId: null,
          coverPositionX: 50,
          coverPositionY: 50,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      const imageKitFileIds = [photoFileId, coverPhotoFileId].filter(Boolean);
      if (imageKitFileIds.length) {
        const token = await user.getIdToken();
        const response = await fetch("/api/imagekit-files", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ fileIds: imageKitFileIds }),
        });
        if (!response.ok)
          console.error("The replaced profile images could not be removed.");
      }
      if (pendingPhotoPreview) URL.revokeObjectURL(pendingPhotoPreview);
      if (pendingCoverPreview) URL.revokeObjectURL(pendingCoverPreview);
      setPhotoURL(googlePhotoURL);
      setPhotoFileId("");
      setCoverPhotoURL("");
      setCoverPhotoFileId("");
      setCoverPositionX(50);
      setCoverPositionY(50);
      setPendingPhoto(null);
      setPendingPhotoPreview("");
      setPendingCover(null);
      setPendingCoverPreview("");
      setMessage(
        googlePhotoURL
          ? "Profile and cover reset. Your Google account photo was restored."
          : "Profile and cover reset to their default designs.",
      );
    } catch (error) {
      console.error(error);
      setMessage("Unable to reset the profile picture.");
    } finally {
      setSaving(false);
    }
  };

  const uploadCoverPhoto = async () => {
    if (!user || !pendingCover) return true;
    setSaving(true);
    let uploadedFileId = "";
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/imagekit-auth", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const auth = await response.json();
      if (!response.ok)
        throw new Error(auth.error || "Upload authorization failed.");
      const result = await upload({
        file: pendingCover,
        fileName: `admin-cover-${user.uid}-${pendingCover.name}`.replace(
          /[^a-zA-Z0-9._-]/g,
          "-",
        ),
        folder: "/verdebyrenzo/profiles",
        useUniqueFileName: true,
        token: auth.token,
        signature: auth.signature,
        expire: auth.expire,
        publicKey: auth.publicKey,
      });
      if (!result.url || !result.fileId)
        throw new Error("ImageKit did not return complete file details.");
      uploadedFileId = result.fileId;
      await setDoc(
        doc(firestore, "users", user.uid),
        {
          coverPhotoURL: result.url,
          coverPhotoFileId: result.fileId,
          coverPositionX,
          coverPositionY,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      if (coverPhotoFileId && coverPhotoFileId !== result.fileId) {
        const cleanupResponse = await fetch("/api/imagekit-files", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ fileIds: [coverPhotoFileId] }),
        });
        if (!cleanupResponse.ok)
          console.error("The previous cover photo could not be removed.");
      }
      if (pendingCoverPreview) URL.revokeObjectURL(pendingCoverPreview);
      setCoverPhotoURL(result.url);
      setCoverPhotoFileId(result.fileId);
      setPendingCover(null);
      setPendingCoverPreview("");
      return true;
    } catch (error) {
      console.error(error);
      if (uploadedFileId) {
        const token = await user.getIdToken();
        await fetch("/api/imagekit-files", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ fileIds: [uploadedFileId] }),
        }).catch(() => undefined);
      }
      return false;
    } finally {
      setSaving(false);
    }
  };

  const sendReset = async () => {
    if (!user?.email) return;
    setSaving(true);
    try {
      await sendPasswordResetEmail(firebaseAuth, user.email);
      setMessage(`Password reset email sent to ${user.email}.`);
    } catch (error) {
      console.error(error);
      setMessage("Unable to send the password reset email.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    window.location.assign("/");
  };

  if (loading || allowed === null)
    return <AdminPageSkeleton variant="catalog" />;
  if (!allowed)
    return (
      <main className="min-h-screen bg-[#f4f7f2] pt-32 text-center">
        <h1 className="font-serif text-2xl text-forest-800">
          Administrator access required
        </h1>
        <Link
          href="/login"
          className="mt-4 inline-block font-semibold text-forest-600 underline"
        >
          Sign in
        </Link>
      </main>
    );

  const orderPageSize = 5;
  const orderPageCount = Math.max(1, Math.ceil(orders.length / orderPageSize));
  const currentOrderPage = Math.min(orderPage, orderPageCount);
  const visibleOrders = orders.slice(
    (currentOrderPage - 1) * orderPageSize,
    currentOrderPage * orderPageSize,
  );
  const currentDeviceId =
    typeof window === "undefined"
      ? ""
      : window.localStorage.getItem(DEVICE_ID_KEY) || "";

  return (
    <main className="min-h-screen bg-[#f4f7f2] py-6 sm:py-8">
      <div className="mx-auto w-full max-w-[1480px] px-5 lg:px-8">
        <header className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-gold-600">
            Administration
          </p>
          <h1 className="font-serif text-3xl text-forest-900">Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your administrator profile and account security.
          </p>
        </header>

        <AdminToast
          message={message}
          onDismiss={() => setMessage("")}
          tone={message.startsWith("Unable") ? "error" : "success"}
        />
        <AdminConfirmModal
          open={confirmSave}
          title="Save profile changes?"
          description={
            pendingPhoto || pendingCover
              ? "Your staged profile or cover images will upload to ImageKit only after confirmation. Previous ImageKit files will be removed after the update succeeds."
              : "This will update your administrator profile details."
          }
          confirmLabel={
            pendingPhoto || pendingCover ? "Upload and save" : "Save changes"
          }
          tone="success"
          onConfirm={saveProfile}
          onCancel={() => setConfirmSave(false)}
        />
        <AdminConfirmModal
          open={confirmResetPhoto}
          title="Reset profile and cover?"
          description="Your avatar will return to the connected Google photo or default initials, and the original Verde cover design will be restored. Both tracked ImageKit files will be deleted after the reset succeeds."
          confirmLabel="Reset both"
          tone="danger"
          onConfirm={resetProfilePhoto}
          onCancel={() => setConfirmResetPhoto(false)}
        />
        <AdminImageCropModal
          file={cropSourceFile}
          previewUrl={cropSourcePreview}
          onCancel={() => {
            if (cropSourcePreview) URL.revokeObjectURL(cropSourcePreview);
            setCropSourceFile(null);
            setCropSourcePreview("");
          }}
          onConfirm={(croppedFile) => {
            if (cropSourcePreview) URL.revokeObjectURL(cropSourcePreview);
            if (pendingPhotoPreview) URL.revokeObjectURL(pendingPhotoPreview);
            setPendingPhoto(croppedFile);
            setPendingPhotoPreview(URL.createObjectURL(croppedFile));
            setCropSourceFile(null);
            setCropSourcePreview("");
          }}
        />

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(300px,.75fr)]">
          <div className="contents">
            <form
              onSubmit={requestProfileSave}
              className="overflow-hidden rounded-2xl border border-[#ddd7ca] bg-white shadow-sm lg:col-start-1 lg:row-start-1"
            >
              <div
                className={`relative h-36 overflow-hidden bg-[radial-gradient(circle_at_75%_20%,rgba(210,166,80,.3),transparent_28%),linear-gradient(135deg,#101c15,#294b32)] bg-cover bg-center sm:h-44 ${pendingCover ? "cursor-move touch-none" : ""}`}
                onPointerDown={(event) => {
                  if (!pendingCover) return;
                  event.currentTarget.setPointerCapture(event.pointerId);
                  coverDragRef.current = {
                    startX: event.clientX,
                    startY: event.clientY,
                    positionX: coverPositionX,
                    positionY: coverPositionY,
                  };
                }}
                onPointerMove={(event) => {
                  const drag = coverDragRef.current;
                  if (!drag || !pendingCover) return;
                  const rect = event.currentTarget.getBoundingClientRect();
                  setCoverPositionX(
                    Math.max(
                      0,
                      Math.min(
                        100,
                        drag.positionX -
                          ((event.clientX - drag.startX) / rect.width) * 100,
                      ),
                    ),
                  );
                  setCoverPositionY(
                    Math.max(
                      0,
                      Math.min(
                        100,
                        drag.positionY -
                          ((event.clientY - drag.startY) / rect.height) * 100,
                      ),
                    ),
                  );
                }}
                onPointerUp={() => {
                  coverDragRef.current = null;
                }}
              >
                {(pendingCoverPreview || coverPhotoURL) && (
                  <img
                    src={pendingCoverPreview || coverPhotoURL}
                    alt="Administrator cover"
                    className="absolute inset-0 h-full w-full object-cover"
                    style={{
                      objectPosition: `${coverPositionX}% ${coverPositionY}%`,
                    }}
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                )}
                <div className="absolute inset-0 opacity-10 [background-image:linear-gradient(120deg,transparent_45%,white_45%,white_46%,transparent_46%)] [background-size:28px_28px]" />
                <div className="absolute bottom-5 right-6 text-right text-white/80">
                  <p className="font-serif text-2xl">Verde by Renzo</p>
                  <p className="text-[9px] uppercase tracking-[.3em] text-gold-300">
                    Administration
                  </p>
                </div>
              </div>

              <div className="relative px-5 pb-7 sm:px-7">
                <div className="min-h-40 pb-7 pl-4 pt-32 sm:pl-48 sm:pt-5">
                  <div className="absolute -top-10 left-7 h-36 w-36 sm:left-9">
                    <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border-[5px] border-white bg-forest-100 text-4xl font-semibold text-forest-700 shadow-md">
                      {pendingPhotoPreview || photoURL ? (
                        <img
                          src={pendingPhotoPreview || photoURL}
                          alt="Administrator profile"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        (displayName || user?.email || "A")
                          .charAt(0)
                          .toUpperCase()
                      )}
                    </div>
                    <label
                      className={`absolute bottom-1 right-1 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-4 border-white bg-forest-700 text-white shadow-lg transition hover:bg-forest-800 ${saving ? "pointer-events-none opacity-50" : ""}`}
                      aria-label="Choose a new profile photo"
                      title="Edit profile photo"
                    >
                      <Camera size={17} />
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        disabled={saving}
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (!file) return;
                          if (cropSourcePreview)
                            URL.revokeObjectURL(cropSourcePreview);
                          setCropSourceFile(file);
                          setCropSourcePreview(URL.createObjectURL(file));
                          event.currentTarget.value = "";
                        }}
                      />
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProfileMenuOpen((open) => !open)}
                    className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-forest-800"
                    aria-label="Open profile options"
                    aria-expanded={profileMenuOpen}
                  >
                    <MoreVertical size={23} />
                  </button>
                  {profileMenuOpen && (
                    <div className="absolute right-5 top-14 z-30 w-56 rounded-xl border border-gray-100 bg-white p-2 shadow-xl">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          coverInputRef.current?.click();
                        }}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-forest-50"
                      >
                        <ImageIcon size={16} /> Upload cover photo
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          setConfirmResetPhoto(true);
                        }}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                      >
                        <RotateCcw size={16} /> Reset profile and cover
                      </button>
                    </div>
                  )}
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      if (pendingCoverPreview)
                        URL.revokeObjectURL(pendingCoverPreview);
                      setPendingCover(file);
                      setPendingCoverPreview(URL.createObjectURL(file));
                      setCoverPositionX(50);
                      setCoverPositionY(50);
                      event.currentTarget.value = "";
                    }}
                  />
                  <div className="min-w-0">
                    <h2 className="truncate font-serif text-2xl text-forest-950">
                      {displayName || "Administrator"}
                    </h2>
                    <p className="truncate text-sm text-gray-500">
                      {user?.email}
                    </p>
                    <span className="mt-2 inline-flex rounded-full bg-forest-50 px-3 py-1 text-[9px] font-semibold uppercase tracking-wider text-forest-700">
                      Administrator
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-6">
                  <div className="mb-5 flex items-center gap-3">
                    <UserRound size={20} className="text-gold-600" />
                    <div>
                      <h3 className="font-serif text-xl text-forest-900">
                        Account settings
                      </h3>
                      <p className="text-xs text-gray-500">
                        Update your admin identity and profile image.
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="block text-sm font-medium text-gray-700 sm:col-span-2">
                      Display name
                      <input
                        required
                        value={displayName}
                        onChange={(event) => setDisplayName(event.target.value)}
                        className="mt-1.5 w-full rounded-xl border px-4 py-3 font-normal outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-100"
                      />
                    </label>
                    <label className="block text-sm font-medium text-gray-700">
                      Email address
                      <input
                        readOnly
                        value={user?.email || ""}
                        className="mt-1.5 w-full cursor-not-allowed rounded-xl border bg-gray-50 px-4 py-3 font-normal text-gray-500"
                      />
                    </label>
                    <label className="block text-sm font-medium text-gray-700">
                      Phone number
                      <input
                        type="tel"
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        placeholder="+63 912 345 6789"
                        autoComplete="tel"
                        className="mt-1.5 w-full rounded-xl border px-4 py-3 font-normal outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-100"
                      />
                    </label>
                    <div className="sm:col-span-2">
                      {pendingPhoto && (
                        <div className="flex items-center justify-between gap-3 rounded-lg bg-gold-50 px-3 py-2 text-xs text-gold-800">
                          <span className="truncate">
                            {pendingPhoto.name} selected — not uploaded yet
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (pendingPhotoPreview)
                                URL.revokeObjectURL(pendingPhotoPreview);
                              setPendingPhoto(null);
                              setPendingPhotoPreview("");
                            }}
                            className="font-semibold text-red-600"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-7 flex justify-end border-t border-gray-100 pt-5">
                    <button
                      disabled={saving || !displayName.trim()}
                      className="flex items-center gap-2 rounded-xl bg-forest-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-forest-800 disabled:opacity-50"
                    >
                      <Save size={17} /> {saving ? "Saving..." : "Save changes"}
                    </button>
                  </div>
                </div>
              </div>
            </form>

            <section className="rounded-2xl border border-[#ddd7ca] bg-white p-5 shadow-sm sm:p-7 lg:col-span-2 lg:row-start-2">
              <div className="mb-5 flex items-center justify-between gap-4 border-b border-gray-100 pb-5">
                <div className="flex items-center gap-3">
                  <Package size={20} className="text-gold-600" />
                  <div>
                    <h2 className="font-serif text-xl text-forest-900">
                      Order history
                    </h2>
                    <p className="text-xs text-gray-500">
                      Orders placed using this account.
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-forest-50 px-3 py-1 text-xs font-semibold text-forest-700">
                  {orders.length} {orders.length === 1 ? "order" : "orders"}
                </span>
              </div>
              <div className="mb-5 grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-xl bg-[#f5f3ed] p-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-gold-700 shadow-sm">
                    <CircleDollarSign size={19} />
                  </span>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                      Total spent
                    </p>
                    <p className="font-serif text-xl text-forest-900">
                      ₱{totalSpent.toLocaleString("en-PH")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-[#f5f3ed] p-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-emerald-700 shadow-sm">
                    <CheckCircle2 size={19} />
                  </span>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                      Delivered orders
                    </p>
                    <p className="font-serif text-xl text-forest-900">
                      {completedOrders}
                    </p>
                  </div>
                </div>
              </div>
              {orders.length ? (
                <div className="space-y-3">
                  {visibleOrders.map((order) => (
                    <div key={order.id} className="space-y-3">
                      <OrderAccordion
                        order={order}
                        expanded={expandedOrderId === order.id}
                        onToggle={() =>
                          setExpandedOrderId(
                            expandedOrderId === order.id ? null : order.id,
                          )
                        }
                      />
                      <div className="hidden">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-forest-900">
                            Order #{order.id.slice(0, 8).toUpperCase()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {order.createdAt
                              ?.toDate()
                              .toLocaleDateString("en-PH", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }) || "Processing"}
                          </p>
                        </div>
                        <span className="w-fit rounded-full bg-[#f3ead8] px-3 py-1 text-xs font-semibold capitalize text-[#75551c]">
                          {order.status || "pre-order"}
                        </span>
                        <div className="sm:text-right">
                          <p className="text-sm font-bold text-forest-800">
                            ₱
                            {Number(order.totalAmount || 0).toLocaleString(
                              "en-PH",
                            )}
                          </p>
                          <p className="text-xs text-gray-500">
                            {order.totalItems || 0} items
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {orders.length > orderPageSize && (
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                      <p className="text-sm text-gray-500">
                        Page {currentOrderPage} of {orderPageCount}
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={currentOrderPage === 1}
                          onClick={() => {
                            setExpandedOrderId(null);
                            setOrderPage((page) => Math.max(1, page - 1));
                          }}
                          className="rounded-lg border px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Previous
                        </button>
                        {Array.from(
                          { length: orderPageCount },
                          (_, index) => index + 1,
                        ).map((page) => (
                          <button
                            key={page}
                            type="button"
                            onClick={() => {
                              setExpandedOrderId(null);
                              setOrderPage(page);
                            }}
                            aria-current={
                              page === currentOrderPage ? "page" : undefined
                            }
                            className={`h-10 min-w-10 rounded-lg border px-3 text-sm font-semibold ${page === currentOrderPage ? "border-forest-600 bg-forest-600 text-white" : "text-gray-700 hover:bg-gray-50"}`}
                          >
                            {page}
                          </button>
                        ))}
                        <button
                          type="button"
                          disabled={currentOrderPage === orderPageCount}
                          onClick={() => {
                            setExpandedOrderId(null);
                            setOrderPage((page) =>
                              Math.min(orderPageCount, page + 1),
                            );
                          }}
                          className="rounded-lg border px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl bg-[#f5f3ed] px-4 py-8 text-center">
                  <Package size={24} className="mx-auto mb-2 text-gray-400" />
                  <p className="text-sm font-semibold text-gray-700">
                    No orders yet
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Orders placed with this account will appear here.
                  </p>
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-5 lg:col-start-2 lg:row-start-1">
            <section className="rounded-2xl border border-[#ddd7ca] bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <Laptop size={20} className="text-gold-600" />
                <div>
                  <h2 className="font-serif text-lg text-forest-900">
                    Connected device
                  </h2>
                  <p className="text-xs text-gray-500">
                    Where you are currently signed in.
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {connectedDevices.length ? (
                  connectedDevices.slice(0, 5).map((device) => {
                    const isOnline =
                      device.online &&
                      presenceNow - (device.lastSeen?.toMillis() || 0) <
                        150_000;
                    const isCurrent = device.id === currentDeviceId;
                    return (
                      <div
                        key={device.id}
                        className="flex items-center gap-3 rounded-xl bg-[#f5f3ed] p-4"
                      >
                        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-forest-700 shadow-sm">
                          {device.type === "mobile" ? (
                            <Smartphone size={19} />
                          ) : (
                            <Laptop size={19} />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-forest-900">
                            {device.label ||
                              `${device.browser} on ${device.os}`}
                          </p>
                          <p className="truncate text-xs text-gray-500">
                            {isCurrent
                              ? "This device"
                              : isOnline
                                ? "Active now"
                                : device.lastSeen
                                  ? `Last active ${device.lastSeen.toDate().toLocaleString("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}`
                                  : "Previously connected"}
                          </p>
                        </div>
                        <span
                          className={`h-2.5 w-2.5 flex-none rounded-full ${isOnline ? "bg-emerald-500" : "bg-gray-300"}`}
                          title={isOnline ? "Online" : "Offline"}
                        />
                      </div>
                    );
                  })
                ) : (
                  <p className="rounded-xl bg-[#f5f3ed] px-4 py-6 text-center text-xs text-gray-500">
                    Registering this device...
                  </p>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-[#ddd7ca] bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <Bell size={20} className="text-gold-600" />
                <div>
                  <h2 className="font-serif text-lg text-forest-900">
                    Notification settings
                  </h2>
                  <p className="text-xs text-gray-500">
                    Choose the admin updates you receive.
                  </p>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {[
                  {
                    label: "New order notifications",
                    description: "Alert me when a new order arrives.",
                    checked: newOrderAlerts,
                    toggle: () =>
                      saveNotificationPreferences(
                        !newOrderAlerts,
                        statusAlerts,
                      ),
                  },
                  {
                    label: "Order status updates",
                    description: "Show updates when an order changes.",
                    checked: statusAlerts,
                    toggle: () =>
                      saveNotificationPreferences(
                        newOrderAlerts,
                        !statusAlerts,
                      ),
                  },
                ].map((preference) => (
                  <div
                    key={preference.label}
                    className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-800">
                        {preference.label}
                      </p>
                      <p className="text-xs leading-5 text-gray-500">
                        {preference.description}
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={preference.checked}
                      onClick={preference.toggle}
                      className={`relative h-6 w-11 flex-none rounded-full transition ${preference.checked ? "bg-forest-700" : "bg-gray-300"}`}
                    >
                      <span
                        className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${preference.checked ? "left-6" : "left-1"}`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-[#ddd7ca] bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <ShieldCheck size={20} className="text-gold-600" />
                <div>
                  <h2 className="font-serif text-lg text-forest-900">
                    Account security
                  </h2>
                  <p className="text-xs text-gray-500">
                    Reset your administrator password.
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={saving || !user?.email}
                onClick={sendReset}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-forest-200 px-4 py-3 text-sm font-semibold text-forest-700 transition hover:bg-forest-50 disabled:opacity-50"
              >
                <KeyRound size={17} /> Send password reset
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
              >
                <LogOut size={17} /> Sign out
              </button>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
