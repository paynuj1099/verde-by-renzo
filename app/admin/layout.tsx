import AdminSidebar from "@/components/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-shell flex min-h-screen bg-[#ece9e1]">
      <AdminSidebar />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
