export default function AdminDashboardSkeleton() {
  return <main className="min-h-screen animate-pulse bg-[#fbfaf7] p-4 sm:p-6 xl:p-8" aria-label="Loading admin dashboard">
    <div className="mb-8 flex items-center justify-between"><div><div className="mb-3 h-3 w-28 rounded bg-[#e9dfcb]"/><div className="h-9 w-44 rounded bg-gray-200"/></div><div className="hidden h-12 w-80 rounded-xl bg-gray-200 md:block"/></div>
    <div className="mb-5 h-9 rounded-lg bg-[#f1e8d7]"/>
    <div className="grid gap-4 md:grid-cols-3">{[0,1,2].map((item) => <div key={item} className="h-36 rounded-2xl bg-gray-200"/>)}</div>
    <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,.8fr)]"><div className="h-[420px] rounded-2xl bg-gray-200"/><div className="h-[420px] rounded-2xl bg-gray-200"/></div>
    <div className="mt-5 grid gap-5 lg:grid-cols-[.8fr_1.5fr_1fr]">{[0,1,2].map((item) => <div key={item} className="h-72 rounded-2xl bg-gray-200"/>)}</div>
  </main>
}
