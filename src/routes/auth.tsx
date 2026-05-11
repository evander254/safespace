import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({
    mode: ((s.mode as string) === "signup" ? "signup" : "signin") as "signin" | "signup",
  }),
  component: AuthPage,
  head: () => ({ meta: [{ title: "Sign in · Safe Space" }] }),
});

const schema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
  fullName: z.string().trim().min(1).max(100).optional(),
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { user, roles, onboardingCompleted, intakeCompleted } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">(search.mode);
  const [role, setRole] = useState<"client" | "therapist">("client");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && roles.length > 0) {
      if (roles.includes("admin")) {
        navigate({ to: "/admin" });
      } else if (roles.includes("therapist")) {
        if (onboardingCompleted) {
          navigate({ to: "/therapist" });
        } else {
          navigate({ to: "/therapist-onboarding" });
        }
      } else if (intakeCompleted) {
        navigate({ to: "/therapists" });
      } else {
        navigate({ to: "/onboarding" });
      }
    }
  }, [user, roles, onboardingCompleted, intakeCompleted, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password, fullName: mode === "signup" ? fullName : undefined });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: role === "therapist" 
              ? `${window.location.origin}/therapist-onboarding` 
              : `${window.location.origin}/onboarding`,
            data: { 
              full_name: fullName,
              role: role
            },
          },
        });
        if (error) throw error;
        toast.success("Account created — let's set up your profile.");
        
        if (role === "therapist") {
          navigate({ to: "/therapist-onboarding" });
        } else {
          navigate({ to: "/onboarding" });
        }
        return;
      } else {
        const { error, data: signInData } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        if (!signInData.user) return;

        // Check roles via a quick fetch or wait for useAuth to update
        const { data: userRoles } = await supabase.from("user_roles").select("role").eq("user_id", signInData.user.id);
        const isAdmin = userRoles?.some(r => r.role === "admin");
        const isTherapist = userRoles?.some(r => r.role === "therapist");

        if (isAdmin) {
          navigate({ to: "/admin" });
          return;
        }

        if (isTherapist) {
          // Quick check for completion from DB since useAuth might not have updated yet
          const { data: th } = await supabase.from("therapists").select("onboarding_completed").eq("id", signInData.user.id).single();
          if (th?.onboarding_completed) {
            navigate({ to: "/therapist" });
          } else {
            navigate({ to: "/therapist-onboarding" });
          }
          return;
        }

        const completed = signInData.user?.user_metadata?.intake_completed;
        if (!completed) {
          toast.success("Welcome back — let's finish your profile.");
          navigate({ to: "/onboarding" });
          return;
        }
        toast.success("Welcome back.");
        navigate({ to: "/therapists" });
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="grid min-h-screen md:grid-cols-2">
        <div className="hidden md:flex flex-col justify-between p-12 relative overflow-hidden" style={{ backgroundImage: "var(--gradient-hero)" }}>
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,var(--primary)_0%,transparent_70%)]" />
          <div className="flex items-center gap-2.5 font-bold text-primary relative z-10">
            <div className="h-9 w-9 bg-primary rounded-[60%_40%_30%_70%] flex items-center justify-center text-primary-foreground shadow-diffused">
              <Heart className="h-4.5 w-4.5 fill-current" />
            </div>
            <span className="text-lg tracking-tight">Safe Space</span>
          </div>
          <div className="relative z-10 max-w-md">
            <h2 className="text-4xl font-bold leading-[1.1] tracking-tight text-primary">"The wound is the place where the light enters you."</h2>
            <p className="mt-5 text-lg text-muted-foreground font-medium italic">— Rumi</p>
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-primary/40 relative z-10">Confidential · Encrypted · Private</div>
        </div>

        <div className="flex items-center justify-center p-6">
          <div className="w-full max-w-sm">
            <h1 className="text-3xl font-bold tracking-tight text-primary">{mode === "signup" ? "Get started" : "Welcome back"}</h1>
            <p className="mt-2 text-sm text-muted-foreground font-medium">
              {mode === "signup" ? "Begin your journey to a calmer mind." : "Sign in to continue your care."}
            </p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              {mode === "signup" && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Full name</Label>
                    <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" required className="h-10 rounded-xl border-border/50 bg-muted/20 focus-visible:ring-primary/20 text-sm" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-1 p-1 bg-muted/50 border border-border/30 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setRole("client")}
                      className={`py-1.5 text-[11px] font-bold rounded-lg transition-all ${role === "client" ? "bg-card text-primary shadow-sm border border-border/20" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      I need help
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("therapist")}
                      className={`py-1.5 text-[11px] font-bold rounded-lg transition-all ${role === "therapist" ? "bg-card text-primary shadow-sm border border-border/20" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      I'm a therapist
                    </button>
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="h-10 rounded-xl border-border/50 bg-muted/20 focus-visible:ring-primary/20 text-sm" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Password</Label>
                  {mode === "signin" && (
                    <Link 
                      to="/forgot-password"
                      className="text-[11px] font-bold text-primary hover:underline"
                    >
                      Forgot password?
                    </Link>
                  )}
                </div>
                <PasswordInput 
                  id="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder={mode === "signup" ? "At least 8 characters" : "Enter your password"} 
                  required 
                  showStrength={mode === "signup"}
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-bold shadow-soft hover:shadow-diffused transition-all active:scale-[0.98] text-sm">
                {loading ? "Processing…" : mode === "signup" ? "Create account" : "Sign in"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {mode === "signup" ? "Already have an account?" : "New to Safe Space?"}{" "}
              <button className="font-medium text-primary hover:underline" onClick={() => setMode(mode === "signup" ? "signin" : "signup")}>
                {mode === "signup" ? "Sign in" : "Create one"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}