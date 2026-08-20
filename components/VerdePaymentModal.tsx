"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  BadgeCheck,
  Clock3,
  CreditCard,
  Download,
  ExternalLink,
  FlaskConical,
  QrCode,
  RefreshCcw,
  ShieldCheck,
  Smartphone,
  WalletCards,
  X,
  XCircle,
} from "lucide-react";

import {
  getColorDisplay,
  getProductById,
  getProductImage,
} from "@/lib/productUtils";
import { getGloveHandDisplay } from "@/data/productOptions";

type CartItem = {
  id: number;
  color: string;
  size?: string | null;
  hand?: string | null;
  quantity: number;
};

type VerdePaymentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  totalAmount: number;
  isProcessing?: boolean;
  mayaEnabled?: boolean;
  qrCodeImage?: string | null;
  qrExpiresAt?: number | null;
  orderReference?: string;
  paymentError?: string;
  paymentStatus?: "idle" | "waiting" | "processing" | "failed" | "paid";
  isLocalTest?: boolean;
  testPaymentUrl?: string;
  onPayWithQrPh?: () => void;
  onPayWithMaya?: () => void;
  onBackToPaymentMethods?: () => void;
  onPaymentDone?: () => void;
};

const BRAND_LOGO_PATH = "/images/verde-logo.png";

