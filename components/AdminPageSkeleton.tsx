type AdminPageSkeletonProps = {
  variant?: "catalog" | "blogs" | "orders";
};

const Pulse = ({ className }: { className: string }) => (
  <div className={`rounded bg-gray-200 ${className}`} />
);

export default function AdminPageSkeleton({ variant = "catalog" }: AdminPageSkeletonProps) {
  return (
    <main className="min-h-screen animate-pulse bg-[#f4f7f2] py-7" aria-label="Loading admin page" aria-busy="true">
      <div className="mx-auto w-full max-w-[1480px] px-5 lg:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div><Pulse className="mb-3 h-3 w-28" /><Pulse className="mb-2 h-9 w-64" /><Pulse className="h-4 w-44" /></div>
          <Pulse className="h-12 w-36" />
        </div>
        <div className="rounded-2xl border bg-white p-4 sm:p-6">
          <Pulse className="h-11 w-full" />
          {variant === "orders" ? (
            <div className="mt-5 flex gap-4 overflow-hidden">{[0, 1, 2, 3].map((column) => <div key={column} className="h-[470px] w-[285px] flex-none rounded-xl bg-gray-100 p-3"><div className="mb-4 flex justify-between"><Pulse className="h-5 w-24"/><Pulse className="h-6 w-7 rounded-full"/></div>{[0, 1, 2].map((card) => <Pulse key={card} className="mb-3 h-32 w-full rounded-xl"/>)}</div>)}</div>
          ) : (
            <div className="mt-5 space-y-3">{Array.from({ length: variant === "blogs" ? 6 : 5 }, (_, index) => <div key={index} className="flex items-center gap-4 rounded-xl bg-gray-50 p-3"><Pulse className={`${variant === "blogs" ? "h-16 w-24" : "h-14 w-14"} flex-none rounded-lg`}/><div className="flex-1"><Pulse className="mb-2 h-4 w-52 max-w-full"/><Pulse className="h-3 w-32"/></div><div className="hidden gap-2 sm:flex"><Pulse className="h-10 w-24 rounded-lg"/><Pulse className="h-10 w-20 rounded-lg"/><Pulse className="h-10 w-20 rounded-lg"/></div></div>)}</div>
          )}
        </div>
      </div>
    </main>
  );
}
