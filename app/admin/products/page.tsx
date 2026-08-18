"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { getIdTokenResult } from "firebase/auth";
import { upload } from "@imagekit/next";
import {
  AlertTriangle,
  Check,
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { firestore } from "@/lib/firebase";
import type { Product } from "@/data/products";
import {
  getColorClass,
  getColorDisplay,
  getColorStyle,
} from "@/lib/productUtils";
import AdminRowActions from "@/components/AdminRowActions";
import AdminPageSkeleton from "@/components/AdminPageSkeleton";
import AdminToast from "@/components/AdminToast";
import AdminConfirmModal from "@/components/AdminConfirmModal";
import AdminSelect from "@/components/AdminSelect";

type ProductRecord = Product & {
  docId: string;
  active?: boolean;
  newArrivalOrder?: number;
};
type ProductForm = {
  name: string;
  category: string;
  price: string;
  colors: string[];
  colorHexes: Record<string, string>;
  image: string;
  images: Record<string, string>;
  imageFileIds: Record<string, string>;
  description: string;
  longDescription: string;
  materials: string;
  features: string;
  care: string;
  includes: string;
  sizeGuideHref: string;
  isNew: boolean;
  isPopular: boolean;
  active: boolean;
};

const availableColors = [
  "forest",
  "black",
  "gold",
  "ivory",
  "navy",
  "cream",
  "khaki",
  "white",
  "burgundy",
  "green-gold",
];
const emptyForm: ProductForm = {
  name: "",
  category: "ACCESSORIES",
  price: "",
  colors: [],
  colorHexes: {},
  image: "",
  images: {},
  imageFileIds: {},
  description: "",
  longDescription: "",
  materials: "",
  features: "",
  care: "",
  includes: "",
  sizeGuideHref: "",
  isNew: true,
  isPopular: false,
  active: true,
};
const parseList = (value: string) =>
  value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

export default function ProductAdminPage() {
  const pathname = usePathname();
  const isNewArrivalsPage = pathname === "/admin/new-arrivals";
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProductRecord | null>(null);
  const [confirmSave, setConfirmSave] = useState(false);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [customColorName, setCustomColorName] = useState("");
  const [customColorHex, setCustomColorHex] = useState("#808080");
  const [uploadingColor, setUploadingColor] = useState<string | null>(null);
  const [uploadingArrivalDocId, setUploadingArrivalDocId] = useState<
    string | null
  >(null);
  const [arrivalPreview, setArrivalPreview] = useState<ProductRecord | null>(
    null,
  );
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [arrivalFilter, setArrivalFilter] = useState("ALL");
  const [catalogPage, setCatalogPage] = useState(1);
  const [newArrivalSearch, setNewArrivalSearch] = useState("");
  const [newArrivalCategory, setNewArrivalCategory] = useState("ALL");
  const [newArrivalStatus, setNewArrivalStatus] = useState("ALL");
  const [newArrivalPage, setNewArrivalPage] = useState(1);

  const loadProducts = async () => {
    const snapshot = await getDocs(collection(firestore, "products"));
    setProducts(
      snapshot.docs
        .map((item) => ({ ...item.data(), docId: item.id }) as ProductRecord)
        .sort((a, b) => b.id - a.id),
    );
  };

  useEffect(() => {
    if (!user) {
      setCheckingRole(false);
      return;
    }
    getIdTokenResult(user, true)
      .then((token) => {
        const allowed = token.claims.admin === true;
        setIsAdmin(allowed);
        setCheckingRole(false);
        if (allowed) loadProducts().catch(console.error);
      })
      .catch(() => setCheckingRole(false));
  }, [user]);

  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(() => setMessage(""), 3000);
    return () => window.clearTimeout(timeout);
  }, [message]);

  useEffect(() => {
    if (!formOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) cancelEdit();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [formOpen, saving]);

  const saveProduct = async (event: FormEvent) => {
    event.preventDefault();
    const colors = form.colors;
    if (!form.name || !form.price || !colors.length) return;
    const fallbackImage = form.image.trim();
    const missingImage = colors.some(
      (color) =>
        !(
          form.images[color]?.trim() ||
          fallbackImage ||
          form.imageFileIds[color]
        ),
    );
    if (missingImage) {
      setMessage(
        "Add an image for every selected color, or provide a fallback image.",
      );
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const images = Object.fromEntries(
        colors.map((color) => [
          color,
          form.images[color]?.trim() || fallbackImage,
        ]),
      );
      const nextImageFileIds = Object.fromEntries(
        colors
          .filter((color) => form.imageFileIds[color])
          .map((color) => [color, form.imageFileIds[color]]),
      );
      const previousProduct = editingDocId
        ? products.find((product) => product.docId === editingDocId)
        : null;
      const previousImageFileIds = previousProduct?.imageFileIds || {};
      const removedImageFileIds = Array.from(
        new Set(
          Object.values(previousImageFileIds)
            .filter(Boolean)
            .filter(
              (fileId) => !Object.values(nextImageFileIds).includes(fileId),
            ),
        ),
      );

      const productFields = {
        name: form.name.trim(),
        category: form.category.trim().toUpperCase(),
        price: Number(form.price),
        colors,
        colorHexes: Object.fromEntries(
          colors
            .filter((color) => form.colorHexes[color])
            .map((color) => [color, form.colorHexes[color]]),
        ),
        images,
        imageFileIds: nextImageFileIds,
        description: form.description.trim(),
        longDescription: form.longDescription.trim() || form.description.trim(),
        materials: parseList(form.materials),
        features: parseList(form.features),
        care: parseList(form.care),
        includes: parseList(form.includes),
        sizeGuideHref: form.sizeGuideHref.trim(),
        isNew: form.isNew,
        isPopular: form.isPopular,
        active: form.active,
        updatedAt: serverTimestamp(),
      };

      if (removedImageFileIds.length && user) {
        const idToken = await user.getIdToken();
        const response = await fetch("/api/imagekit-files", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ fileIds: removedImageFileIds }),
        });

        if (!response.ok) {
          const result = await response.json().catch(() => ({}));
          throw new Error(
            result.error ||
              "Unable to delete unselected color images from ImageKit.",
          );
        }
      }

      if (editingDocId) {
        await updateDoc(
          doc(firestore, "products", editingDocId),
          productFields,
        );
      } else {
        const nextArrivalOrder =
          products.filter((product) => product.isNew).length + 1;
        await addDoc(collection(firestore, "products"), {
          ...productFields,
          id: Date.now(),
          newArrivalOrder: form.isNew ? nextArrivalOrder : undefined,
          createdAt: serverTimestamp(),
        });
      }
      setForm(emptyForm);
      setEditingDocId(null);
      setFormOpen(false);
      await loadProducts();
      setCatalogPage(1);
      setMessage(
        editingDocId
          ? "Product updated successfully."
          : "Product added successfully.",
      );
    } catch (error) {
      console.error(error);
      setMessage(
        "Unable to save product. Confirm your admin role and Firestore rules.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAttempt = (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setConfirmSave(true);
  };

  const handleConfirmSave = async () => {
    setConfirmSave(false);
    const event = { preventDefault: () => undefined } as FormEvent;
    await saveProduct(event);
  };

  const editProduct = (product: ProductRecord) => {
    setEditingDocId(product.docId);
    setForm({
      name: product.name,
      category: product.category,
      price: String(product.price),
      colors: product.colors,
      colorHexes: product.colorHexes || {},
      image: Object.values(product.images)[0] || "",
      images: product.images || {},
      imageFileIds: product.imageFileIds || {},
      description: product.description,
      longDescription: product.longDescription || "",
      materials: (product.materials || []).join("\n"),
      features: (product.features || []).join("\n"),
      care: (product.care || []).join("\n"),
      includes: (product.includes || []).join("\n"),
      sizeGuideHref: product.sizeGuideHref || "",
      isNew: product.isNew === true,
      isPopular: product.isPopular === true,
      active: product.active !== false,
    });
    setMessage("");
    setFormOpen(true);
  };

  const cancelEdit = () => {
    setEditingDocId(null);
    setForm(emptyForm);
    setFormOpen(false);
  };

  const openAddProduct = () => {
    setEditingDocId(null);
    setForm(emptyForm);
    setMessage("");
    setFormOpen(true);
  };

  const uploadColorImage = async (color: string, file?: File) => {
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      setMessage("Please select an image file.");
      return;
    }
    setUploadingColor(color);
    setMessage("");
    try {
      const idToken = await user.getIdToken();
      const authResponse = await fetch("/api/imagekit-auth", {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const auth = await authResponse.json().catch(() => ({
        error: `Upload authorization failed on the server (${authResponse.status}).`,
      }));
      if (!authResponse.ok)
        throw new Error(auth.error || "Unable to authorize upload.");
      const result = await upload({
        file,
        fileName: `${form.name || "product"}-${color}-${file.name}`.replace(
          /[^a-zA-Z0-9._-]/g,
          "-",
        ),
        folder: `/verdebyrenzo/products/${
          (form.name || "unassigned")
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "") || "unassigned"
        }`,
        useUniqueFileName: true,
        token: auth.token,
        signature: auth.signature,
        expire: auth.expire,
        publicKey: auth.publicKey,
      });
      if (!result.url || !result.fileId)
        throw new Error("ImageKit did not return complete file details.");
      const uploadedUrl = result.url;
      const uploadedFileId = result.fileId;
      setForm((current) => ({
        ...current,
        images: { ...current.images, [color]: uploadedUrl },
        imageFileIds: { ...current.imageFileIds, [color]: uploadedFileId },
      }));
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to upload image to ImageKit.",
      );
    } finally {
      setUploadingColor(null);
    }
  };

  const updateNewArrival = async (
    product: ProductRecord,
    isNew: boolean,
    order?: number,
  ) => {
    setSaving(true);
    setMessage("");
    try {
      await updateDoc(doc(firestore, "products", product.docId), {
        isNew,
        newArrivalOrder: Number.isFinite(order)
          ? order
          : (product.newArrivalOrder ??
            products.filter(
              (item) => item.isNew && item.docId !== product.docId,
            ).length + 1),
        updatedAt: serverTimestamp(),
      });
      await loadProducts();
      setMessage("New Arrivals updated successfully.");
    } catch (error) {
      console.error(error);
      setMessage("Unable to update New Arrivals.");
    } finally {
      setSaving(false);
    }
  };

  const uploadNewArrivalImage = async (product: ProductRecord, file?: File) => {
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      setMessage("Please select an image file.");
      return;
    }
    setUploadingArrivalDocId(product.docId);
    setMessage("");
    try {
      const idToken = await user.getIdToken();
      const authResponse = await fetch("/api/imagekit-auth", {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const auth = await authResponse.json().catch(() => ({
        error: `Upload authorization failed on the server (${authResponse.status}).`,
      }));
      if (!authResponse.ok)
        throw new Error(auth.error || "Unable to authorize upload.");
      const productSlug =
        product.name
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") || "product";
      const result = await upload({
        file,
        fileName: `${productSlug}-new-arrival-${file.name}`.replace(
          /[^a-zA-Z0-9._-]/g,
          "-",
        ),
        folder: `/verdebyrenzo/products/${productSlug}`,
        useUniqueFileName: true,
        token: auth.token,
        signature: auth.signature,
        expire: auth.expire,
        publicKey: auth.publicKey,
      });
      if (!result.url || !result.fileId)
        throw new Error("ImageKit did not return complete file details.");
      await updateDoc(doc(firestore, "products", product.docId), {
        newArrivalImage: result.url,
        newArrivalFileId: result.fileId,
        updatedAt: serverTimestamp(),
      });
      const previousFileId = product.newArrivalFileId;
      const previousIsShared =
        previousFileId &&
        Object.values(product.imageFileIds || {}).includes(previousFileId);
      if (
        previousFileId &&
        previousFileId !== result.fileId &&
        !previousIsShared
      ) {
        await fetch("/api/imagekit-files", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ fileIds: [previousFileId] }),
        });
      }
      await loadProducts();
      setMessage("New Arrival image uploaded successfully.");
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to upload the New Arrival image.",
      );
    } finally {
      setUploadingArrivalDocId(null);
    }
  };

  const deleteProduct = (product: ProductRecord) => {
    setDeleteTarget(product);
  };

  const confirmDeleteProduct = async () => {
    if (!deleteTarget) return;
    const product = deleteTarget;
    setSaving(true);
    setMessage("");
    try {
      const fileIds = Array.from(
        new Set(
          [
            ...Object.values(product.imageFileIds || {}),
            product.newArrivalFileId || "",
          ].filter(Boolean),
        ),
      );
      if (fileIds.length) {
        const idToken = await user!.getIdToken();
        const response = await fetch("/api/imagekit-files", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ fileIds }),
        });
        if (!response.ok) {
          const result = await response.json();
          throw new Error(
            result.error || "Unable to delete product images from ImageKit.",
          );
        }
      }
      await deleteDoc(doc(firestore, "products", product.docId));
      if (editingDocId === product.docId) cancelEdit();
      await loadProducts();
      setDeleteTarget(null);
      setMessage(`${product.name} was deleted from the shop.`);
    } catch (error) {
      console.error(error);
      setMessage("Unable to delete the product.");
    } finally {
      setSaving(false);
    }
  };

  const categories = Array.from(
    new Set(products.map((product) => product.category)),
  ).sort();
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      `${product.name} ${product.category} ${product.description}`
        .toLowerCase()
        .includes(search.toLowerCase());
    const matchesCategory =
      categoryFilter === "ALL" || product.category === categoryFilter;
    const matchesArrival =
      arrivalFilter === "ALL" ||
      (arrivalFilter === "NEW"
        ? product.isNew === true
        : product.isNew !== true);
    return matchesSearch && matchesCategory && matchesArrival;
  });
  const catalogPageSize = 5;
  const catalogPageCount = Math.max(
    1,
    Math.ceil(filteredProducts.length / catalogPageSize),
  );
  const currentCatalogPage = Math.min(catalogPage, catalogPageCount);
  const paginatedCatalogProducts = filteredProducts.slice(
    (currentCatalogPage - 1) * catalogPageSize,
    currentCatalogPage * catalogPageSize,
  );
  const arrivalEditorProducts = [...products]
    .filter((product) => {
      const matchesSearch =
        `${product.name} ${product.category} ${product.description}`
          .toLowerCase()
          .includes(newArrivalSearch.toLowerCase());
      const matchesCategory =
        newArrivalCategory === "ALL" || product.category === newArrivalCategory;
      const matchesStatus =
        newArrivalStatus === "ALL" ||
        (newArrivalStatus === "SHOWN"
          ? product.isNew === true
          : product.isNew !== true);
      return matchesSearch && matchesCategory && matchesStatus;
    })
    .sort((a, b) => {
      if (a.isNew !== b.isNew) return a.isNew ? -1 : 1;
      const aOrder = a.newArrivalOrder ?? a.id;
      const bOrder = b.newArrivalOrder ?? b.id;
      return aOrder - bOrder;
    });
  const newArrivalPageSize = 8;
  const newArrivalPageCount = Math.max(
    1,
    Math.ceil(arrivalEditorProducts.length / newArrivalPageSize),
  );
  const currentNewArrivalPage = Math.min(newArrivalPage, newArrivalPageCount);
  const paginatedArrivalProducts = arrivalEditorProducts.slice(
    (currentNewArrivalPage - 1) * newArrivalPageSize,
    currentNewArrivalPage * newArrivalPageSize,
  );

  if (loading || checkingRole) return <AdminPageSkeleton variant="catalog" />;
  if (!user)
    return (
      <main className="min-h-screen bg-gray-50 pt-32 text-center">
        <p className="mb-4">Sign in to access product management.</p>
        <Link href="/login" className="font-semibold text-forest-600">
          Go to login
        </Link>
      </main>
    );
  if (!isAdmin)
    return (
      <main className="min-h-screen bg-gray-50 pt-32 text-center">
        <h1 className="font-serif text-2xl text-forest-800">
          Administrator access required
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-gray-600">
          Sign out and sign in again to refresh this account’s administrator
          access.
        </p>
      </main>
    );

  return (
    <main className="min-h-screen bg-[#f4f7f2] py-6 sm:py-8">
      <div className="mx-auto w-full max-w-[1480px] px-5 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div data-tour="products-header">
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-gold-600">
              Administration
            </p>
            <h1 className="font-serif text-3xl text-forest-800">
              {isNewArrivalsPage ? "New Arrivals" : "Product Management"}
            </h1>
            <p className="text-gray-500">
              {isNewArrivalsPage
                ? `${products.filter((product) => product.isNew).length} products selected for the homepage`
                : `${products.length} products in Firestore`}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              data-tour="add-product"
              type="button"
              onClick={openAddProduct}
              className={`items-center gap-2 rounded-lg bg-forest-600 px-5 py-3 font-semibold text-white ${isNewArrivalsPage ? "hidden" : "flex"}`}
            >
              <Plus size={18} />
              Add Product
            </button>
          </div>
        </div>
        <AdminToast
          message={message}
          onDismiss={() => setMessage("")}
          tone={
            message.includes("Unable") ||
            message.includes("failed") ||
            message.includes("error")
              ? "error"
              : "success"
          }
        />

        <AdminConfirmModal
          open={Boolean(deleteTarget)}
          title="Delete product?"
          description={`${deleteTarget?.name ?? "This product"} will be permanently removed from Firestore, the shop, and New Arrivals. This action cannot be undone.`}
          confirmLabel={saving ? "Deleting..." : "Delete Product"}
          tone="danger"
          onConfirm={confirmDeleteProduct}
          onCancel={() => setDeleteTarget(null)}
        />

        <AdminConfirmModal
          open={confirmSave}
          title="Save changes?"
          description="This will update the product in Firestore and keep the current colour selections and uploaded images in sync."
          confirmLabel={saving ? "Saving..." : "Save Changes"}
          tone="success"
          onConfirm={handleConfirmSave}
          onCancel={() => setConfirmSave(false)}
        />

        {formOpen && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-form-title"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !saving) cancelEdit();
            }}
          >
            <form
              onSubmit={handleSaveAttempt}
              className="max-h-[90vh] w-full max-w-3xl space-y-4 overflow-y-auto rounded-xl bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h2
                  id="product-form-title"
                  className="flex items-center gap-2 font-serif text-xl text-forest-800"
                >
                  {editingDocId ? <Pencil size={20} /> : <Plus size={20} />}
                  {editingDocId ? "Edit Product" : "Add Product"}
                </h2>
                <button
                  data-tour="product-edit-close"
                  type="button"
                  onClick={cancelEdit}
                  disabled={saving}
                  className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800 disabled:opacity-50"
                  aria-label="Close product form"
                >
                  <X size={20} />
                </button>
              </div>
              <div data-tour="product-edit-basics" className="space-y-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700">
                  Product name
                  <input
                    required
                    placeholder="Product name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="mt-1 w-full rounded-lg border p-3 font-normal"
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Category
                    <AdminSelect
                      value={form.category}
                      onChange={(value) => setForm({ ...form, category: value })}
                      ariaLabel="Product category"
                      className="mt-1 font-normal"
                      options={[
                        { value: "APPAREL", label: "Apparel" },
                        { value: "BAGS", label: "Bags" },
                        { value: "ACCESSORIES", label: "Accessories" },
                      ]}
                    />
                  </label>
                  <label className="block text-sm font-medium text-gray-700">
                    Price (PHP)
                    <input
                      required
                      min="0"
                      step="0.01"
                      type="number"
                      placeholder="0.00"
                      value={form.price}
                      onChange={(e) =>
                        setForm({ ...form, price: e.target.value })
                      }
                      className="mt-1 w-full rounded-lg border p-3 font-normal"
                    />
                  </label>
                </div>
              </div>
              <fieldset data-tour="product-edit-colors">
                <legend className="text-sm font-medium text-gray-700">
                  Available colors{" "}
                  <span className="font-normal text-gray-400">
                    (select all that apply)
                  </span>
                </legend>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {Array.from(
                    new Set([...availableColors, ...form.colors]),
                  ).map((color) => {
                    const selected = form.colors.includes(color);
                    return (
                      <button
                        key={color}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => {
                          setForm((current) => {
                            const nextSelected = current.colors.includes(color)
                              ? current.colors.filter((item) => item !== color)
                              : [...current.colors, color];

                            const nextImages = { ...current.images };
                            const nextFileIds = { ...current.imageFileIds };

                            if (!nextSelected.includes(color)) {
                              delete nextImages[color];
                              delete nextFileIds[color];
                            }

                            return {
                              ...current,
                              colors: nextSelected,
                              images: nextImages,
                              imageFileIds: nextFileIds,
                            };
                          });
                        }}
                        className={`flex items-center gap-2 rounded-lg border p-2 text-left text-xs transition ${selected ? "border-forest-600 bg-forest-50 font-semibold text-forest-800 ring-1 ring-forest-600" : "border-gray-200 text-gray-600 hover:border-gray-400"}`}
                      >
                        <span
                          className={`h-5 w-5 flex-shrink-0 rounded-full border border-black/15 ${getColorClass(color)}`}
                          style={getColorStyle(color, form.colorHexes)}
                        />
                        <span>{getColorDisplay(color)}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 flex flex-wrap items-end gap-2 rounded-lg bg-gray-50 p-3">
                  <label className="min-w-40 flex-1 text-xs font-medium text-gray-600">
                    New color name
                    <input
                      value={customColorName}
                      onChange={(e) => setCustomColorName(e.target.value)}
                      placeholder="e.g. Sage Green"
                      className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm font-normal"
                    />
                  </label>
                  <label className="text-xs font-medium text-gray-600">
                    Color
                    <input
                      type="color"
                      value={customColorHex}
                      onChange={(e) => setCustomColorHex(e.target.value)}
                      className="mt-1 block h-10 w-14 cursor-pointer rounded-lg border bg-white p-1"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const color = customColorName
                        .trim()
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/^-|-$/g, "");
                      if (!color) return;
                      setForm({
                        ...form,
                        colors: Array.from(new Set([...form.colors, color])),
                        colorHexes: {
                          ...form.colorHexes,
                          [color]: customColorHex,
                        },
                      });
                      setCustomColorName("");
                    }}
                    className="rounded-lg border border-forest-600 px-3 py-2 text-sm font-semibold text-forest-700 hover:bg-forest-50"
                  >
                    <Plus size={16} className="inline" /> Add Color
                  </button>
                </div>
                {form.colors.length === 0 && (
                  <p className="mt-1 text-xs text-red-600">
                    Select at least one color.
                  </p>
                )}
              </fieldset>
              <label className="block text-sm font-medium text-gray-700">
                Fallback product image URL{" "}
                <span className="font-normal text-gray-400">
                  (optional when every color has an image)
                </span>
                <input
                  placeholder="Paste an existing image URL"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  className="mt-1 w-full rounded-lg border p-3 font-normal"
                />
              </label>
              {form.colors.length > 0 && (
                <fieldset data-tour="product-edit-images" className="rounded-lg border p-4">
                  <legend className="px-1 text-sm font-medium text-gray-700">
                    Images paired to colors
                  </legend>
                  <p className="mb-3 text-xs text-gray-500">
                    Add a different local image path or external URL for each
                    color. Leave one blank to use the fallback image.
                  </p>
                  <div className="space-y-3">
                    {form.colors.map((color) => {
                      const imagePath = form.images[color] || "";
                      const previewPath = imagePath || form.image;
                      return (
                        <div
                          key={`image-${color}`}
                          className="grid items-center gap-3 rounded-lg bg-gray-50 p-3 sm:grid-cols-[2.5rem_8rem_1fr]"
                        >
                          <span
                            className={`h-8 w-8 rounded-full border border-black/15 ${getColorClass(color)}`}
                            style={getColorStyle(color, form.colorHexes)}
                            title={getColorDisplay(color)}
                          />
                          <span className="text-sm font-semibold text-gray-700">
                            {getColorDisplay(color)}
                          </span>
                          <div
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.dataTransfer.dropEffect = "copy";
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              void uploadColorImage(
                                color,
                                e.dataTransfer.files?.[0],
                              );
                            }}
                            className="rounded-lg border border-dashed border-gray-300 p-2 transition hover:border-forest-500 hover:bg-forest-50/40"
                          >
                            <div className="flex flex-col gap-2 sm:flex-row">
                              <input
                                value={imagePath}
                                onChange={(e) => {
                                  const nextFileIds = { ...form.imageFileIds };
                                  delete nextFileIds[color];
                                  setForm({
                                    ...form,
                                    images: {
                                      ...form.images,
                                      [color]: e.target.value,
                                    },
                                    imageFileIds: nextFileIds,
                                  });
                                }}
                                placeholder={form.image || "Paste an image URL"}
                                className="min-w-0 flex-1 rounded-lg border bg-white px-3 py-2 text-sm font-normal"
                                aria-label={`${getColorDisplay(color)} image path or URL`}
                              />
                              <label
                                className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-forest-600 px-3 py-2 text-sm font-semibold text-forest-700 hover:bg-forest-50 ${uploadingColor ? "pointer-events-none opacity-50" : ""}`}
                              >
                                <Upload size={15} />
                                {uploadingColor === color
                                  ? "Uploading..."
                                  : "Choose file"}
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="sr-only"
                                  disabled={Boolean(uploadingColor)}
                                  onChange={(e) => {
                                    void uploadColorImage(
                                      color,
                                      e.target.files?.[0],
                                    );
                                    e.currentTarget.value = "";
                                  }}
                                />
                              </label>
                            </div>
                            <p className="mt-1 text-center text-[11px] text-gray-400">
                              Drop an image here, choose a file, or paste a URL.
                              Uploaded URLs fill automatically.
                            </p>
                            {previewPath && (
                              <div
                                className="mt-2 h-24 rounded-lg bg-white bg-contain bg-center bg-no-repeat"
                                style={{
                                  backgroundImage: `url("${previewPath.replace(/"/g, "%22")}")`,
                                }}
                                role="img"
                                aria-label={`${getColorDisplay(color)} product image preview`}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </fieldset>
              )}
              <label data-tour="product-edit-details" className="block text-sm font-medium text-gray-700">
                Short description
                <textarea
                  required
                  placeholder="Short summary shown in the catalog"
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border p-3 font-normal"
                />
              </label>
              <label data-tour="product-edit-full-description" className="block text-sm font-medium text-gray-700">
                Full description
                <textarea
                  placeholder="Detailed product description"
                  rows={4}
                  value={form.longDescription}
                  onChange={(e) =>
                    setForm({ ...form, longDescription: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border p-3 font-normal"
                />
              </label>
              <label data-tour="product-edit-materials" className="block text-sm font-medium text-gray-700">
                Materials
                <textarea
                  placeholder="One material per line"
                  rows={3}
                  value={form.materials}
                  onChange={(e) =>
                    setForm({ ...form, materials: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border p-3 font-normal"
                />
              </label>
              <label data-tour="product-edit-features" className="block text-sm font-medium text-gray-700">
                Features
                <textarea
                  placeholder="One feature per line"
                  rows={3}
                  value={form.features}
                  onChange={(e) =>
                    setForm({ ...form, features: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border p-3 font-normal"
                />
              </label>
              <label data-tour="product-edit-care" className="block text-sm font-medium text-gray-700">
                Care instructions
                <textarea
                  placeholder="One instruction per line"
                  rows={3}
                  value={form.care}
                  onChange={(e) => setForm({ ...form, care: e.target.value })}
                  className="mt-1 w-full rounded-lg border p-3 font-normal"
                />
              </label>
              <label data-tour="product-edit-includes" className="block text-sm font-medium text-gray-700">
                Package includes
                <textarea
                  placeholder="One included item per line"
                  rows={3}
                  value={form.includes}
                  onChange={(e) =>
                    setForm({ ...form, includes: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border p-3 font-normal"
                />
              </label>
              <label data-tour="product-edit-size-guide" className="block text-sm font-medium text-gray-700">
                Size guide link{" "}
                <span className="font-normal text-gray-400">(optional)</span>
                <input
                  placeholder="/size-guide"
                  value={form.sizeGuideHref}
                  onChange={(e) =>
                    setForm({ ...form, sizeGuideHref: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border p-3 font-normal"
                />
              </label>
              <div data-tour="product-edit-visibility" className="space-y-2 rounded-lg bg-gray-50 p-3">
                <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.isNew}
                    onChange={(e) =>
                      setForm({ ...form, isNew: e.target.checked })
                    }
                    className="h-4 w-4 rounded text-forest-600"
                  />
                  Include in New Arrivals
                </label>
                <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.isPopular}
                    onChange={(e) =>
                      setForm({ ...form, isPopular: e.target.checked })
                    }
                    className="h-4 w-4 rounded text-forest-600"
                  />
                  Mark as popular
                </label>
                <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) =>
                      setForm({ ...form, active: e.target.checked })
                    }
                    className="h-4 w-4 rounded text-forest-600"
                  />
                  Active and visible in Shop
                </label>
              </div>
              <div data-tour="product-edit-save" className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={saving}
                  className="rounded-lg border px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  disabled={saving}
                  className="rounded-lg bg-forest-600 px-6 py-3 font-semibold text-white disabled:bg-gray-400"
                >
                  {saving
                    ? "Saving..."
                    : editingDocId
                      ? "Save Changes"
                      : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        )}

        {arrivalPreview && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="arrival-preview-title"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setArrivalPreview(null);
            }}
          >
            <div data-tour="new-arrival-preview-modal" className="w-fit max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b px-5 py-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-gold-600">
                    New Arrivals Preview
                  </p>
                  <h2
                    id="arrival-preview-title"
                    className="font-serif text-xl text-forest-900"
                  >
                    {arrivalPreview.name}
                  </h2>
                </div>
                <button
                  data-tour="new-arrival-preview-close"
                  type="button"
                  onClick={() => setArrivalPreview(null)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border text-gray-500 transition hover:bg-gray-50 hover:text-gray-900"
                  aria-label="Close image preview"
                >
                  <X size={20} />
                </button>
              </div>
              <img
                src={
                  arrivalPreview.newArrivalImage ||
                  Object.values(arrivalPreview.images)[0] ||
                  ""
                }
                alt={`${arrivalPreview.name} New Arrivals preview`}
                className="block h-auto max-h-[75vh] w-auto max-w-full bg-[#f1eee7] object-contain"
              />
            </div>
          </div>
        )}

        <div className={isNewArrivalsPage ? "hidden" : "grid gap-8"}>
          <div className="rounded-2xl border bg-white p-6">
            <div className="mb-4 flex items-end justify-between">
              <h2 className="font-serif text-xl text-forest-800">
                Firestore Catalog
              </h2>
              <span className="text-xs text-gray-500">
                {paginatedCatalogProducts.length} of {filteredProducts.length}{" "}
                shown
              </span>
            </div>
            <div data-tour="product-filters" className="mb-4 space-y-3">
              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCatalogPage(1);
                  }}
                  placeholder="Search products..."
                  className="w-full rounded-lg border py-2.5 pl-10 pr-3 text-sm"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <AdminSelect
                  value={categoryFilter}
                  onChange={(value) => {
                    setCategoryFilter(value);
                    setCatalogPage(1);
                  }}
                  ariaLabel="Filter catalog by category"
                  options={[
                    { value: "ALL", label: "All categories" },
                    ...categories.map((category) => ({
                      value: category,
                      label: category,
                    })),
                  ]}
                />
                <AdminSelect
                  value={arrivalFilter}
                  onChange={(value) => {
                    setArrivalFilter(value);
                    setCatalogPage(1);
                  }}
                  ariaLabel="Filter catalog by arrival status"
                  options={[
                    { value: "ALL", label: "All products" },
                    { value: "NEW", label: "New arrivals" },
                    { value: "STANDARD", label: "Not new" },
                  ]}
                />
              </div>
            </div>
            <div data-tour="product-list" className="max-h-[560px] space-y-3 overflow-y-auto">
              {paginatedCatalogProducts.map((product, index) => {
                const image = Object.values(product.images)[0];
                return (
                  <div
                    key={product.docId}
                    className={`grid gap-3 rounded-lg p-3 sm:grid-cols-[4rem_minmax(0,1fr)_auto] sm:items-center ${editingDocId === product.docId ? "bg-forest-50 ring-1 ring-forest-300" : "bg-gray-50"}`}
                  >
                    <div
                      className="h-44 w-full rounded-md bg-gray-200 bg-cover bg-center sm:h-16 sm:w-16"
                      style={
                        image
                          ? {
                              backgroundImage: `url("${image.replace(/"/g, "%22")}")`,
                            }
                          : undefined
                      }
                      aria-label={image ? `${product.name} image` : "No image"}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-semibold text-gray-800">
                          {product.name}
                        </p>
                        {product.isNew && (
                          <span className="rounded-full bg-gold-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-gold-700">
                            New
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-gray-500">
                        {product.category} · {product.colors.join(", ")}
                      </p>
                      <p className="font-semibold text-forest-700">
                        ₱{product.price.toLocaleString("en-PH")}
                      </p>
                    </div>
                    <AdminRowActions
                      tourPrefix={index === 0 ? "product-action" : undefined}
                      previewHref={`/shop/${product.id}`}
                      itemName={`${product.name} product details`}
                      onEdit={() => editProduct(product)}
                      onDelete={() => deleteProduct(product)}
                      disabled={saving}
                    />
                  </div>
                );
              })}
              {!filteredProducts.length && (
                <p className="rounded-lg bg-gray-50 p-6 text-center text-sm text-gray-500">
                  No products match these filters.
                </p>
              )}
            </div>
            {filteredProducts.length > catalogPageSize && (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                <p className="text-sm text-gray-500">
                  Page {currentCatalogPage} of {catalogPageCount}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={currentCatalogPage === 1}
                    onClick={() =>
                      setCatalogPage((page) => Math.max(1, page - 1))
                    }
                    className="rounded-lg border px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>
                  {Array.from(
                    { length: catalogPageCount },
                    (_, index) => index + 1,
                  ).map((page) => (
                    <button
                      key={`catalog-page-${page}`}
                      type="button"
                      onClick={() => setCatalogPage(page)}
                      aria-current={
                        page === currentCatalogPage ? "page" : undefined
                      }
                      className={`h-10 min-w-10 rounded-lg border px-3 text-sm font-semibold ${page === currentCatalogPage ? "border-forest-600 bg-forest-600 text-white" : "text-gray-700 hover:bg-gray-50"}`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={currentCatalogPage === catalogPageCount}
                    onClick={() =>
                      setCatalogPage((page) =>
                        Math.min(catalogPageCount, page + 1),
                      )
                    }
                    className="rounded-lg border px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <section
          className={`${isNewArrivalsPage ? "rounded-3xl" : "hidden"} border border-[#ded8cc] bg-[#fffdf9] p-4 shadow-[0_16px_40px_rgba(26,39,30,.08)] sm:p-6`}
        >
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-serif text-2xl text-forest-800">
                Homepage Collection
              </h2>
              <p className="text-sm text-gray-500">
                Choose homepage products and set their display order. Hiding one
                here keeps it available in the shop.
              </p>
            </div>
            <span className="rounded-full border border-gold-200 bg-gold-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold-700">
              {products.filter((product) => product.isNew).length} selected
            </span>
          </div>
          <div data-tour="new-arrival-filters" className="mb-6 grid gap-3 rounded-2xl border border-[#e4ded3] bg-white p-3 lg:grid-cols-[minmax(260px,1.5fr)_minmax(180px,.75fr)_minmax(180px,.75fr)]">
            <div className="relative lg:self-start">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={newArrivalSearch}
                onChange={(e) => {
                  setNewArrivalSearch(e.target.value);
                  setNewArrivalPage(1);
                }}
                placeholder="Search New Arrivals products..."
                className="w-full rounded-lg border py-2.5 pl-10 pr-3 text-sm"
              />
            </div>
            <AdminSelect
              value={newArrivalCategory}
              onChange={(value) => {
                setNewArrivalCategory(value);
                setNewArrivalPage(1);
              }}
              ariaLabel="Filter New Arrivals by category"
              options={[
                { value: "ALL", label: "All categories" },
                ...categories.map((category) => ({
                  value: category,
                  label: category,
                })),
              ]}
            />
            <AdminSelect
              value={newArrivalStatus}
              onChange={(value) => {
                setNewArrivalStatus(value);
                setNewArrivalPage(1);
              }}
              ariaLabel="Filter by New Arrivals visibility"
              options={[
                { value: "ALL", label: "All products" },
                { value: "SHOWN", label: "Shown in New Arrivals" },
                { value: "HIDDEN", label: "Not in New Arrivals" },
              ]}
            />
            <p className="text-xs text-gray-500 lg:col-span-3">
              Showing {paginatedArrivalProducts.length} of{" "}
              {arrivalEditorProducts.length} matching products
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {paginatedArrivalProducts.map((product, index) => {
              const image = Object.values(product.images)[0];
              const displayImage = product.newArrivalImage || image;
              return (
                <div
                  key={`arrival-${product.docId}`}
                  data-tour={index === 0 ? "new-arrival-first-card" : undefined}
                  className={`overflow-hidden rounded-2xl border shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg ${product.isNew ? "border-gold-300 bg-[#fffaf0]" : "border-gray-200 bg-white"}`}
                >
                  <div
                    data-tour={index === 0 ? "new-arrival-image" : undefined}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "copy";
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (!uploadingArrivalDocId)
                        void uploadNewArrivalImage(
                          product,
                          e.dataTransfer.files?.[0],
                        );
                    }}
                    className="group relative aspect-[16/10] min-h-40 bg-gray-100 bg-cover bg-center"
                    style={
                      displayImage
                        ? {
                            backgroundImage: `url("${displayImage.replace(/"/g, "%22")}")`,
                          }
                        : undefined
                    }
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <label
                      className={`absolute bottom-3 right-3 inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-white/95 px-3 py-2 text-xs font-semibold text-forest-700 shadow transition hover:bg-white ${uploadingArrivalDocId ? "pointer-events-none opacity-60" : ""}`}
                    >
                      <Upload size={14} />
                      {uploadingArrivalDocId === product.docId
                        ? "Uploading..."
                        : product.newArrivalImage
                          ? "Replace Image"
                          : "Choose Image"}
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        disabled={Boolean(uploadingArrivalDocId)}
                        onChange={(e) => {
                          void uploadNewArrivalImage(
                            product,
                            e.target.files?.[0],
                          );
                          e.currentTarget.value = "";
                        }}
                      />
                    </label>
                    <span className="absolute bottom-4 left-3 text-[11px] text-white/90">
                      Drop image here
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-800">
                          {product.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {product.category}
                        </p>
                      </div>
                      <label className="flex items-center gap-2 text-[10px] uppercase text-gray-500">
                        <span>Order</span>
                        <input
                          data-tour={index === 0 ? "new-arrival-order" : undefined}
                          type="number"
                          min="1"
                          defaultValue={product.newArrivalOrder ?? product.id}
                          disabled={!product.isNew || saving}
                          onBlur={(e) =>
                            updateNewArrival(
                              product,
                              true,
                              Number(e.target.value),
                            )
                          }
                          className="w-14 rounded border px-2 py-1 text-center text-sm text-gray-700 disabled:bg-gray-100"
                        />
                      </label>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        data-tour={index === 0 ? "new-arrival-preview-button" : undefined}
                        type="button"
                        onClick={() => setArrivalPreview(product)}
                        className="flex items-center justify-center gap-2 rounded-lg border border-gold-200 bg-white px-3 py-2 text-sm font-semibold text-gold-700 transition hover:bg-gold-50"
                      >
                        <Eye size={16} /> Preview
                      </button>
                      <button
                        data-tour={index === 0 ? "new-arrival-toggle" : undefined}
                        type="button"
                        disabled={saving}
                        onClick={() =>
                          updateNewArrival(product, !product.isNew)
                        }
                        className={`flex items-center justify-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-semibold disabled:opacity-50 ${product.isNew ? "border-red-200 text-red-600 hover:bg-red-50" : "border-forest-300 text-forest-700 hover:bg-forest-50"}`}
                      >
                        {product.isNew ? (
                          <>
                            <X size={16} />
                            <span className="hidden sm:inline">Hide</span>
                            <span className="sm:hidden">Remove</span>
                          </>
                        ) : (
                          <>
                            <Plus size={16} /> Add
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {!paginatedArrivalProducts.length && (
              <p className="col-span-full rounded-lg bg-gray-50 p-6 text-center text-sm text-gray-500">
                No products match these filters.
              </p>
            )}
          </div>
          {arrivalEditorProducts.length > newArrivalPageSize && (
            <div data-tour="new-arrival-pagination" className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              <p className="text-sm text-gray-500">
                Page {currentNewArrivalPage} of {newArrivalPageCount}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={currentNewArrivalPage === 1}
                  onClick={() =>
                    setNewArrivalPage((page) => Math.max(1, page - 1))
                  }
                  className="rounded-lg border px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                {Array.from(
                  { length: newArrivalPageCount },
                  (_, index) => index + 1,
                ).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setNewArrivalPage(page)}
                    aria-current={
                      page === currentNewArrivalPage ? "page" : undefined
                    }
                    className={`h-10 min-w-10 rounded-lg border px-3 text-sm font-semibold ${page === currentNewArrivalPage ? "border-forest-600 bg-forest-600 text-white" : "text-gray-700 hover:bg-gray-50"}`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={currentNewArrivalPage === newArrivalPageCount}
                  onClick={() =>
                    setNewArrivalPage((page) =>
                      Math.min(newArrivalPageCount, page + 1),
                    )
                  }
                  className="rounded-lg border px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
