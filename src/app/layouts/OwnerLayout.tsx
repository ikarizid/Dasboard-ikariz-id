import { Outlet, useNavigate, useLocation, Link } from "react-router";
import { getCurrentUser, logout } from "../lib/mock-data";
import { LayoutDashboard, Users, ShoppingCart, PlusCircle, LogOut, FileDigit, CreditCard } from "lucide-react";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import { ProtectedRoute } from "../components/ProtectedRoute";

function OwnerLayoutInner() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getCurrentUser();

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const menuItems = [
    { path: "/owner", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/owner/pembayaran", icon: CreditCard, label: "Pembayaran" },
    { path: "/owner/resellers", icon: Users, label: "Kelola Reseller" },
    { path: "/owner/orders", icon: ShoppingCart, label: "Semua Order" },
    { path: "/owner/new-order", icon: PlusCircle, label: "Tambah Order" },
    { path: "/owner/invoice-settings", icon: FileDigit, label: "Setting Invoice" },
  ];

  if (!user) return null;

  return (
    <div className="flex h-screen w-full relative">
      <aside className="w-64 glass-panel text-white flex flex-col z-10 shadow-2xl">
        <div className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="font-bold text-slate-900 text-xs">IK</span>
            </div>
            <div>
              <h1 className="font-bold text-sm leading-tight">Ikariz ID</h1>
              <p className="text-xs text-slate-300 leading-tight">Group Rekap</p>
              <p className="text-xs text-slate-500">Owner Dashboard</p>
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
                  isActive ? "bg-gradient-to-r from-[#ff4b5c]/20 to-transparent text-[#ff4b5c] border-l-2 border-[#ff4b5c] shadow-sm" : "text-white/70 hover:bg-white/10 hover:text-white"
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
            <span className="text-[10px] uppercase font-bold tracking-wider bg-[#ff4b5c]/20 text-[#ff4b5c] px-2 py-0.5 rounded-full mt-2 inline-block">Owner</span>
          </div>
          <Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-white/70 hover:bg-white/10 hover:text-white">
            <LogOut className="w-5 h-5 mr-3" />
            Keluar
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

export function OwnerLayout() {
  return (
    <ProtectedRoute allowedRole="owner">
      <OwnerLayoutInner />
    </ProtectedRoute>
  );
}