"use client";

import { useEffect, useState } from "react";

import Image from "next/image";
import Link from "next/link";

import { useCart } from "@/context/CartContext";

import {
  getColorClass,
  getColorDisplay,
  getProductById,
  getProductImage,
} from "@/lib/productUtils";

import { getGloveHandDisplay } from "@/data/productOptions";

import {
  AlertTriangle,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartModal({ isOpen, onClose }: CartModalProps) {
  const { cart, updateQuantity, removeFromCart, clearCart, getCartTotal } =
    useCart();

  const [showClearConfirmation, setShowClearConfirmation] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  /*
   * ============================
   * CLEAR CART
   * ============================
   */
  const handleRequestClearCart = () => {
    setShowClearConfirmation(true);
  };

  const handleCancelClearCart = () => {
    setShowClearConfirmation(false);
  };

  const handleConfirmClearCart = () => {
    clearCart();

    setShowClearConfirmation(false);
  };

  /*
   * ============================
   * CLOSE CART
   * ============================
   */
  const handleCloseCart = () => {
    setShowClearConfirmation(false);

    onClose();
  };

  return (
    <>
      {/* BACKDROP */}
      <div
        className="fixed inset-0 z-[990] bg-black/50 transition-opacity"
        onClick={handleCloseCart}
      />

      {/* CART SIDEBAR */}
      <div className="fixed right-0 top-0 z-[1000] flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl sm:w-96">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-[#c9a24f]/25 bg-[#111914] px-5 py-4 text-[#f5ecdd] sm:px-6 sm:py-5">
          <div>
            <p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.25em] text-[#c9a24f]">
              Your selection
            </p>
            <h2 className="font-serif text-2xl">Shopping Bag</h2>
          </div>

          <div className="flex items-center gap-3">
            {cart.length > 0 && (
              <button
                type="button"
                onClick={handleRequestClearCart}
                className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-[#c8a85f] transition-colors hover:text-[#f0ce7d]"
                aria-label="Clear all cart items"
              >
                <Trash2 size={15} />
                Clear All
              </button>
            )}

            <button
              type="button"
              onClick={handleCloseCart}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-[#d8d0c2] transition-all hover:border-[#c9a24f]/50 hover:bg-white/5 hover:text-[#e4bc65]"
              aria-label="Close cart"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* ITEMS */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <ShoppingCart
                size={64}
                className="mb-4 text-gray-300"
                strokeWidth={1}
              />

              <p className="mb-6 text-gray-500">Your cart is empty</p>

              <Link
                href="/shop"
                onClick={handleCloseCart}
                className="rounded-lg bg-[#111914] px-6 py-2.5 text-[#e0b65f] transition-colors hover:bg-[#1b2920] hover:text-[#edca7b]"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => {
                const product = getProductById(item.id);

                if (!product) {
                  return null;
                }

                const image = getProductImage(product, item.color);

                return (
                  <div
                    key={`${item.id}-${item.color}-${item.size || "no-size"}-${item.hand || "no-hand"}`}
                    className="flex gap-4 rounded-lg bg-gray-50 p-4"
                  >
                    {/* IMAGE */}
                    <Link
                      href={`/shop/${product.id}?color=${item.color}`}
                      onClick={handleCloseCart}
                      className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-gray-200"
                    >
                      {image ? (
                        <Image
                          src={image}
                          alt={`${product.name} - ${getColorDisplay(
                            item.color,
                          )}`}
                          fill
                          className="object-cover object-center"
                          sizes="80px"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
                          No Image
                        </div>
                      )}
                    </Link>

                    {/* INFO */}
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/shop/${product.id}?color=${item.color}`}
                        onClick={handleCloseCart}
                      >
                        <h3 className="mb-1 truncate text-sm font-medium text-gray-900 transition-colors hover:text-forest-600">
                          {product.name}
                        </h3>
                      </Link>

                      {/* COLOR */}
                      <div className="mb-2 flex items-center gap-2">
                        <span
                          className={`h-3.5 w-3.5 flex-shrink-0 rounded-full border border-gray-300 ${getColorClass(
                            item.color,
                          )}`}
                        />

                        <span className="text-xs text-gray-500">
                          {getColorDisplay(item.color)}
                        </span>
                      </div>

                      {(item.size || item.hand) && (
                        <div className="mb-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                          {item.size && (
                            <span>
                              Size:{" "}
                              <strong className="font-medium text-gray-700">
                                {item.size}
                              </strong>
                            </span>
                          )}

                          {item.hand && (
                            <span>
                              Glove Hand:{" "}
                              <strong className="font-medium text-gray-700">
                                {getGloveHandDisplay(item.hand)}
                              </strong>
                            </span>
                          )}
                        </div>
                      )}

                      {/* PRICE */}
                      <p className="text-sm font-semibold text-forest-600">
                        ₱{product.price.toLocaleString("en-PH")}
                      </p>

                      {/* QUANTITY */}
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              item.color,
                              item.quantity - 1,
                              item.size,
                              item.hand,
                            )
                          }
                          className="flex h-7 w-7 items-center justify-center rounded border border-gray-300 transition-colors hover:bg-gray-100"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={14} />
                        </button>

                        <span className="w-8 text-center text-sm font-medium">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              item.color,
                              item.quantity + 1,
                              item.size,
                              item.hand,
                            )
                          }
                          className="flex h-7 w-7 items-center justify-center rounded border border-gray-300 transition-colors hover:bg-gray-100"
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            removeFromCart(
                              item.id,
                              item.color,
                              item.size,
                              item.hand,
                            )
                          }
                          className="ml-auto flex h-7 w-7 items-center justify-center text-red-500 transition-colors hover:text-red-600"
                          aria-label={`Remove ${product.name} from cart`}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* FOOTER */}
        {cart.length > 0 && (
          <div className="space-y-4 border-t border-gray-200 bg-white p-4 sm:p-6">
            <div className="flex items-center justify-between text-lg font-semibold">
              <span className="text-gray-700">Subtotal:</span>

              <span className="text-forest-600">
                ₱{getCartTotal().toLocaleString("en-PH")}
              </span>
            </div>

            <Link
              href="/checkout"
              onClick={handleCloseCart}
              className="block w-full rounded-lg bg-[#111914] py-3 text-center font-semibold text-[#e0b65f] transition-colors hover:bg-[#1b2920] hover:text-[#edca7b]"
            >
              Proceed to Checkout
            </Link>

            <Link
              href="/shop"
              onClick={handleCloseCart}
              className="block w-full text-center text-sm text-forest-600 transition-colors hover:text-forest-700"
            >
              Continue Shopping
            </Link>
          </div>
        )}

        {/* CLEAR CONFIRMATION */}
        {showClearConfirmation && (
          <div
            className="absolute inset-0 z-[70] flex items-center justify-center bg-black/35 p-5 backdrop-blur-[2px]"
            onClick={handleCancelClearCart}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="clear-cart-title"
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-[320px] overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <div className="px-6 pt-7 pb-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
                  <AlertTriangle size={26} className="text-red-500" />
                </div>

                <h3
                  id="clear-cart-title"
                  className="mb-2 font-serif text-xl font-semibold text-gray-900"
                >
                  Clear your cart?
                </h3>

                <p className="mx-auto max-w-[250px] text-sm leading-6 text-gray-500">
                  This will remove all items from your shopping cart. This
                  action cannot be undone.
                </p>
              </div>

              <div className="grid grid-cols-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCancelClearCart}
                  className="border-r border-gray-100 px-4 py-4 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleConfirmClearCart}
                  className="px-4 py-4 text-sm font-semibold text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  Clear Cart
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
