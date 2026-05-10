import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({
    mode: ((s.mode as string) === "signup" ? "signup" : "signin") as "signin" | "signup",
  }),
  component: AuthPage,
  head: () => ({ meta: [{ title: "Sign in · Safe Space" }] }),
});

const schema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(72),
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
        <div className="hidden md:flex flex-col justify-between p-10" style={{ backgroundImage: "var(--gradient-hero)" }}>
          <div className="flex items-center gap-2 font-semibold">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground">
              <Heart className="h-4 w-4" />
            </span>
            safe space
          </div>
          <div>
            <h2 className="text-4xl font-semibold leading-tight">"The wound is the place where the light enters you."</h2>
            <p className="mt-3 text-muted-foreground">— Rumi</p>
          </div>
          <div className="text-xs text-muted-foreground">Confidential. Encrypted. Always yours.</div>
        </div>

        <div className="flex items-center justify-center p-6">
          <div className="w-full max-w-sm">
            <h1 className="text-2xl font-semibold tracking-tight">{mode === "signup" ? "Create your account" : "Welcome back"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "signup" ? "Start your journey with us." : "Sign in to continue."}
            </p>

            <form onSubmit={submit} className="mt-8 space-y-4">
              {mode === "signup" && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Full name</Label>
                    <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" required />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
                    <button
                      type="button"
                      onClick={() => setRole("client")}
                      className={`py-1.5 text-xs font-medium rounded-md transition-all ${role === "client" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      I need help
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("therapist")}
                      className={`py-1.5 text-xs font-medium rounded-md transition-all ${role === "therapist" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      I'm a therapist
                    </button>
                  </div>
                </>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" required />
              </div>
              <Button type="submit" disabled={loading} className="w-full rounded-full">
                {loading ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
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