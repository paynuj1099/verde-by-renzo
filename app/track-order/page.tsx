"use client";

import { FormEvent, useEffect, useState } from "react";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import { PackageSearch, Search, Truck } from "lucide-react";
import { firestore } from "@/lib/firebase";

type GuestOrder = {
  reference: string;
  status: string;
  totalItems: number;
  totalAmount: number;
  createdAt?: Timestamp;
  carrier?: string;
  trackingNumber?: string;
  trackingNote?: string;
};

export default function TrackOrderPage() {
  const [reference, setReference] = useState("");
  const [order, setOrder] = useState<GuestOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const lookup = async (value: string) => {
    const normalized = value.trim().toUpperCase();
    if (!normalized) return;
    setLoading(true);
    setError("");
    setOrder(null);
    try {
      const snapshot = await getDoc(doc(firestore, "guestOrders", normalized));
      if (!snapshot.exists())
        throw new Error("We could not find an order with that reference.");
      setOrder(snapshot.data() as GuestOrder);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to check this order.",
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("reference");
    if (value) {
      setReference(value);
      lookup(value);
    }
  }, []);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    lookup(reference);
  };
  return (
    <main className="min-h-screen bg-gradient-to-br from-forest-50 to-white px-4 pb-16 pt-32">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl bg-white p-6 shadow-xl sm:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-forest-50 text-forest-700">
            <PackageSearch size={27} />
          </div>
          <h1 className="mt-4 text-center font-serif text-3xl text-forest-900">
            Track a guest order
          </h1>
          <p className="mx-auto mt-2 max-w-md text-center text-sm text-gray-500">
            Enter the reference shown after checkout to view the latest order
            and shipping status.
          </p>
          <form
            onSubmit={submit}
            className="mt-7 flex flex-col gap-3 sm:flex-row"
          >
            <input
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              placeholder="VBR-..."
              className="min-w-0 flex-1 rounded-lg border px-4 py-3 font-mono uppercase"
            />
            <button
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-forest-700 px-5 py-3 font-semibold text-white disabled:opacity-50"
            >
              <Search size={17} />
              {loading ? "Checking..." : "Track order"}
            </button>
          </form>
          {error && (
            <p className="mt-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">
              {error}
            </p>
          )}
          {order && (
            <section className="mt-6 rounded-xl border border-forest-100 bg-forest-50 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-500">
                    Reference
                  </p>
                  <p className="font-mono font-bold text-forest-900">
                    {order.reference}
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold uppercase text-forest-700">
                  {order.status}
                </span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4 border-t border-forest-100 pt-4 text-sm">
                <div>
                  <p className="text-gray-500">Items</p>
                  <p className="font-semibold">{order.totalItems}</p>
                </div>
                <div>
                  <p className="text-gray-500">Total</p>
                  <p className="font-semibold">
                    ₱{Number(order.totalAmount || 0).toLocaleString("en-PH")}
                  </p>
                </div>
              </div>
              <div className="mt-4 rounded-lg bg-white p-4">
                <p className="flex items-center gap-2 font-semibold text-forest-800">
                  <Truck size={17} />
                  Shipment tracking
                </p>
                {order.trackingNumber ? (
                  <>
                    <p className="mt-2 text-sm">
                      <span className="text-gray-500">
                        {order.carrier || "Carrier"}:
                      </span>{" "}
                      {order.trackingNumber}
                    </p>
                    {order.trackingNote && (
                      <p className="mt-2 text-xs text-gray-600">
                        {order.trackingNote}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="mt-2 text-sm text-gray-500">
                    Tracking details will appear here once your order ships.
                  </p>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
