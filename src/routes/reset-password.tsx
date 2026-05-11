import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, ShieldCheck, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
  head: () => ({ meta: [{ title: "Reset Password · Safe Space" }] }),
});

function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;
      
      setSuccess(true);
      toast.success("Password updated successfully.");
      
      // Auto redirect after 3 seconds
      setTimeout(() => {
        navigate({ to: "/auth", search: { mode: "signin" } });
      }, 3000);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center space-y-6 animate-in zoom-in-95 duration-500">
          <div className="h-20 w-20 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mx-auto">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-primary">Password Reset!</h1>
            <p className="text-muted-foreground font-medium">
              Your password has been successfully updated. Redirecting you to the sign-in page...
            </p>
          </div>
          <Button 
            onClick={() => navigate({ to: "/auth", search: { mode: "signin" } })}
            className="w-full h-11 rounded-xl bg-primary font-bold"
          >
            Go to Sign In Now
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <div className="hidden md:flex flex-col justify-between p-12 relative overflow-hidden flex-1" style={{ backgroundImage: "var(--gradient-hero)" }}>
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,var(--primary)_0%,transparent_70%)]" />
        <div className="flex items-center gap-2.5 font-bold text-primary relative z-10">
          <div className="h-9 w-9 bg-primary rounded-[60%_40%_30%_70%] flex items-center justify-center text-primary-foreground shadow-diffused">
            <Heart className="h-4.5 w-4.5 fill-current" />
          </div>
          <span className="text-lg tracking-tight">Safe Space</span>
        </div>
        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl font-bold leading-[1.1] tracking-tight text-primary">"The only way out is through."</h2>
          <p className="mt-5 text-lg text-muted-foreground font-medium italic">— Robert Frost</p>
        </div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-primary/40 relative z-10">Secure · Encrypted · Verified</div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-2">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Set New Password</h1>
            <p className="text-sm text-muted-foreground font-medium">
              Create a strong password to protect your account and clinical data.
            </p>
          </div>

          <form onSubmit={handleReset} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">New Password</Label>
              <PasswordInput 
                id="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Enter new password" 
                required 
                showStrength
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Confirm Password</Label>
              <PasswordInput 
                id="confirm-password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                placeholder="Repeat your password" 
                required 
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-bold shadow-soft hover:shadow-diffused transition-all active:scale-[0.98] text-sm">
              {loading ? "Updating password…" : "Update Password"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
