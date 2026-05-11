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
import { SiteFooter } from "@/components/site-footer";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProfileImageUpload } from "@/components/profile-image-upload";
import { useState } from "react";

export const Route = createFileRoute("/profile/")({
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

  const updateProfileMutation = useMutation({
    mutationFn: async (values: { full_name: string; phone: string; avatar_url?: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update(values)
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast.success("Profile updated successfully!");
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState({ full_name: "", phone: "" });

  useEffect(() => {
    if (profile) {
      setEditData({
        full_name: profile.full_name || "",
        phone: profile.phone || ""
      });
    }
  }, [profile]);

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Sparkles className="h-6 w-6 animate-pulse text-primary" />
      </div>
    );
  }

  if (!user || (roles.includes("client") && !intakeCompleted)) return null;

  return (
    <div className="min-h-screen bg-background/50 selection:bg-primary/10 pb-20">
      <SiteHeader />
      
      <main className="mx-auto max-w-7xl px-4 py-8 md:py-10 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-12 flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="h-28 w-28 overflow-hidden rounded-2xl bg-slate-50 shadow-card md:h-32 md:w-32 border-4 border-white">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name || ""} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-primary/5 text-primary">
                    <User className="h-12 w-12" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-subtle border-2 border-white">
                <Shield className="h-4 w-4" />
              </div>
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                {profile?.full_name || user?.email?.split("@")[0]}
              </h1>
              <div className="flex flex-wrap gap-4 text-[13px] text-slate-500 font-medium">
                <span className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-400" /> {user?.email}
                </span>
                {profile?.phone && (
                  <span className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-400" /> {profile.phone}
                  </span>
                )}
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-400" /> Joined {new Date(profile?.created_at || "").toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-xl h-10 px-6 text-sm font-semibold shadow-subtle hover:shadow-card border-slate-200 transition-all">
                <Settings className="mr-2 h-4 w-4" /> Edit Profile
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-3xl">
              <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="flex justify-center">
                  <ProfileImageUpload 
                    userId={user.id} 
                    currentUrl={profile?.avatar_url} 
                    onUploadComplete={(url) => updateProfileMutation.mutate({ ...editData, avatar_url: url })}
                  />
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input 
                      id="name" 
                      value={editData.full_name} 
                      onChange={(e) => setEditData({ ...editData, full_name: e.target.value })} 
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input 
                      id="phone" 
                      value={editData.phone} 
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })} 
                      className="rounded-xl"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={() => {
                    updateProfileMutation.mutate(editData);
                    setEditOpen(false);
                  }}
                  className="rounded-full px-8"
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button asChild variant="ghost" className="rounded-xl h-10 px-4 text-sm font-medium text-slate-500">
            <Link to="/onboarding">
              Settings
            </Link>
          </Button>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Left Column: Intake Info */}
          <div className="space-y-8">
            <section className="profile-card p-5 rounded-2xl border border-slate-100 bg-white shadow-card">
              <div className="mb-6 flex items-center gap-2.5">
                <Brain className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold text-slate-900">Primary Concerns</h2>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {intake?.primary_concerns?.map((c) => (
                  <Badge key={c} variant="secondary" className="rounded-lg bg-slate-50 text-slate-600 border border-slate-100 px-3.5 py-1 text-[13px] font-semibold">
                    {c}
                  </Badge>
                ))}
                {!intake?.primary_concerns?.length && <p className="text-sm text-slate-500 italic">No concerns listed</p>}
              </div>
            </section>

            <section className="profile-card p-5 rounded-2xl border border-slate-100 bg-white shadow-card">
              <div className="mb-6 flex items-center gap-2.5">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold text-slate-900">Goals & Impact</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="mb-3 text-[13px] font-bold text-slate-400 uppercase tracking-wider">Aims for therapy</p>
                  <div className="flex flex-wrap gap-2.5">
                    {intake?.therapy_goals?.map((g) => (
                      <div key={g} className="flex items-center gap-2.5 rounded-xl bg-primary/5 px-4 py-2 text-[13px] font-semibold text-primary border border-primary/10">
                        <CheckCircle2 className="h-4 w-4" />
                        {g}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="profile-card p-5 rounded-2xl border border-slate-100 bg-white shadow-card">
              <div className="mb-6 flex items-center gap-2.5">
                <Heart className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold text-slate-900">Identity & Culture</h2>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Gender</p>
                  <p className="font-bold text-slate-900">{intake?.gender || "Not specified"}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Ethnicity</p>
                  <p className="font-bold text-slate-900">{intake?.ethnicity || "Not specified"}</p>
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
              
              <div className="space-y-5">
                <div className="flex items-baseline justify-between rounded-2xl bg-card border border-border/50 p-5 shadow-sm">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Available Balance</p>
                    <div className="text-2xl font-bold">KSh {Number(wallet?.balance || 0).toLocaleString()}</div>
                  </div>
                  <Button 
                    size="sm" 
                    className="rounded-full h-9 px-4 text-xs font-bold"
                    asChild
                  >
                    <Link to="/profile/topup">
                      <Plus className="h-3.5 w-3.5 mr-1" /> Top up
                    </Link>
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
        <div className="mt-10 flex items-center gap-4 rounded-2xl bg-primary/5 p-5 text-xs text-muted-foreground border border-primary/10">
          <AlertCircle className="h-5 w-5 shrink-0 text-primary" />
          <p className="font-medium leading-relaxed">
            Your profile details are confidential and used exclusively to match you with suitable therapists. 
            Update your preferences at any time to improve your experience.
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