function formatPeso(value: number) {
  return value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatCountdown(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

export default function VerdePaymentModal({
  isOpen,
  onClose,
  cart,
  totalAmount,
  isProcessing = false,
  mayaEnabled = false,
  qrCodeImage = null,
  qrExpiresAt = null,
  orderReference = "",
  paymentError = "",
  paymentStatus = "idle",
  isLocalTest = false,
  testPaymentUrl = "",
  onPayWithQrPh,
  onPayWithMaya,
  onBackToPaymentMethods,
  onPaymentDone,
}: VerdePaymentModalProps) {
  const [clockNow, setClockNow] = useState(() => Date.now());

  useEffect(() => {
    if (
      !isOpen ||
      !qrCodeImage ||
      !qrExpiresAt ||
      paymentStatus === "paid" ||
      paymentStatus === "failed"
    ) {
      return;
    }

    setClockNow(Date.now());

    const interval = window.setInterval(() => {
      setClockNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [isOpen, qrCodeImage, qrExpiresAt, paymentStatus]);

  const remainingSeconds = qrExpiresAt
    ? Math.max(0, Math.ceil((qrExpiresAt - clockNow) / 1000))
    : null;

  const isQrExpired = Boolean(qrCodeImage) && qrExpiresAt !== null && remainingSeconds === 0;

  if (!isOpen) {
    return null;
  }

  const loadImage = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new window.Image();
      image.crossOrigin = "anonymous";
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Unable to load image: ${src}`));
      image.src = src;
    });

  const loadOptionalImage = async (src: string) => {
    try {
      return await loadImage(src);
    } catch {
      return null;
    }
  };

  const downloadQrCode = async () => {
    if (!qrCodeImage || isQrExpired) {
      return;
    }

    const safeReference = orderReference.trim().replace(/[^a-zA-Z0-9-_]/g, "-") || "payment";

    try {
      const qrImage = await loadImage(qrCodeImage);
      const logoImage = await loadOptionalImage(`${window.location.origin}${BRAND_LOGO_PATH}`);

      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 1900;

      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Unable to prepare QR download.");
      }

      const forest = "#173924";
      const forestDark = "#10261A";
      const gold = "#B89445";
      const ivory = "#F7F3EA";
      const card = "#FFFCF6";
      const ink = "#17251C";
      const muted = "#6B756D";
      const line = "#D8D0C2";

      context.fillStyle = ivory;
      context.fillRect(0, 0, canvas.width, canvas.height);

      context.fillStyle = forest;
      context.fillRect(0, 0, canvas.width, 330);

      context.fillStyle = "rgba(255,255,255,0.08)";
      context.fillRect(0, 330, canvas.width, 18);

      context.textAlign = "center";

      if (logoImage) {
        const boxX = 390;
        const boxY = 34;
        const boxW = 420;
        const boxH = 112;

        context.fillStyle = "rgba(255,255,255,0.08)";
        drawRoundedRect(context, boxX, boxY, boxW, boxH, 26);
        context.fill();

        const fit = Math.min(boxW - 44, 260);
        const ratio = Math.min(fit / logoImage.width, (boxH - 30) / logoImage.height);
        const logoW = logoImage.width * ratio;
        const logoH = logoImage.height * ratio;

        context.drawImage(
          logoImage,
          boxX + (boxW - logoW) / 2,
          boxY + (boxH - logoH) / 2,
          logoW,
          logoH,
        );
      } else {
        context.fillStyle = "#F7F3EA";
        context.font = "700 36px Arial, sans-serif";
        context.fillText("VERDE BY RENZO", 600, 92);
      }

      context.fillStyle = gold;
      context.fillRect(470, 176, 260, 5);

      context.fillStyle = "#F7F3EA";
      context.font = "700 42px Arial, sans-serif";
      context.fillText("QR PH PAYMENT", 600, 234);

      context.globalAlpha = 0.84;
      context.font = "400 27px Arial, sans-serif";
      context.fillText("Scan with Maya, GCash, or a supported banking app", 600, 286);
      context.globalAlpha = 1;

      const contentX = 80;
      const contentY = isLocalTest ? 384 : 360;
      const contentW = 1040;
      const contentBottom = 1700;
      const contentH = contentBottom - contentY;

      context.fillStyle = card;
      drawRoundedRect(context, contentX, contentY, contentW, contentH, 34);
      context.fill();

      context.strokeStyle = line;
      context.lineWidth = 2;
      drawRoundedRect(context, contentX, contentY, contentW, contentH, 34);
      context.stroke();

      if (isLocalTest) {
        context.fillStyle = "#FFF0C9";
        drawRoundedRect(context, 130, 344, 940, 66, 18);
        context.fill();
        context.fillStyle = "#8B5A00";
        context.font = "700 22px Arial, sans-serif";
        context.fillText("TEST MODE — DO NOT SCAN OR PAY THIS QR", 600, 387);
      }

      context.fillStyle = ink;
      context.font = "700 18px Arial, sans-serif";
      context.fillText("SCAN THIS CODE", 600, contentY + 52);

      const qrPanelSize = 620;
      const qrPanelX = 290;
      const qrPanelY = contentY + 92;

      context.fillStyle = "#FFFFFF";
      drawRoundedRect(context, qrPanelX, qrPanelY, qrPanelSize, qrPanelSize, 24);
      context.fill();
      context.strokeStyle = line;
      context.lineWidth = 3;
      drawRoundedRect(context, qrPanelX, qrPanelY, qrPanelSize, qrPanelSize, 24);
      context.stroke();

      context.imageSmoothingEnabled = false;
      context.drawImage(qrImage, qrPanelX + 40, qrPanelY + 40, qrPanelSize - 80, qrPanelSize - 80);
      context.imageSmoothingEnabled = true;

      const detailStartY = qrPanelY + qrPanelSize + 82;

      if (qrExpiresAt) {
        const expiryLabel = new Date(qrExpiresAt).toLocaleTimeString("en-PH", {
          hour: "numeric",
          minute: "2-digit",
        });

        context.fillStyle = "#EEF4EF";
        drawRoundedRect(context, 420, detailStartY - 8, 360, 58, 29);
        context.fill();
        context.fillStyle = forest;
        context.font = "700 22px Arial, sans-serif";
        context.fillText(`VALID UNTIL ${expiryLabel}`, 600, detailStartY + 28);
      }

      context.fillStyle = muted;
      context.font = "700 19px Arial, sans-serif";
      context.fillText("AMOUNT TO PAY", 600, detailStartY + 102);

      context.fillStyle = forestDark;
      context.font = "700 60px Georgia, serif";
      context.fillText(`₱${formatPeso(totalAmount)}`, 600, detailStartY + 176);

      context.fillStyle = line;
      context.fillRect(170, detailStartY + 226, 860, 1);

      context.fillStyle = muted;
      context.font = "700 18px Arial, sans-serif";
      context.fillText("ORDER REFERENCE", 600, detailStartY + 280);

      context.fillStyle = ink;
      context.font = "700 30px monospace";
      context.fillText(orderReference || "—", 600, detailStartY + 330);

      /*
       * Keep the order notice completely inside the main payment
       * card and reserve a separate footer area below the card.
       */
      const noticeY = 1560;

      context.fillStyle = "#F1ECE1";
      drawRoundedRect(context, 150, noticeY, 900, 92, 24);
      context.fill();

      context.fillStyle = forest;
      context.font = "700 20px Arial, sans-serif";
      context.fillText(
        "1-time dynamic QR • specific to this order • do not share publicly",
        600,
        noticeY + 56,
      );

      /*
       * Dedicated footer area — outside the rounded ivory card.
       * This prevents the overlap visible in the previous download.
       */
      const footerLineY = 1760;

      context.fillStyle = line;
      context.fillRect(170, footerLineY, 860, 1);

      context.fillStyle = muted;
      context.font = "400 20px Arial, sans-serif";
      context.fillText(
        "Secure payment powered by PayMongo",
        600,
        footerLineY + 58,
      );

      context.fillStyle = muted;
      context.font = "400 18px Arial, sans-serif";
      context.fillText(
        "verdebyrenzo.com",
        600,
        footerLineY + 98,
      );

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => {
          if (result) {
            resolve(result);
          } else {
            reject(new Error("Unable to create QR image."));
          }
        }, "image/png");
      });

      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `verde-by-renzo-qr-${safeReference}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
      }, 1500);
    } catch (error) {
      console.error("Unable to download branded QR code:", error);
      window.open(qrCodeImage, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/65 px-3 py-4 backdrop-blur-sm sm:px-4 sm:py-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="verde-payment-title"
        className="relative flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[#d9d1c2] bg-[#f9f6ef] shadow-2xl lg:flex-row"
      >
        <button
          type="button"
          onClick={paymentStatus === "paid" && onPaymentDone ? onPaymentDone : onClose}
          disabled={isProcessing}
          aria-label="Close payment"
          className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white/95 text-[#233128] shadow-sm transition-all hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-50 sm:right-4 sm:top-4"
        >
          <X size={18} />
        </button>

        <div className="max-h-[42vh] overflow-y-auto bg-[#f4f0e7] p-4 sm:p-5 lg:max-h-[94vh] lg:w-[52%] lg:p-7">
          <div className="mb-4 pr-10">
            <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.28em] text-[#ad8437]">
              Verde by Renzo
            </p>

            <h2 id="verde-payment-title" className="font-serif text-2xl text-[#17251c] sm:text-3xl">
              Complete your order
            </h2>

            <p className="mt-1 text-xs text-gray-500">Review your items before payment.</p>
          </div>

          <div className="space-y-2">
            {cart.map((item) => {
              const product = getProductById(item.id);

              if (!product) {
                return null;
              }

              const productImage = getProductImage(product, item.color);
              const subtotal = product.price * item.quantity;

              const details = [
                getColorDisplay(item.color),
                item.size ? `Size ${item.size}` : null,
                item.hand ? getGloveHandDisplay(item.hand) : null,
                `Qty ${item.quantity}`,
              ].filter(Boolean);

              return (
                <div
                  key={`${item.id}-${item.color}-${item.size || "no-size"}-${item.hand || "no-hand"}`}
                  className="flex min-h-[62px] items-center gap-2.5 rounded-lg border border-[#e2dbcf] bg-white/80 p-2"
                >
                  <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md bg-[#ebe6dd]">
                    {productImage ? (
                      <Image
                        src={productImage}
                        alt={`${product.name} - ${getColorDisplay(item.color)}`}
                        fill
                        sizes="48px"
                        className="object-cover object-center"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center px-1 text-center text-[9px] text-gray-400">
                        No image
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate text-[13px] font-semibold leading-4 text-[#17251c]">
                          {product.name}
                        </h3>

                        <p className="mt-1 line-clamp-1 text-[10px] leading-4 text-gray-500">
                          {details.join(" • ")}
                        </p>
                      </div>

                      <span className="whitespace-nowrap text-xs font-semibold text-[#23472f]">
                        ₱{subtotal.toLocaleString("en-PH")}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 border-t border-[#d6cec0] pt-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">Total</p>
                <p className="mt-1 text-[10px] leading-4 text-gray-400">Final amount verified before QR generation.</p>
              </div>

              <p className="whitespace-nowrap font-serif text-xl font-semibold text-[#17251c] sm:text-2xl">
                ₱{formatPeso(totalAmount)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-white p-5 sm:p-7 lg:max-h-[94vh] lg:p-8">
          <div className="pr-10">
            <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.25em] text-[#ad8437]">Secure payment</p>

            <h3 className="font-serif text-2xl text-[#17251c]">
              {paymentStatus === "paid"
                ? "Payment successful"
                : paymentStatus === "failed"
                  ? "Payment failed"
                  : qrCodeImage
                    ? "Scan to pay"
                    : "Choose how to pay"}
            </h3>

            <p className="mt-1.5 text-xs leading-5 text-gray-500 sm:text-sm">
              {paymentStatus === "paid"
                ? "Your payment was confirmed and the order has been created."
                : paymentStatus === "failed"
                  ? "The payment was not completed. You can safely try again with a new QR."
                  : qrCodeImage
                    ? "Scan the QR with Maya, GCash, or a supported banking app."
                    : "Complete your purchase securely through PayMongo."}
            </p>
          </div>

          {paymentStatus === "paid" ? (
            <div className="mt-5">
              <div className="rounded-2xl border border-green-200 bg-green-50/70 p-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700">
                  <BadgeCheck size={30} />
                </div>

                <p className="mt-4 text-[9px] font-semibold uppercase tracking-[0.25em] text-green-700">Payment confirmed</p>

                <h4 className="mt-2 font-serif text-2xl text-[#17251c]">Thank you</h4>

                <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-gray-600">
                  PayMongo confirmed the payment. Your Verde by Renzo order is now saved and ready for processing.
                </p>

                {orderReference && (
                  <div className="mx-auto mt-4 max-w-sm rounded-lg bg-white/80 px-3 py-2.5">
                    <p className="text-[8px] font-semibold uppercase tracking-[0.2em] text-gray-400">Order Reference</p>
                    <p className="mt-1 break-all font-mono text-xs font-semibold text-[#25362a]">{orderReference}</p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={onPaymentDone}
                  className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-[#173924] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#214d31]"
                >
                  Done
                </button>
              </div>
            </div>
          ) : paymentStatus === "failed" ? (
            <div className="mt-5">
              <div className="rounded-2xl border border-red-200 bg-red-50/70 p-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-700">
                  <XCircle size={30} />
                </div>

                <p className="mt-4 text-[9px] font-semibold uppercase tracking-[0.25em] text-red-700">
                  Payment unsuccessful
                </p>

                <h4 className="mt-2 font-serif text-2xl text-[#17251c]">
                  Payment failed
                </h4>

                <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-gray-600">
                  {paymentError ||
                    "Your payment could not be completed. No successful payment was recorded for this order."}
                </p>

                {orderReference && (
                  <div className="mx-auto mt-4 max-w-sm rounded-lg bg-white/80 px-3 py-2.5">
                    <p className="text-[8px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                      Payment Reference
                    </p>
                    <p className="mt-1 break-all font-mono text-xs font-semibold text-[#25362a]">
                      {orderReference}
                    </p>
                  </div>
                )}

                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex w-full items-center justify-center rounded-xl border border-[#d9d1c2] bg-white px-5 py-3 text-sm font-semibold text-[#37483c] transition-colors hover:bg-[#f8f6f1]"
                  >
                    Close
                  </button>

                  <button
                    type="button"
                    onClick={onBackToPaymentMethods}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#173924] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#214d31]"
                  >
                    <RefreshCcw size={15} />
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          ) : qrCodeImage ? (
            <div className="mt-5">
              <div className="rounded-2xl border border-[#d9d1c2] bg-[#fffdf8] p-4 text-center sm:p-5">
                <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-[#ad8437]">QR Ph Payment</p>

                <div className="relative mx-auto mt-4 flex w-fit items-center justify-center overflow-hidden rounded-xl border border-[#e5ded0] bg-white p-3 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrCodeImage}
                    alt="PayMongo QR Ph payment code"
                    className={`h-52 w-52 max-w-full object-contain transition-opacity sm:h-56 sm:w-56 ${isQrExpired ? "opacity-20" : ""}`}
                  />

                  {isQrExpired && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 px-4 text-center backdrop-blur-[1px]">
                      <Clock3 size={24} className="text-red-600" />
                      <p className="mt-2 text-sm font-bold uppercase tracking-[0.14em] text-red-700">QR expired</p>
                      <p className="mt-1 max-w-[180px] text-[10px] leading-4 text-gray-600">Generate a new QR before completing payment.</p>
                    </div>
                  )}
                </div>

                {remainingSeconds !== null && (
                  <div
                    className={`mx-auto mt-3 flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold ${
                      isQrExpired
                        ? "bg-red-50 text-red-700"
                        : remainingSeconds <= 300
                          ? "bg-amber-50 text-amber-800"
                          : "bg-[#eef4ef] text-[#23472f]"
                    }`}
                  >
                    <Clock3 size={14} />
                    {isQrExpired ? <span>QR expired</span> : <span>Expires in {formatCountdown(remainingSeconds)}</span>}
                  </div>
                )}

                <button
                  type="button"
                  onClick={downloadQrCode}
                  disabled={isQrExpired}
                  className="mx-auto mt-3 inline-flex items-center justify-center gap-2 rounded-lg border border-[#cbb37a] bg-white px-4 py-2 text-xs font-semibold text-[#23472f] transition-all hover:border-[#a98232] hover:bg-[#fbf7ed] disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <Download size={15} />
                  {isQrExpired ? "QR Expired" : "Download QR Code"}
                </button>

                {isQrExpired && onBackToPaymentMethods && (
                  <button
                    type="button"
                    onClick={onBackToPaymentMethods}
                    className="mx-auto mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-[#173924] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#214d31]"
                  >
                    <RefreshCcw size={14} />
                    Generate New QR
                  </button>
                )}

                {isLocalTest && (
                  <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-left">
                    <div className="flex gap-2.5">
                      <FlaskConical size={17} className="mt-0.5 flex-shrink-0 text-amber-700" />

                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-amber-900">Localhost test payment</p>
                        <p className="mt-1 text-[10px] leading-4 text-amber-800">
                          Do not scan this test QR with Maya or GCash. Use PayMongo&apos;s test page below to simulate success or failure.
                        </p>
                      </div>
                    </div>

                    {testPaymentUrl ? (
                      <button
                        type="button"
                        onClick={() => {
                          window.open(testPaymentUrl, "_blank", "noopener,noreferrer");
                        }}
                        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-900 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-amber-800"
                      >
                        <ExternalLink size={14} />
                        Open PayMongo Test Payment
                      </button>
                    ) : (
                      <p className="mt-2 text-[10px] text-amber-700">PayMongo did not return a test URL for this QR.</p>
                    )}
                  </div>
                )}

                <div className="mt-4">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-gray-400">Amount to pay</p>
                  <p className="mt-1 font-serif text-3xl font-semibold text-[#173924]">₱{formatPeso(totalAmount)}</p>
                </div>

                {orderReference && (
                  <div className="mt-4 rounded-lg bg-[#f4f0e7] px-3 py-2.5">
                    <p className="text-[8px] font-semibold uppercase tracking-[0.2em] text-gray-400">Order Reference</p>
                    <p className="mt-1 break-all font-mono text-xs font-semibold text-[#25362a]">{orderReference}</p>
                  </div>
                )}

                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#435348]">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#b89445] opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#b89445]" />
                  </span>
                  {isQrExpired
                    ? "Payment QR expired"
                    : paymentStatus === "processing"
                      ? "Processing payment..."
                      : "Waiting for payment..."}
                </div>

                <div className="mt-3 flex items-start gap-2 rounded-lg bg-white/70 px-3 py-2.5 text-left">
                  <Smartphone size={15} className="mt-0.5 flex-shrink-0 text-[#1d5a35]" />
                  <p className="text-[10px] leading-4 text-gray-500">
                    Paying on this phone? Download the branded Verde QR card first, save it to Files or Photos, then open your payment app and import or scan the saved image.
                  </p>
                </div>
              </div>

              {onBackToPaymentMethods && (
                <button
                  type="button"
                  onClick={onBackToPaymentMethods}
                  disabled={isProcessing}
                  className="mt-3 w-full rounded-xl border border-[#d9d1c2] bg-white px-4 py-2.5 text-xs font-semibold text-[#37483c] transition-colors hover:bg-[#f8f6f1] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Choose another payment method
                </button>
              )}
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              <button
                type="button"
                disabled={isProcessing}
                onClick={onPayWithQrPh}
                className="group flex w-full items-center gap-3 rounded-xl border border-[#cbb37a] bg-[#fffdf8] p-3.5 text-left transition-all hover:border-[#a98232] hover:bg-[#fbf7ed] hover:shadow-sm disabled:cursor-wait disabled:opacity-60"
              >
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#173924] text-white">
                  <QrCode size={21} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#17251c]">QR Ph</p>
                  <p className="mt-0.5 text-[11px] leading-4 text-gray-500">Maya, GCash, or supported banking apps.</p>
                </div>

                <span className="text-[10px] font-semibold text-[#ad8437]">Recommended</span>
              </button>

              <button
                type="button"
                disabled={isProcessing || !mayaEnabled}
                onClick={onPayWithMaya}
                className={`flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-all ${
                  mayaEnabled
                    ? "border-[#d9d1c2] bg-white hover:border-[#a98232] hover:bg-[#fbf7ed]"
                    : "cursor-not-allowed border-gray-200 bg-gray-50 opacity-60"
                }`}
              >
                <div
                  className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${
                    mayaEnabled ? "bg-[#17251c] text-white" : "bg-gray-200 text-gray-500"
                  }`}
                >
                  <WalletCards size={21} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#17251c]">Maya</p>
                  <p className="mt-0.5 text-[11px] leading-4 text-gray-500">
                    {mayaEnabled
                      ? "Continue securely using your Maya account."
                      : "Direct Maya payments are not yet enabled."}
                  </p>
                </div>
              </button>
            </div>
          )}

          {paymentError && paymentStatus !== "failed" && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700">
              {paymentError}
            </div>
          )}

          <div className="mt-5 flex items-start gap-3 rounded-xl bg-[#f7f5ef] p-3.5">
            <ShieldCheck size={18} className="mt-0.5 flex-shrink-0 text-[#1d5a35]" />

            <div>
              <p className="text-xs font-semibold text-[#27372d]">Secure payment</p>
              <p className="mt-1 text-[10px] leading-4 text-gray-500">
                Payment is processed by PayMongo. Verde by Renzo never stores your payment credentials.
              </p>
            </div>
          </div>

          {isProcessing && (
            <div className="mt-4 flex items-center justify-center gap-3 rounded-xl border border-[#e4dccd] bg-[#fffdf8] px-4 py-3 text-xs text-[#36473c]">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#c59b48] border-t-transparent" />
              Preparing secure payment...
            </div>
          )}

          <div className="mt-auto pt-5 text-center">
            <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400">
              <CreditCard size={13} />
              <span>Payments powered by PayMongo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
