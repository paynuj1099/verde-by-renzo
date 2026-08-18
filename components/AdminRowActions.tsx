"use client";

import Link from "next/link";
import { Eye, Pencil, Trash2 } from "lucide-react";

type AdminRowActionsProps = {
  previewHref: string;
  itemName: string;
  onEdit: () => void;
  onDelete: () => void;
  disabled?: boolean;
};

const baseClass =
  "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

export default function AdminRowActions({
  previewHref,
  itemName,
  onEdit,
  onDelete,
  disabled = false,
}: AdminRowActionsProps) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-shrink-0">
      <Link
        href={previewHref}
        target="_blank"
        rel="noopener noreferrer"
        className={`${baseClass} border-gold-500 text-gold-700 hover:bg-gold-50`}
        aria-label={`Preview ${itemName}`}
      >
        <Eye size={15} />
        Preview
      </Link>
      <button
        type="button"
        onClick={onEdit}
        disabled={disabled}
        className={`${baseClass} border-forest-600 text-forest-700 hover:bg-forest-50`}
        aria-label={`Edit ${itemName}`}
      >
        <Pencil size={15} />
        Edit
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={disabled}
        className={`${baseClass} border-red-300 text-red-600 hover:bg-red-50`}
        aria-label={`Delete ${itemName}`}
      >
        <Trash2 size={15} />
        Delete
      </button>
    </div>
  );
}
