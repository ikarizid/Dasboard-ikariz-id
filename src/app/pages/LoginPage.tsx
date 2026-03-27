import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { setCurrentUser, getCurrentUser } from "../lib/mock-data";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, UserPlus } from "lucide-react";

export function LoginPage() {
  const navigate = useNavigate();
  // We use "username" state but label it "Email atau Username"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        checkProfileAndRedirect(session.user.id);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        checkProfileAndRedirect(session.user.id);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  const checkProfileAndRedirect = async (userId: string) => {
    const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (profile) {
      if (!profile.active) {
        toast.error("Akun dinonaktifkan. Hubungi owner.");
        await supabase.auth.signOut();
        return;
      }
      
      // Keep using mock-data's setCurrentUser for compatibility with other parts 
      // of the app temporarily until we migrate them
      setCurrentUser({
        id: profile.id,
        username: profile.username,
        password: "",
        role: profile.role,
        displayName: profile.display_name,
        commissionRate: profile.commission_rate,
        active: profile.active
      });

      const redirect = sessionStorage.getItem("redirectAfterLogin");
      sessionStorage.removeItem("redirectAfterLogin");

      if (redirect && redirect.startsWith(`/${profile.role}`)) navigate(redirect, { replace: true });
      else if (profile.role === "owner") navigate("/owner", { replace: true });
      else navigate("/reseller", { replace: true });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Logic for owner vs reseller email mapping
      const emailToUse = username.includes("@") ? username : `${username}@ikariz.id`;

      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password: password,
      });

      if (error) {
        toast.error("Kredensial salah: " + error.message);
        setLoading(false);
        return;
      }
      
      // Profile checking will happen in onAuthStateChange
      toast.success("Berhasil masuk!");
    } catch (err: any) {
      toast.error("Terjadi kesalahan sistem");
      setLoading(false);
    }
  };

  const handleInitOwner = async () => {
    if(!username.includes("@") || password.length < 6) {
      toast.error("Isi form dengan Email dan Password (minimal 6 karakter) terlebih dahulu!");
      return;
    }
    
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: username,
      password: password,
    });
    
    if (error) {
      toast.error("Gagal buat akun: " + error.message);
    } else if (data.user) {
      // Create profile for owner
      await supabase.from("profiles").upsert({
        id: data.user.id,
        username: "owner_admin",
        role: "owner",
        display_name: "Administrator",
        active: true
      });
      toast.success("Akun Owner berhasil dibuat! Silahkan login ulang.");
    }
    setLoading(false);
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
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Masuk Aplikasi</h2>
            <p className="text-slate-500 text-sm mt-1">Gunakan Email (Owner) / Username (Reseller)</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username">Email / Username</Label>
              <Input id="username" type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="email@domain.com atau awit123" required autoComplete="username" />
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
            
            <div className="pt-2">
              <Button type="button" variant="outline" className="w-full h-11 text-xs" onClick={handleInitOwner} disabled={loading}>
                <UserPlus className="w-3 h-3 mr-2" />
                Developer: Buat Akun Owner Pertama ({username || '...'})
              </Button>
            </div>
          </form>

          <p className="text-center text-xs text-slate-400">© 2026 Ikariz ID · Semua hak dilindungi</p>
        </div>
      </div>
    </div>
  );
}