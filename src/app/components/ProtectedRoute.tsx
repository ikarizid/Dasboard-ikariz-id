import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { getCurrentUser } from "../lib/mock-data";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole: "owner" | "reseller";
}

export function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();

    if (!user) {
      sessionStorage.setItem("redirectAfterLogin", location.pathname);
      navigate("/", { replace: true });
      return;
    }

    if (user.role !== allowedRole) {
      if (user.role === "owner") navigate("/owner", { replace: true });
      else navigate("/reseller", { replace: true });
      return;
    }

    if (!user.active) {
      navigate("/", { replace: true });
      return;
    }

    setChecked(true);
  }, [navigate, location.pathname, allowedRole]);

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500">Memverifikasi akses...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}