import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, Lock, User, Heart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/safespace/loginHere")({
  component: AdminLoginPage,
  head: () => ({ meta: [{ title: "Super Admin Login · Safe Space" }] }),
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Use the RPC function we created in the migration
      const { data, error } = await supabase.rpc("check_admin_credentials", {
        p_username: username,
        p_password: password,
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const admin = data[0];
        // Success! For this custom auth, we'll store a session flag in localStorage
        // In a real app, you'd use a more secure method or Supabase Auth
        localStorage.setItem("safespace_admin_session", JSON.stringify({
          id: admin.id,
          username: admin.username,
          full_name: admin.full_name,
          expiry: Date.now() + 1000 * 60 * 60 * 24, // 24h
        }));
        
        toast.success(`Welcome back, ${admin.full_name}`);
        navigate({ to: "/admin" });
      } else {
        toast.error("Invalid admin credentials.");
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 text-primary mb-4 animate-pulse">
            <ShieldCheck className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Safe Space</h1>
          <p className="text-muted-foreground">Super Admin Command Center</p>
        </div>

        <div className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Admin Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="bg-black/50 border-white/10 pl-10 h-12 rounded-xl focus:ring-primary"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Access Key</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="bg-black/50 border-white/10 pl-10 h-12 rounded-xl focus:ring-primary"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-12 rounded-xl text-lg font-semibold shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? "Authenticating..." : "Authorize Entry"}
            </Button>
          </form>
        </div>

        <div className="text-center">
          <button 
            onClick={() => navigate({ to: "/" })}
            className="text-xs text-muted-foreground hover:text-white transition-colors"
          >
            Return to Public Portal
          </button>
        </div>
      </div>
      
      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
    </div>
  );
}
