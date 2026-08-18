type AdminPageSkeletonProps = {
  variant?: "catalog" | "blogs" | "orders";
};

const Pulse = ({ className }: { className: string }) => (
  <div className={`rounded bg-gray-200 ${className}`} />
);

export default function AdminPageSkeleton({
  variant = "catalog",
}: AdminPageSkeletonProps) {
  return (
    <main
      className="min-h-screen animate-pulse bg-[#f4f7f2] py-6"
      aria-label="Loading admin page"
      aria-busy="true"
    >
      <div className="mx-auto w-full max-w-[1480px] px-5 lg:px-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <Pulse className="mb-3 h-3 w-24" />
            <Pulse className="mb-2 h-9 w-56" />
            <Pulse className="h-4 w-40" />
          </div>
          {variant !== "orders" && <Pulse className="h-11 w-28 rounded-lg" />}
        </div>
        <div className="rounded-2xl border bg-white p-4 sm:p-5">
          {variant === "orders" ? (
            <div>
              <div className="grid gap-3 sm:grid-cols-[1fr_220px_220px]">
                <Pulse className="h-11 w-full rounded-lg" />
                <Pulse className="h-11 w-full rounded-lg" />
                <Pulse className="h-11 w-full rounded-lg" />
              </div>
              <div className="mt-3 overflow-hidden rounded-xl border border-gray-100">
                {Array.from({ length: 5 }, (_, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 border-b border-gray-100 px-3 py-3 last:border-0"
                  >
                    <Pulse className="h-10 w-10 flex-none rounded-lg" />
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex gap-2">
                        <Pulse className="h-4 w-44" />
                        <Pulse className="h-4 w-16 rounded-full" />
                      </div>
                      <Pulse className="h-3 w-72 max-w-full" />
                    </div>
                    <div className="hidden items-end gap-4 sm:flex">
                      <Pulse className="h-3 w-20" />
                      <div>
                        <Pulse className="mb-2 h-4 w-20" />
                        <Pulse className="ml-auto h-3 w-12" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <Pulse className="h-11 w-full" />
              <div className="mt-4 space-y-3">
                {Array.from(
                  { length: variant === "blogs" ? 6 : 5 },
                  (_, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 rounded-xl bg-gray-50 p-3"
                    >
                      <Pulse
                        className={`${variant === "blogs" ? "h-16 w-24" : "h-14 w-14"} flex-none rounded-lg`}
                      />
                      <div className="flex-1">
                        <Pulse className="mb-2 h-4 w-52 max-w-full" />
                        <Pulse className="h-3 w-32" />
                      </div>
                      <div className="hidden gap-2 sm:flex">
                        <Pulse className="h-10 w-24 rounded-lg" />
                        <Pulse className="h-10 w-20 rounded-lg" />
                        <Pulse className="h-10 w-20 rounded-lg" />
                      </div>
                    </div>
                  ),
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
