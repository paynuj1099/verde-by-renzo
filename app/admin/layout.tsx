import AdminSidebar from "@/components/AdminSidebar";
import AdminTutorial from "@/components/AdminTutorial";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-shell flex min-h-screen bg-[#ece9e1]">
      <AdminSidebar />
      <div className="min-w-0 flex-1 pt-16 [&>main]:min-h-[calc(100vh-4rem)] sm:pt-0 sm:[&>main]:min-h-screen">
        {children}
      </div>
      <AdminTutorial />
    </div>
  );
}
