import AdminSidebar from "@/components/layout/AdminSidebar";
import AdminHeader from "@/components/layout/AdminHeader";
import PageTransition from "@/components/layout/PageTransition";
import AuthGuard from "@/components/auth/AuthGuard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-bg-app text-text-primary flex flex-col transition-colors duration-200">
        {/* Sidebar: Fixed Left */}
        <AdminSidebar />

        {/* Main Container */}
        <div className="flex-1 flex flex-col lg:pl-64 transition-all duration-300 min-w-0">
          {/* Top Header: Minimal Sticky Bar */}
          <AdminHeader />

          {/* Main Content Canvas: Background --bg-app */}
          <main className="flex-1 bg-bg-app p-4 sm:p-6 lg:p-8 min-w-0">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
