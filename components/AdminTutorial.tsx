"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

const productSteps = [
  {
    target: "[data-tour='admin-menu-products']",
    title: "Products menu",
    text: "Use this sidebar option whenever you need to open Product Management and maintain the store catalog.",
  },
  {
    target: "[data-tour='add-product']",
    title: "Add a product",
    text: "Start here to enter product details, pricing, options, stock, and images.",
  },
  {
    target: "[data-tour='product-filters']",
    title: "Find products quickly",
    text: "Search by name and narrow the catalog using category or New Arrival filters.",
  },
  {
    target: "[data-tour='product-list']",
    title: "Manage the catalog",
    text: "Review each product here. Use its actions to preview, edit, or delete it.",
  },
  {
    target: "[data-tour='product-action-preview']",
    title: "Preview a product",
    text: "Open the storefront product page in a new tab to check what customers will see.",
  },
  {
    target: "[data-tour='product-action-delete']",
    title: "Delete a product",
    text: "Permanently remove a product from Firestore, the shop, and New Arrivals. A confirmation is required.",
  },
  {
    target: "[data-tour='product-action-edit']",
    title: "Edit a product",
    text: "Select Edit to open the complete product editor. We will explore it next.",
  },
  {
    target: "[data-tour='product-edit-basics']",
    title: "Basic information",
    text: "Update the product name, category, and price at the top of the editor.",
    opensEditor: true,
  },
  {
    target: "[data-tour='product-edit-colors']",
    title: "Colors and options",
    text: "Select every available color or create a custom color for this product.",
  },
  {
    target: "[data-tour='product-edit-images']",
    title: "Product images",
    text: "Pair an image with each selected color by dropping a file, choosing one, or pasting a URL.",
  },
  {
    target: "[data-tour='product-edit-details']",
    title: "Short description",
    text: "Write a concise summary for product cards and quick catalog views.",
  },
  {
    target: "[data-tour='product-edit-full-description']",
    title: "Full description",
    text: "Add the complete product story and the details customers should know before ordering.",
  },
  {
    target: "[data-tour='product-edit-materials']",
    title: "Materials",
    text: "List each material on a separate line so it is easy to read on the storefront.",
  },
  {
    target: "[data-tour='product-edit-features']",
    title: "Features",
    text: "Enter one key product benefit or feature per line.",
  },
  {
    target: "[data-tour='product-edit-care']",
    title: "Care instructions",
    text: "Explain how customers should clean, store, or maintain the product.",
  },
  {
    target: "[data-tour='product-edit-includes']",
    title: "Package includes",
    text: "List everything the customer will receive in the package.",
  },
  {
    target: "[data-tour='product-edit-size-guide']",
    title: "Size guide",
    text: "Add an optional link to the relevant sizing guide for this product.",
  },
  {
    target: "[data-tour='product-edit-visibility']",
    title: "Store visibility",
    text: "Control whether the item appears in New Arrivals, is marked popular, and remains visible in the shop.",
  },
  {
    target: "[data-tour='product-edit-save']",
    title: "Save your changes",
    text: "Select Save Changes when finished. You will still be asked to confirm before the product is updated.",
  },
];

