import Sidebar from "@/components/CMS/Sidebar";

export default function CMSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <main className="sm:ml-64 min-w-0 flex-1 bg-canvas-surface">
        {children}
      </main>
    </div>
  );
}