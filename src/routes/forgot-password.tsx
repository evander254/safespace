import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, ArrowLeft, Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
  head: () => ({ meta: [{ title: "Forgot Password · Safe Space" }] }),
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      setSubmitted(true);
      toast.success("Reset link sent to your email.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

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
          <h2 className="text-4xl font-bold leading-[1.1] tracking-tight text-primary">"Peace comes from within. Do not seek it without."</h2>
          <p className="mt-5 text-lg text-muted-foreground font-medium italic">— Buddha</p>
        </div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-primary/40 relative z-10">Security · Verification · Recovery</div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2">
            <Link to="/auth" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-4">
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Password Recovery</h1>
            <p className="text-sm text-muted-foreground font-medium">
              Enter your email and we'll send you a link to reset your password.
            </p>
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                  <Input 
                    id="email" 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="you@example.com" 
                    required 
                    className="h-11 pl-10 rounded-xl border-border/50 bg-muted/20 focus-visible:ring-primary/20 text-sm" 
                  />
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-bold shadow-soft hover:shadow-diffused transition-all active:scale-[0.98] text-sm">
                {loading ? "Sending link…" : "Send Reset Link"}
              </Button>
            </form>
          ) : (
            <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 space-y-4 animate-in zoom-in-95 duration-300">
              <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mx-auto">
                <Send className="h-6 w-6" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="font-bold text-lg">Check your inbox</h3>
                <p className="text-sm text-muted-foreground">
                  We've sent a password reset link to <span className="font-bold text-foreground">{email}</span>. Please check your email to continue.
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setSubmitted(false)}
                className="w-full h-11 rounded-xl border-primary/20 text-primary font-bold hover:bg-primary/5"
              >
                Didn't get the link? Try again
              </Button>
            </div>
          )}

          <p className="text-center text-xs text-muted-foreground pt-4">
            If you need further assistance, please contact our support team.
          </p>
        </div>
      </div>
    </div>
  );
}
