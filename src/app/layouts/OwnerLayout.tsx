import { Outlet, useNavigate, useLocation, Link } from "react-router";
import { getCurrentUser, logout } from "../lib/mock-data";
import { LayoutDashboard, Users, ShoppingCart, PlusCircle, LogOut, FileDigit } from "lucide-react";
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
    { path: "/owner/resellers", icon: Users, label: "Kelola Reseller" },
    { path: "/owner/orders", icon: ShoppingCart, label: "Semua Order" },
    { path: "/owner/new-order", icon: PlusCircle, label: "Tambah Order" },
    { path: "/owner/invoice-settings", icon: FileDigit, label: "Setting Invoice" },
  ];

  if (!user) return null;

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
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

        <Separator className="bg-slate-800" />

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive ? "bg-white text-slate-900" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 space-y-3">
          <Separator className="bg-slate-800" />
          <div className="px-4 py-2">
            <p className="text-xs text-slate-400">Logged in sebagai</p>
            <p className="font-medium text-sm">{user.displayName}</p>
            <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full mt-1 inline-block">Owner</span>
          </div>
          <Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-slate-300 hover:bg-slate-800 hover:text-white">
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