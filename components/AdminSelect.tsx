"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export type AdminSelectOption = {
  value: string;
  label: string;
};

type AdminSelectProps = {
  value: string;
  options: AdminSelectOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
  className?: string;
};

export default function AdminSelect({
  value,
  options,
  onChange,
  ariaLabel,
  className = "",
}: AdminSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`flex w-full items-center justify-between gap-3 rounded-xl border bg-white px-3 py-2.5 text-left transition ${open ? "border-forest-600 ring-2 ring-forest-100" : "border-gray-200 hover:border-forest-300"}`}
      >
        <span className="min-w-0 truncate">{selected?.label || value}</span>
        <ChevronDown
          size={17}
          className={`flex-none text-forest-700 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div
          role="listbox"
          aria-label={ariaLabel}
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-[1080] max-h-64 overflow-y-auto rounded-xl border border-forest-100 bg-white p-1.5 shadow-xl ring-1 ring-black/5"
        >
          {options.map((option) => {
            const active = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${active ? "bg-forest-700 font-semibold text-white" : "text-gray-700 hover:bg-forest-50 hover:text-forest-800"}`}
              >
                <span className="truncate">{option.label}</span>
                {active && <Check size={15} className="flex-none" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
