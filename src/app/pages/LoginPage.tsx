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
    <div className="min-h-screen flex items-center justify-center relative p-6 w-full">
      <div className="w-full max-w-md glass-panel z-10 rounded-[2rem] p-10 shadow-2xl space-y-8 animate-in fade-in zoom-in-95 duration-500 border border-white/10">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-gradient-to-tr from-[#ff4b5c] to-[#ff95ac] rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-[#ff4b5c]/30 mb-6">
            <span className="font-black text-white text-2xl">IK</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Ikariz ID</h1>
          <p className="text-white/60 text-sm">Masuk log ke dashboard Anda</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-white/80">Email / Username</Label>
            <Input 
              id="username" 
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              placeholder="email@domain.com / reseller123" 
              required 
              autoComplete="username" 
              className="bg-black/20 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#ff4b5c]/50 h-12 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-white/80">Password</Label>
            <div className="relative">
              <Input 
                id="password" 
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="••••••••" 
                required 
                className="pr-10 bg-black/20 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#ff4b5c]/50 h-12 rounded-xl" 
                autoComplete="current-password" 
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" className="w-full h-12 text-base font-semibold mt-4 rounded-xl shadow-xl hover:shadow-2xl transition-all" disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Masuk...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Masuk ke Dashboard
              </span>
            )}
          </Button>
          
          <div className="pt-4">
            <Button type="button" variant="outline" className="w-full h-12 text-xs rounded-xl border-white/10 hover:bg-white/5 active:bg-white/10" onClick={handleInitOwner} disabled={loading}>
              <UserPlus className="w-4 h-4 mr-2 text-[#ff4b5c]" />
              Setup Owner ({username || '...'})
            </Button>
          </div>
        </form>

        <p className="text-center text-xs text-white/40 pt-4">© 2026 Ikariz ID · Group Rekap</p>
      </div>
    </div>
  );
}