const orderSteps = [
  { target: "[data-tour='admin-menu-orders']", title: "Orders menu", text: "Use this sidebar option to review customer and guest orders and manage fulfillment." },
  { target: "[data-tour='add-order']", title: "Add a manual order", text: "Create an order when a purchase was received outside the storefront." },
  { target: "[data-tour='manual-order-customer']", title: "Customer and delivery", text: "Enter the customer's contact and delivery information.", trigger: "[data-tour='add-order']" },
  { target: "[data-tour='manual-order-status-trigger']", title: "Initial order status", text: "Use this dropdown to choose the status that best represents the order when it is created." },
  { target: "[data-tour='manual-add-product']", title: "Add an order item", text: "Use Add Product to place another product row inside this manual order." },
  { target: "[data-tour='manual-order-item-row']", title: "Configure the product", text: "Choose the product, color, and quantity. You can also remove the row before creating the order.", trigger: "[data-tour='manual-add-product']", clickOnEnter: true },
  { target: "[data-tour='manual-order-save']", title: "Create the order", text: "Review the calculated total and create the order when all information is complete." },
  { target: "[data-tour='order-filters']", title: "Find an order", text: "Search by order, customer, email, or tracking number, then filter by month and status." },
  { target: "[data-tour='order-selection']", title: "Select multiple orders", text: "Select the visible page to update several orders together using the bulk action." },
  { target: "[data-tour='order-first-row']", title: "Review an order", text: "Each row shows the customer, status, tracking, total, and item count. Select it for complete details." },
  { target: "[data-tour='order-details-items']", title: "Order items", text: "Review every purchased product, selected option, size, and quantity.", trigger: "[data-tour='order-first-row-button']" },
  { target: "[data-tour='order-details-summary']", title: "Delivery and summary", text: "Confirm the delivery information, shipment tracking, order date, and total." },
  { target: "[data-tour='order-manage-tracking']", title: "Manage fulfillment", text: "Change the order status and add its carrier and tracking information.", trigger: "[data-tour='order-first-row-button']" },
  { target: "[data-tour='tracking-modal-fields']", title: "Tracking details", text: "Choose the order status and carrier, then enter the tracking number and customer update.", trigger: "[data-tour='order-manage-tracking']" },
  { target: "[data-tour='tracking-save']", title: "Save tracking", text: "Save when the fulfillment and tracking information is ready. Confirmation is required." },
];

const newArrivalSteps = [
  { target: "[data-tour='admin-menu-new-arrivals']", title: "New Arrivals menu", text: "Open this section to control which products appear in the homepage New Arrivals collection." },
  { target: "[data-tour='new-arrival-filters']", title: "Find products", text: "Search the catalog and filter by category or current New Arrivals visibility." },
  { target: "[data-tour='new-arrival-first-card']", title: "Product card", text: "Each card shows the product's homepage image, collection state, and display order." },
  { target: "[data-tour='new-arrival-image']", title: "Homepage image", text: "Drop an image here or choose a file to use a dedicated New Arrivals image." },
  { target: "[data-tour='new-arrival-order']", title: "Display order", text: "Set the product's position in the homepage collection. Lower numbers appear first." },
  { target: "[data-tour='new-arrival-preview-button']", title: "Preview the image", text: "Select Preview to inspect the complete homepage image before publishing." },
  { target: "[data-tour='new-arrival-preview-modal']", title: "Image preview", text: "The preview preserves the image's full proportions so you can verify the final asset.", trigger: "[data-tour='new-arrival-preview-button']" },
  { target: "[data-tour='new-arrival-toggle']", title: "Show or hide", text: "Add the product to New Arrivals or hide it without removing it from the shop." },
  { target: "[data-tour='new-arrival-pagination']", title: "Browse more products", text: "Use pagination to manage the remaining matching products." },
];

type TourName = "products" | "orders" | "new-arrivals";

const getSteps = (tour: TourName) =>
  tour === "products"
    ? productSteps
    : tour === "orders"
      ? orderSteps
      : newArrivalSteps;

