import { Outlet, useNavigate, useLocation, Link } from "react-router";
import { getCurrentUser, logout } from "../lib/mock-data";
import { LayoutDashboard, ShoppingCart, PlusCircle, LogOut, Menu } from "lucide-react";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { useState } from "react";

function ResellerLayoutInner() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getCurrentUser();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const menuItems = [
    { path: "/reseller", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/reseller/orders", icon: ShoppingCart, label: "Order Saya" },
    { path: "/reseller/new-order", icon: PlusCircle, label: "Tambah Order" },
  ];

  if (!user) return null;

  return (
    <div className="flex h-screen w-full relative overflow-hidden">
      <aside className={`glass-panel text-white flex flex-col z-20 shadow-2xl transition-all duration-300 overflow-hidden ${isSidebarOpen ? "w-64" : "w-0"}`}>
        <div className="w-64 flex flex-col h-full shrink-0">
          <div className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="font-bold text-slate-900 text-xs">IK</span>
            </div>
            <div>
              <h1 className="font-bold text-sm leading-tight">Ikariz ID</h1>
              <p className="text-xs text-slate-300 leading-tight">Group Rekap</p>
              <p className="text-xs text-slate-500">Reseller Dashboard</p>
            </div>
          </div>
        </div>

        <Separator className="bg-white/10" />

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive ? "bg-gradient-to-r from-[#8b5cf6]/20 to-transparent text-[#8b5cf6] border-l-2 border-[#8b5cf6] shadow-sm" : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 space-y-4">
          <Separator className="bg-white/10" />
          <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/5">
            <p className="text-xs text-white/50">Logged in sebagai</p>
            <p className="font-medium text-sm text-white">{user.displayName}</p>
            <span className="text-[10px] uppercase font-bold tracking-wider bg-[#8b5cf6]/20 text-[#8b5cf6] px-2 py-0.5 rounded-full mt-2 inline-block">Reseller</span>
          </div>
          <Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-white/70 hover:bg-white/10 hover:text-white">
            <LogOut className="w-5 h-5 mr-3" />
            Keluar
          </Button>
        </div>
        </div>
      </aside>

      <main className="flex-1 relative flex flex-col min-w-0">
        <div className="absolute top-6 right-8 z-50">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="text-slate-500 hover:bg-slate-100 bg-white/80 backdrop-blur-md border border-slate-200 shadow-sm"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export function ResellerLayout() {
  return (
    <ProtectedRoute allowedRole="reseller">
      <ResellerLayoutInner />
    </ProtectedRoute>
  );
}