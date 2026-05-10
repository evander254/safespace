import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { 
  User, 
  Settings, 
  Brain, 
  Heart, 
  Shield, 
  Calendar, 
  Mail, 
  Phone, 
  MapPin, 
  MessageSquare,
  Bell,
  Sparkles,
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Wallet,
  Plus,
  ArrowUpRight,
  History as HistoryIcon
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({ meta: [{ title: "My Profile · Safe Space" }] }),
});

function ProfilePage() {
  const { user, loading: authLoading, intakeCompleted, roles } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: intake, isLoading: intakeLoading } = useQuery({
    queryKey: ["client_intake", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_intake")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!user,
  });

  // Wallet Data
  const { data: wallet } = useQuery({
    queryKey: ["user-wallet", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: transactions } = useQuery({
    queryKey: ["user-transactions", wallet?.id],
    queryFn: async () => {
      if (!wallet?.id) return [];
      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("wallet_id", wallet.id)
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
    enabled: !!wallet,
  });

  // Simulated Deposit
  const depositMutation = useMutation({
    mutationFn: async (amount: number) => {
      if (!user?.id || !wallet?.id) return;
      const { data: currentWallet } = await supabase.from("wallets").select("balance").eq("user_id", user.id).single();
      const { error } = await supabase
        .from("wallets")
        .update({ balance: (Number(currentWallet?.balance) || 0) + amount })
        .eq("user_id", user.id);
      if (error) throw error;

      await supabase.from("wallet_transactions").insert({
        wallet_id: wallet.id,
        amount: amount,
        type: 'deposit',
        description: 'M-Pesa Deposit'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-wallet"] });
      queryClient.invalidateQueries({ queryKey: ["user-transactions"] });
      toast.success("Funds added successfully!");
    }
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate({ to: "/auth", search: { mode: "signin" } as any });
      } else if (roles.includes("client") && !intakeCompleted) {
        navigate({ to: "/onboarding" });
      }
    }
  }, [authLoading, user, intakeCompleted, roles, navigate]);

  const isLoading = profileLoading || intakeLoading;

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Sparkles className="h-6 w-6 animate-pulse text-primary" />
      </div>
    );
  }

  if (!user || (roles.includes("client") && !intakeCompleted)) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      <SiteHeader />
      
      <main className="mx-auto max-w-4xl px-4 py-8 md:py-12">
        {/* Header Section */}
        <div className="mb-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="h-24 w-24 overflow-hidden rounded-3xl bg-muted shadow-[var(--shadow-soft)] md:h-28 md:w-28">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name || ""} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[image:var(--gradient-hero)] text-primary">
                    <User className="h-10 w-10" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
                <Shield className="h-4 w-4" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                {profile?.full_name || user?.email?.split("@")[0]}
              </h1>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-4 w-4" /> {user?.email}
                </span>
                {profile?.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-4 w-4" /> {profile.phone}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" /> Joined {new Date(profile?.created_at || "").toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          <Button asChild variant="outline" className="rounded-full shadow-sm">
            <Link to="/onboarding">
              <Settings className="mr-2 h-4 w-4" /> Edit Preferences
            </Link>
          </Button>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Left Column: Intake Info */}
          <div className="space-y-8">
            <section className="profile-card">
              <div className="mb-4 flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Primary Concerns</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {intake?.primary_concerns?.map((c) => (
                  <Badge key={c} variant="secondary" className="rounded-full px-3 py-1 font-medium">
                    {c}
                  </Badge>
                ))}
                {!intake?.primary_concerns?.length && <p className="text-sm text-muted-foreground italic">No concerns listed</p>}
              </div>
            </section>

            <section className="profile-card">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Goals & Impact</h2>
              </div>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="mb-2 font-medium text-foreground/80">Aims for therapy:</p>
                  <div className="flex flex-wrap gap-2">
                    {intake?.therapy_goals?.map((g) => (
                      <div key={g} className="flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-1.5 text-xs text-primary">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {g}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="profile-card">
              <div className="mb-4 flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Identity & Culture</h2>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="rounded-xl border border-border/50 p-3">
                  <p className="text-xs text-muted-foreground">Gender</p>
                  <p className="font-medium">{intake?.gender || "Not specified"}</p>
                </div>
                <div className="rounded-xl border border-border/50 p-3">
                  <p className="text-xs text-muted-foreground">Ethnicity</p>
                  <p className="font-medium">{intake?.ethnicity || "Not specified"}</p>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Wallet & Logistics */}
          <div className="space-y-8">
            {/* Wallet Section */}
            <section className="profile-card bg-primary/[0.02] border-primary/10">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Payments & Wallet</h2>
                </div>
                <Badge variant="outline" className="rounded-full bg-primary/5 text-primary border-primary/20">Secure</Badge>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-baseline justify-between rounded-3xl bg-card border border-border/50 p-6 shadow-sm">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Available Balance</p>
                    <div className="text-3xl font-bold">KSh {Number(wallet?.balance || 0).toLocaleString()}</div>
                  </div>
                  <Button 
                    size="sm" 
                    className="rounded-full h-10 px-4 font-bold"
                    onClick={() => depositMutation.mutate(1000)}
                    disabled={depositMutation.isPending}
                  >
                    <Plus className="h-4 w-4 mr-1.5" /> Top up
                  </Button>
                </div>

                {transactions && transactions.length > 0 && (
                  <div className="space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 px-1">
                      <HistoryIcon className="h-3.5 w-3.5" /> Recent Activity
                    </div>
                    <div className="space-y-2">
                      {transactions.map((tx: any) => (
                        <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/20 text-sm">
                          <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${tx.amount > 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-primary/10 text-primary"}`}>
                              {tx.amount > 0 ? <Plus className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                            </div>
                            <span className="font-medium">{tx.description}</span>
                          </div>
                          <span className={`font-bold ${tx.amount > 0 ? "text-emerald-600" : "text-foreground"}`}>
                            {tx.amount > 0 ? "+" : ""}{tx.amount}
                          </span>
                        </div>
                      ))}
                    </div>
                    <Button variant="link" size="sm" className="w-full text-xs text-muted-foreground">View all transactions</Button>
                  </div>
                )}
              </div>
            </section>

            <section className="profile-card">
              <div className="mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Logistics</h2>
              </div>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="mb-2 text-xs text-muted-foreground">Availability</p>
                  <div className="flex flex-wrap gap-1.5">
                    {intake?.availability?.map((d) => (
                      <span key={d} className="rounded-md bg-secondary px-2 py-1 text-[11px] font-medium text-secondary-foreground">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Preferred Mode</p>
                    <p className="font-medium capitalize">{intake?.preferred_channel || "Not specified"}</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="profile-card">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Activity</h2>
                </div>
                <Button asChild variant="ghost" size="sm" className="h-8 rounded-full text-xs">
                  <Link to="/messages">View All</Link>
                </Button>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-border/50 p-3 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary-soft text-primary">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <span>Messages</span>
                  </div>
                  <Badge variant="secondary" className="rounded-full">Updated</Badge>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border/50 p-3 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary-soft text-primary">
                      <Bell className="h-4 w-4" />
                    </div>
                    <span>Notifications</span>
                  </div>
                  <Badge variant="secondary" className="rounded-full">New</Badge>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-12 flex items-center gap-3 rounded-2xl bg-primary/5 p-4 text-xs text-muted-foreground">
          <AlertCircle className="h-4 w-4 shrink-0 text-primary" />
          <p>
            Your profile details are confidential and used exclusively to match you with the most suitable therapists. 
            You can update these preferences at any time.
          </p>
        </div>
      </main>
    </div>
  );
}
