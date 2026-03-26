import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { getUsers, setCurrentUser, getCurrentUser } from "../lib/mock-data";
import { toast } from "sonner";
import { Eye, EyeOff, Lock } from "lucide-react";

export function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      if (user.role === "owner") navigate("/owner", { replace: true });
      else navigate("/reseller", { replace: true });
    }
  }, [navigate]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      const users = getUsers();
      const user = users.find(u => u.username === username && u.password === password);

      if (!user) {
        toast.error("Username atau password salah");
        setLoading(false);
        return;
      }

      if (!user.active) {
        toast.error("Akun ini telah dinonaktifkan. Hubungi owner.");
        setLoading(false);
        return;
      }

      setCurrentUser(user);
      toast.success(`Selamat datang, ${user.displayName}!`);

      const redirect = sessionStorage.getItem("redirectAfterLogin");
      sessionStorage.removeItem("redirectAfterLogin");

      if (redirect && redirect.startsWith(`/${user.role}`)) navigate(redirect, { replace: true });
      else if (user.role === "owner") navigate("/owner", { replace: true });
      else navigate("/reseller", { replace: true });

      setLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      <div className="hidden lg:flex w-1/2 bg-slate-900 flex-col items-center justify-center p-12 text-white">
        <div className="max-w-sm text-center space-y-6">
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto">
            <span className="font-black text-slate-900 text-2xl">IK</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold">Ikariz ID</h1>
            <p className="text-slate-400 mt-1">Group Rekap</p>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed">
            Platform manajemen order dan rekap bisnis joki tugas & skripsi terpercaya.
          </p>
          <div className="grid grid-cols-2 gap-4 text-left mt-8">
            {[
              { label: "Rekap Order", desc: "Semua order tercatat rapi" },
              { label: "Multi Reseller", desc: "Kelola tim reseller kamu" },
              { label: "Auto Faktur", desc: "Nota otomatis tiap order" },
              { label: "Rekap Komisi", desc: "Pantau hutang komisi" },
            ].map(f => (
              <div key={f.label} className="bg-slate-800 rounded-lg p-3">
                <p className="text-xs font-semibold text-white">{f.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden text-center">
            <div className="w-14 h-14 bg-slate-900 rounded-xl flex items-center justify-center mx-auto mb-3">
              <span className="font-black text-white text-lg">IK</span>
            </div>
            <h1 className="font-bold text-xl text-slate-900">Ikariz ID Group Rekap</h1>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900">Masuk</h2>
            <p className="text-slate-500 text-sm mt-1">Masukkan kredensial akun kamu</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Masukkan username" required autoComplete="username" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Masukkan password" required className="pr-10" autoComplete="current-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 h-11" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Memproses...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Masuk ke Dashboard
                </span>
              )}
            </Button>
          </form>

          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 text-sm space-y-2">
            <p className="font-medium text-slate-700 text-xs uppercase tracking-wide">Demo Akun</p>
            <div className="space-y-1 text-slate-500 text-xs">
              <p>Owner &nbsp;&nbsp;→ <code className="bg-white px-1.5 py-0.5 rounded border text-slate-700">owner</code> / <code className="bg-white px-1.5 py-0.5 rounded border text-slate-700">owner123</code></p>
              <p>Reseller → <code className="bg-white px-1.5 py-0.5 rounded border text-slate-700">reseller1</code> / <code className="bg-white px-1.5 py-0.5 rounded border text-slate-700">reseller123</code></p>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400">© 2026 Ikariz ID · Semua hak dilindungi</p>
        </div>
      </div>
    </div>
  );
}