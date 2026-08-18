"use client";

import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";

type AdminToastProps = {
  message: string;
  onDismiss?: () => void;
  tone?: "default" | "success" | "warning" | "error";
};

export default function AdminToast({
  message,
  onDismiss,
  tone = "success",
}: AdminToastProps) {
  if (!message) return null;

  const tones = {
    default:
      "border-[#29352e] border-l-[#c39a4b] bg-[#111914] text-[#e0b65f] shadow-black/25",
    success:
      "border-[#29352e] border-l-[#c39a4b] bg-[#111914] text-[#e0b65f] shadow-black/25",
    warning:
      "border-[#29352e] border-l-[#d6a84e] bg-[#111914] text-[#e0b65f] shadow-black/25",
    error:
      "border-[#29352e] border-l-[#8f4749] bg-[#111914] text-[#e0b65f] shadow-black/25",
  };
  const icons = {
    default: Info,
    success: CheckCircle2,
    warning: AlertTriangle,
    error: XCircle,
  };
  const ToneIcon = icons[tone];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed right-5 top-5 z-[1050] flex max-w-sm items-center gap-3 rounded-xl border border-l-4 px-4 py-3 text-sm font-medium shadow-xl ring-1 ring-black/5 backdrop-blur-sm ${tones[tone]}`}
    >
      <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[#e0b65f]/10 text-[#e0b65f] ring-1 ring-inset ring-[#e0b65f]/20">
        <ToneIcon size={16} strokeWidth={1.8} />
      </span>
      <span className="flex-1 leading-5">{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="rounded p-1 text-current/80 transition hover:bg-black/5 hover:text-current"
          aria-label="Dismiss notification"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
