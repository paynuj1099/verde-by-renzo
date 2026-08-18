"use client";

import { AlertTriangle, Check } from "lucide-react";

type AdminConfirmModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "danger" | "success";
  onConfirm: () => void;
  onCancel: () => void;
};

export default function AdminConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  tone = "danger",
  onConfirm,
  onCancel,
}: AdminConfirmModalProps) {
  if (!open) return null;

  const isDanger = tone === "danger";

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/35 p-5 backdrop-blur-[2px]"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="admin-confirm-title"
      aria-describedby="admin-confirm-description"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-confirm-title"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-[320px] overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="px-6 pt-7 pb-6 text-center">
          <div
            className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${
              isDanger ? "bg-red-50" : "bg-emerald-50"
            }`}
          >
            {isDanger ? (
              <AlertTriangle size={26} className="text-red-500" />
            ) : (
              <Check size={26} className="text-emerald-600" />
            )}
          </div>

          <h3
            id="admin-confirm-title"
            className="mb-2 font-serif text-xl font-semibold text-gray-900"
          >
            {title}
          </h3>

          <p
            id="admin-confirm-description"
            className="mx-auto max-w-[250px] text-sm leading-6 text-gray-500"
          >
            {description}
          </p>
        </div>

        <div className="grid grid-cols-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onCancel}
            className="border-r border-gray-100 px-4 py-4 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-4 text-sm font-semibold transition-colors ${
              isDanger
                ? "text-red-500 hover:bg-red-50 hover:text-red-600"
                : "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
