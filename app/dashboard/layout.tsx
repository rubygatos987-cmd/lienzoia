import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f7f5f2] text-stone-800 flex flex-col md:flex-row">
      <Sidebar />
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}