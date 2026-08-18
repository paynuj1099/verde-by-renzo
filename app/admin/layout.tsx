import AdminSidebar from '@/components/AdminSidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen bg-[#fbfaf7]"><AdminSidebar/><div className="min-w-0 flex-1">{children}</div></div>
}