export default function AdminTutorial() {
  const pathname = usePathname();
  const [tour, setTour] = useState<TourName | null>(null);
  const [step, setStep] = useState<number | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [spotlightRadius, setSpotlightRadius] = useState("12px");
  const automaticClicksRef = useRef(new Set<string>());

  useEffect(() => {
    const requested = window.sessionStorage.getItem("verde-admin-tour");
    if (
      (pathname === "/admin/products" && requested === "products") ||
      (pathname === "/admin/orders" && requested === "orders") ||
      (pathname === "/admin/new-arrivals" && requested === "new-arrivals")
    ) {
      window.sessionStorage.removeItem("verde-admin-tour");
      if (window.matchMedia("(min-width: 768px)").matches) {
        automaticClicksRef.current.clear();
        setTour(requested as TourName);
        setStep(0);
      }
    }
  }, [pathname]);

  useEffect(() => {
    if (step === null || !tour) return;
    const steps = getSteps(tour);
    let retryTimer: number | undefined;
    let actionRequested = false;
    const update = () => {
      const currentStep = steps[step];
      const automaticClickKey = `${tour}:${step}`;
      if (
        "clickOnEnter" in currentStep &&
        currentStep.clickOnEnter &&
        "trigger" in currentStep &&
        typeof currentStep.trigger === "string" &&
        !automaticClicksRef.current.has(automaticClickKey)
      ) {
        automaticClicksRef.current.add(automaticClickKey);
        actionRequested = true;
        document
          .querySelector<HTMLElement>(currentStep.trigger)
          ?.click();
        setRect(null);
        retryTimer = window.setTimeout(update, 150);
        return;
      }
      const element = document.querySelector(currentStep.target);
      if (!element) {
        setRect(null);
        const trigger = "trigger" in currentStep
          ? currentStep.trigger
          : "opensEditor" in currentStep && currentStep.opensEditor
            ? "[data-tour='product-action-edit']"
            : undefined;
        if (trigger && !actionRequested) {
          actionRequested = true;
          const editButton = document.querySelector<HTMLElement>(
            trigger,
          );
          editButton?.click();
        }
        retryTimer = window.setTimeout(update, 100);
        return;
      }
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      window.setTimeout(() => {
        setRect(element.getBoundingClientRect());
        setSpotlightRadius(window.getComputedStyle(element).borderRadius || "0px");
      }, 350);
    };
    update();
    window.addEventListener("resize", update);
    return () => {
      if (retryTimer) window.clearTimeout(retryTimer);
      window.removeEventListener("resize", update);
    };
  }, [step, tour]);

  if (step === null || !rect || !tour) return null;
  const steps = getSteps(tour);
  const current = steps[step];
  const goToStep = (nextStep: number) => {
    const nextTarget = steps[nextStep]?.target || "";
    if (
      current.target.startsWith("[data-tour='product-edit-") &&
      !nextTarget.startsWith("[data-tour='product-edit-")
    ) {
      document
        .querySelector<HTMLElement>("[data-tour='product-edit-close']")
        ?.click();
    }
    if (
      current.target.startsWith("[data-tour='order-details-") &&
      !nextTarget.startsWith("[data-tour='order-details-") &&
      nextTarget !== "[data-tour='order-manage-tracking']"
    ) {
      document
        .querySelector<HTMLElement>("[data-tour='order-details-close']")
        ?.click();
    }
    if (
      current.target.startsWith("[data-tour='manual-") &&
      !nextTarget.startsWith("[data-tour='manual-")
    ) {
      document
        .querySelector<HTMLElement>("[data-tour='manual-order-close']")
        ?.click();
    }
    if (
      (current.target.startsWith("[data-tour='tracking-") ||
        current.target === "[data-tour='tracking-modal-fields']") &&
      !nextTarget.startsWith("[data-tour='tracking-") &&
      nextTarget !== "[data-tour='tracking-modal-fields']"
    ) {
      document
        .querySelector<HTMLElement>("[data-tour='tracking-modal-close']")
        ?.click();
    }
    if (
      current.target === "[data-tour='new-arrival-preview-modal']" &&
      nextTarget !== "[data-tour='new-arrival-preview-modal']"
    ) {
      document
        .querySelector<HTMLElement>("[data-tour='new-arrival-preview-close']")
        ?.click();
    }
    setRect(null);
    setStep(nextStep);
  };
  const finish = () => {
    document
      .querySelector<HTMLElement>("[data-tour='product-edit-close']")
      ?.click();
    document
      .querySelector<HTMLElement>("[data-tour='order-details-close']")
      ?.click();
    document
      .querySelector<HTMLElement>("[data-tour='manual-order-close']")
      ?.click();
    document
      .querySelector<HTMLElement>("[data-tour='tracking-modal-close']")
      ?.click();
    document
      .querySelector<HTMLElement>("[data-tour='new-arrival-preview-close']")
      ?.click();
    setStep(null);
    setTour(null);
  };
  const cardWidth = Math.min(380, window.innerWidth - 32);
  const estimatedCardHeight = 220;
  const cardLeft = rect
    ? Math.min(
        window.innerWidth - cardWidth - 16,
        Math.max(16, rect.left + rect.width / 2 - cardWidth / 2),
      )
    : 16;
  const cardTop = rect
    ? rect.bottom + 18 + estimatedCardHeight <= window.innerHeight
      ? rect.bottom + 18
      : Math.max(16, rect.top - estimatedCardHeight - 18)
    : window.innerHeight - estimatedCardHeight - 16;

  return (
    <div className="fixed inset-0 z-[1100]" role="dialog" aria-modal="true">
      {rect ? (
        <>
          <div
            className="fixed left-0 right-0 top-0 bg-black/65 backdrop-blur-[2px]"
            style={{ height: Math.max(0, rect.top - 8) }}
          />
          <div
            className="fixed bottom-0 left-0 right-0 bg-black/65 backdrop-blur-[2px]"
            style={{ top: Math.min(window.innerHeight, rect.bottom + 8) }}
          />
          <div
            className="fixed left-0 bg-black/65 backdrop-blur-[2px]"
            style={{
              top: Math.max(0, rect.top - 8),
              width: Math.max(0, rect.left - 8),
              height: rect.height + 16,
            }}
          />
          <div
            className="fixed right-0 bg-black/65 backdrop-blur-[2px]"
            style={{
              top: Math.max(0, rect.top - 8),
              left: Math.min(window.innerWidth, rect.right + 8),
              height: rect.height + 16,
            }}
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px]" />
      )}
      {rect && (
        <div
          className="pointer-events-none fixed border-2 border-gold-300 shadow-[0_0_0_5px_rgba(201,162,79,.3),0_14px_45px_rgba(0,0,0,.35)]"
          style={{
            left: Math.max(8, rect.left - 7),
            top: Math.max(8, rect.top - 7),
            width: Math.min(window.innerWidth - 16, rect.width + 14),
            height: rect.height + 14,
            borderRadius: spotlightRadius,
          }}
        />
      )}
      <section
        className="fixed rounded-2xl border border-gold-400/40 bg-[#fffdf8] p-5 shadow-2xl transition-[left,top] duration-300"
        style={{ left: cardLeft, top: cardTop, width: cardWidth }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-gold-600">
              {tour === "products" ? "Products" : tour === "orders" ? "Orders" : "New Arrivals"} tutorial · {step + 1} of {steps.length}
            </p>
            <h2 className="mt-1 font-serif text-xl text-forest-950">
              {current.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={finish}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100"
            aria-label="Close tutorial"
          >
            <X size={18} />
          </button>
        </div>
        <p className="mt-2 text-sm leading-6 text-gray-600">{current.text}</p>
        <div className="mt-5 flex items-center justify-between">
          <button
            type="button"
            onClick={finish}
            className="text-xs font-semibold text-gray-500 hover:text-gray-800"
          >
            Skip tutorial
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => goToStep(Math.max(0, step - 1))}
                className="flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold"
              >
                <ChevronLeft size={15} /> Back
              </button>
            )}
            <button
              type="button"
              onClick={() =>
                step === steps.length - 1
                  ? finish()
                  : goToStep(step + 1)
              }
              className="flex items-center gap-1 rounded-lg bg-forest-800 px-4 py-2 text-xs font-semibold text-white"
            >
              {step === steps.length - 1 ? "Finish" : "Next"}
              {step < steps.length - 1 && <ChevronRight size={15} />}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
