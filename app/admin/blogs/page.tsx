"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { upload } from "@imagekit/next";
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
import {
  AlertTriangle,
  ArrowLeft,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { firestore } from "@/lib/firebase";
import type { BlogPostRecord } from "@/context/BlogContext";
import SiteAssetImage from "@/components/SiteAssetImage";
import AdminRowActions from "@/components/AdminRowActions";
import AdminPageSkeleton from "@/components/AdminPageSkeleton";
import AdminToast from "@/components/AdminToast";
import AdminConfirmModal from "@/components/AdminConfirmModal";
type BlogForm = Omit<BlogPostRecord, "id">;
const today = () => new Date().toISOString().slice(0, 10);
const emptyForm = (): BlogForm => ({
  slug: "",
  title: "",
  excerpt: "",
  category: "Journal",
  imageUrl: "",
  imageFileId: "",
  imageAssetId: "blog-placeholder",
  date: today(),
  publishedAt: today(),
  readTime: "3 min read",
  featured: false,
  published: true,
  content: "",
});

export default function BlogAdminPage() {
  const { user, loading } = useAuth();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [posts, setPosts] = useState<BlogPostRecord[]>([]);
  const [form, setForm] = useState<BlogForm>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<BlogPostRecord | null>(null);
  const [confirmSave, setConfirmSave] = useState(false);
  const [pendingCover, setPendingCover] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");

  const loadPosts = async () => {
    const snapshot = await getDocs(collection(firestore, "blogs"));
    setPosts(
      snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }) as BlogPostRecord)
        .sort((a, b) =>
          (b.publishedAt || "").localeCompare(a.publishedAt || ""),
        ),
    );
  };
  useEffect(() => {
    if (loading) return;
    if (!user) return setAllowed(false);
    getIdTokenResult(user, true)
      .then((token) => {
        const admin = token.claims.admin === true;
        setAllowed(admin);
        if (admin) loadPosts();
      })
      .catch(() => setAllowed(false));
  }, [user, loading]);
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 2800);
    return () => clearTimeout(timer);
  }, [message]);

  const matchingPosts = useMemo(
    () =>
      posts.filter((post) =>
        `${post.title} ${post.category}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [posts, search],
  );
  const pageSize = 6;
  const pageCount = Math.max(1, Math.ceil(matchingPosts.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const filtered = matchingPosts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  useEffect(() => setPage(1), [search]);
  const startAdd = () => {
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setPendingCover(null);
    setCoverPreview("");
    setEditingId(null);
    setForm(emptyForm());
    setOpen(true);
  };
  const startEdit = (post: BlogPostRecord) => {
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setPendingCover(null);
    setCoverPreview("");
    const { id, ...fields } = post;
    setEditingId(id);
    setForm(fields);
    setOpen(true);
  };
  const handleSaveAttempt = (event: FormEvent) => {
    event.preventDefault();
    if (saving || uploading) return;
    setConfirmSave(true);
  };

  const handleConfirmSave = async () => {
    setConfirmSave(false);
    const event = { preventDefault: () => undefined } as FormEvent;
    await save(event);
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.title.trim() || !form.slug.trim() || !form.content.trim()) return;
    setSaving(true);
    let uploadedFileId = "";
    try {
      let savedForm = form;
      if (pendingCover) {
        setUploading(true);
        const token = await user!.getIdToken();
        const response = await fetch("/api/imagekit-auth", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const auth = await response.json();
        if (!response.ok)
          throw new Error(auth.error || "Upload authorization failed.");
        const result = await upload({
          file: pendingCover,
          fileName:
            `blog-${form.slug || form.title || pendingCover.name}`.replace(
              /[^a-zA-Z0-9._-]/g,
              "-",
            ),
          folder: "/verdebyrenzo/blogs",
          useUniqueFileName: true,
          token: auth.token,
          signature: auth.signature,
          expire: auth.expire,
          publicKey: auth.publicKey,
        });
        if (!result.url || !result.fileId)
          throw new Error("ImageKit did not return complete file details.");
        uploadedFileId = result.fileId;
        savedForm = {
          ...form,
          imageUrl: result.url,
          imageFileId: result.fileId,
        };
      }
      const fields = {
        ...savedForm,
        slug: savedForm.slug
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
        updatedAt: serverTimestamp(),
      };
      if (editingId)
        await updateDoc(doc(firestore, "blogs", editingId), fields);
      else
        await addDoc(collection(firestore, "blogs"), {
          ...fields,
          createdAt: serverTimestamp(),
        });
      if (
        pendingCover &&
        form.imageFileId &&
        form.imageFileId !== uploadedFileId
      ) {
        const token = await user!.getIdToken();
        const cleanupResponse = await fetch("/api/imagekit-files", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ fileIds: [form.imageFileId] }),
        });
        if (!cleanupResponse.ok)
          console.error(
            "The previous blog cover could not be removed from ImageKit.",
          );
      }
      if (coverPreview) URL.revokeObjectURL(coverPreview);
      setPendingCover(null);
      setCoverPreview("");
      setOpen(false);
      await loadPosts();
      setMessage(editingId ? "Article updated." : "Article added.");
    } catch (error) {
      console.error(error);
      if (uploadedFileId) {
        const token = await user!.getIdToken();
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
        error instanceof Error ? error.message : "Unable to save article.",
      );
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };
  const selectCover = (file?: File) => {
    if (!file) return;
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setPendingCover(file);
    setCoverPreview(URL.createObjectURL(file));
  };
  const confirmDeletePost = async () => {
    if (!deleteTarget || !user) return;
    const post = deleteTarget;
    setSaving(true);
    setMessage("");
    try {
      if (post.imageFileId) {
        const token = await user.getIdToken();
        const response = await fetch("/api/imagekit-files", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ fileIds: [post.imageFileId] }),
        });
        if (!response.ok) {
          const result = await response.json().catch(() => ({}));
          throw new Error(
            result.error || "Unable to delete the blog image from ImageKit.",
          );
        }
      }
      await deleteDoc(doc(firestore, "blogs", post.id));
      await loadPosts();
      setDeleteTarget(null);
      setMessage(`${post.title} was deleted.`);
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to delete the article.",
      );
    } finally {
      setSaving(false);
    }
  };
  if (loading || allowed === null) return <AdminPageSkeleton variant="blogs" />;
  if (!allowed)
    return (
      <main className="min-h-screen pt-36 text-center">
        Administrator access required.
      </main>
    );
  return (
    <main className="blog-admin-page min-h-screen bg-[#f4f7f2] py-6 sm:py-8">
      <div className="mx-auto w-full max-w-[1480px] px-5 lg:px-8">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-gold-600">
              Administration
            </p>
            <h1 className="font-serif text-3xl text-forest-900">
              Journal Management
            </h1>
            <p className="text-gray-500">
              {posts.length} articles in Firestore
            </p>
          </div>
          <button
            onClick={startAdd}
            className="inline-flex items-center gap-2 rounded-lg bg-forest-700 px-4 py-2.5 font-semibold text-white"
          >
            <Plus size={18} />
            Add article
          </button>
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
        <div className="rounded-2xl border bg-white p-4 sm:p-6">
          <label className="relative block">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search articles..."
              className="w-full rounded-lg border py-2.5 pl-10 pr-3"
            />
          </label>
          <div className="mt-4 divide-y">
            {filtered.map((post) => (
              <div
                key={post.id}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center"
              >
                <div className="relative h-24 w-full flex-none overflow-hidden rounded-lg bg-gray-100 sm:h-16 sm:w-24">
                  {post.imageUrl ? (
                    <Image
                      src={post.imageUrl}
                      alt={post.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <SiteAssetImage
                      assetId={post.imageAssetId || "blog-placeholder"}
                      alt={post.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 96px"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap gap-2">
                    <h2 className="truncate font-semibold text-forest-900">
                      {post.title}
                    </h2>
                    {post.featured && (
                      <span className="rounded-full bg-gold-100 px-2 py-0.5 text-[10px] font-bold text-gold-700">
                        FEATURED
                      </span>
                    )}
                    {!post.published && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px]">
                        DRAFT
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {post.category} · {post.publishedAt}
                  </p>
                </div>
                <AdminRowActions
                  previewHref={`/blog/${post.slug}`}
                  itemName={post.title}
                  onEdit={() => startEdit(post)}
                  onDelete={() => setDeleteTarget(post)}
                  disabled={saving}
                />
              </div>
            ))}
          </div>
          {matchingPosts.length > pageSize && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              <p className="text-sm text-gray-500">
                Page {currentPage} of {pageCount}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  className="rounded-lg border px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                {Array.from({ length: pageCount }, (_, index) => index + 1).map(
                  (number) => (
                    <button
                      type="button"
                      key={number}
                      onClick={() => setPage(number)}
                      aria-current={number === currentPage ? "page" : undefined}
                      className={`h-10 min-w-10 rounded-lg border px-3 text-sm font-semibold ${number === currentPage ? "border-forest-600 bg-forest-600 text-white" : "text-gray-700 hover:bg-gray-50"}`}
                    >
                      {number}
                    </button>
                  ),
                )}
                <button
                  type="button"
                  disabled={currentPage === pageCount}
                  onClick={() =>
                    setPage((value) => Math.min(pageCount, value + 1))
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
      <AdminConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete article?"
        description={`${deleteTarget?.title ?? "This article"} and its uploaded cover image will be permanently removed from Firestore and ImageKit. This action cannot be undone.`}
        confirmLabel={saving ? "Deleting..." : "Delete Article"}
        tone="danger"
        onConfirm={confirmDeletePost}
        onCancel={() => setDeleteTarget(null)}
      />
      <AdminConfirmModal
        open={confirmSave}
        title="Save changes?"
        description="This will publish the updated article and keep the current cover image in sync with Firestore and ImageKit."
        confirmLabel={saving ? "Saving..." : "Save article"}
        tone="success"
        onConfirm={handleConfirmSave}
        onCancel={() => setConfirmSave(false)}
      />
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3">
          <form
            onSubmit={handleSaveAttempt}
            className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 sm:p-7"
          >
            <div className="mb-5 flex justify-between">
              <h2 className="font-serif text-2xl text-forest-900">
                {editingId ? "Edit article" : "Add article"}
              </h2>
              <button
                type="button"
                onClick={() => {
                  if (coverPreview) URL.revokeObjectURL(coverPreview);
                  setPendingCover(null);
                  setCoverPreview("");
                  setOpen(false);
                }}
              >
                <X />
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                required
                value={form.title}
                onChange={(e) =>
                  setForm({
                    ...form,
                    title: e.target.value,
                    slug: editingId
                      ? form.slug
                      : e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, "-"),
                  })
                }
                placeholder="Article title"
                className="rounded-lg border p-3 sm:col-span-2"
              />
              <input
                required
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="URL slug"
                className="rounded-lg border p-3"
              />
              <input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Category"
                className="rounded-lg border p-3"
              />
              <textarea
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                placeholder="Excerpt"
                className="min-h-24 rounded-lg border p-3 sm:col-span-2"
              />
              <input
                type="date"
                value={form.publishedAt}
                onChange={(e) =>
                  setForm({
                    ...form,
                    publishedAt: e.target.value,
                    date: e.target.value,
                  })
                }
                className="rounded-lg border p-3"
              />
              <input
                value={form.readTime}
                onChange={(e) => setForm({ ...form, readTime: e.target.value })}
                placeholder="3 min read"
                className="rounded-lg border p-3"
              />
              <label className="cursor-pointer rounded-xl border-2 border-dashed p-5 text-center sm:col-span-2">
                <Upload className="mx-auto mb-2" />
                <span>
                  {pendingCover
                    ? `${pendingCover.name} selected — uploads when saved`
                    : form.imageUrl
                      ? "Choose a replacement cover image"
                      : "Choose cover image"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => selectCover(e.target.files?.[0])}
                />
              </label>
              {(coverPreview || form.imageUrl) && (
                <div className="relative aspect-video overflow-hidden rounded-xl sm:col-span-2">
                  <Image
                    src={(coverPreview || form.imageUrl)!}
                    alt="Cover preview"
                    fill
                    unoptimized={Boolean(coverPreview)}
                    className="object-cover"
                  />
                </div>
              )}
              <textarea
                required
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Article content in Markdown"
                className="min-h-72 rounded-lg border p-3 font-mono text-sm sm:col-span-2"
              />
              <label className="flex gap-2">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) =>
                    setForm({ ...form, featured: e.target.checked })
                  }
                />
                Featured article
              </label>
              <label className="flex gap-2">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) =>
                    setForm({ ...form, published: e.target.checked })
                  }
                />
                Published
              </label>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={saving || uploading}
                onClick={() => {
                  if (coverPreview) URL.revokeObjectURL(coverPreview);
                  setPendingCover(null);
                  setCoverPreview("");
                  setOpen(false);
                }}
                className="rounded-lg border px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || uploading}
                className="rounded-lg bg-forest-700 px-6 py-3 font-semibold text-white disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save article"}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
