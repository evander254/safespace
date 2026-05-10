import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Star, Languages, Sparkles, Calendar, Clock, CreditCard, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteHeader } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

type Therapist = {
  id: string;
  full_name: string;
  bio: string | null;
  specializations: string[];
  languages: string[];
  price_per_session: number;
  rating: number;
  reviews_count: number;
  avatar_url: string | null;
  completed_sessions_count: number;
};

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles: { full_name: string; avatar_url: string | null } | null;
};

export const Route = createFileRoute("/therapists/$id")({
  component: TherapistDetail,
});

function TherapistDetail() {
  const { id } = Route.useParams();
  const { user, loading: authLoading, intakeCompleted, roles } = useAuth();
  const navigate = useNavigate();
  const [t, setT] = useState<Therapist | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(true);

  useEffect(() => {
    if (!authLoading && user && roles.includes("client") && !intakeCompleted) {
      navigate({ to: "/onboarding" });
    }
  }, [authLoading, user, intakeCompleted, roles, navigate]);

  useEffect(() => {
    supabase.from("therapists").select("*").eq("id", id).single().then(({ data }) => setT(data as Therapist | null));
    
    supabase
      .from("reviews")
      .select("*, profiles(full_name, avatar_url)")
      .eq("therapist_id", id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setReviews((data ?? []) as unknown as Review[]);
        setLoadingReviews(false);
      });
  }, [id]);

  const book = async () => {
    if (!authLoading && !user) {
      navigate({ to: "/auth", search: { mode: "signin" } as any });
      return;
    }
    if (!date || !time) {
      toast.error("Pick a date and time");
      return;
    }
    if (!user) return; // TS safety
    setBusy(true);
    const { error } = await supabase.from("bookings").insert({
      client_id: user.id,
      therapist_id: id,
      session_date: date,
      session_time: time,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message.includes("duplicate") ? "That time is already booked." : error.message);
      return;
    }
    toast.success("Booking requested. Complete payment to confirm.");
    navigate({ to: "/bookings" });
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Sparkles className="h-6 w-6 animate-pulse text-primary" />
      </div>
    );
  }

  if (user && roles.includes("client") && !intakeCompleted) return null;

  if (!t) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-4xl p-6">
          <div className="h-72 animate-pulse rounded-3xl bg-muted/40" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <Link to="/therapists" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to therapists
        </Link>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-8">
            <article className="overflow-hidden rounded-[2.5rem] border border-border/50 bg-card shadow-sm transition-all hover:shadow-md">
              <div className="relative h-32 bg-[image:var(--gradient-primary)] opacity-10" />
              <div className="px-8 pb-8">
                <div className="relative -mt-12 flex flex-col items-start gap-6 sm:flex-row sm:items-end">
                  <div className="relative">
                    <div className="grid h-32 w-32 place-items-center overflow-hidden rounded-[2rem] border-4 border-card bg-primary-soft text-primary text-3xl font-bold shadow-lg">
                      {t.avatar_url ? <img src={t.avatar_url} alt={t.full_name} className="h-full w-full object-cover" /> : t.full_name.split(" ").map((n) => n[0]).slice(0,2).join("")}
                    </div>
                    <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">{t.full_name}</h1>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                        <span className="font-semibold text-foreground">{Number(t.rating).toFixed(1)}</span>
                        <span>({t.reviews_count} reviews)</span>
                      </div>
                      <div className="h-1 w-1 rounded-full bg-border" />
                      <div className="flex items-center gap-1.5 text-primary font-medium">
                        <Sparkles className="h-4 w-4" />
                        <span>{t.completed_sessions_count || 0} sessions completed</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-10 space-y-6">
                  <section>
                    <h2 className="text-lg font-semibold">About</h2>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                      {t.bio ?? "No detailed biography available yet."}
                    </p>
                  </section>

                  <section>
                    <h2 className="text-lg font-semibold">Specializations</h2>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {t.specializations.map((s) => (
                        <Badge key={s} variant="secondary" className="rounded-full px-4 py-1 text-xs font-medium">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </section>

                  {t.languages?.length > 0 && (
                    <section>
                      <h2 className="text-lg font-semibold">Languages</h2>
                      <div className="mt-3 flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                          <Languages className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <span className="text-sm font-medium">{t.languages.join(", ")}</span>
                      </div>
                    </section>
                  )}
                </div>
              </div>
            </article>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Client Reviews</h2>
                <div className="text-sm text-muted-foreground">Showing {reviews.length} reviews</div>
              </div>
              
              {loadingReviews ? (
                <div className="space-y-4">
                  {Array.from({length: 2}).map((_, i) => (
                    <div key={i} className="h-32 animate-pulse rounded-3xl bg-muted/40" />
                  ))}
                </div>
              ) : reviews.length === 0 ? (
                <div className="rounded-[2rem] border border-dashed border-border bg-card/50 p-16 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <Star className="h-6 w-6 text-muted-foreground/40" />
                  </div>
                  <h3 className="mt-4 font-semibold">No reviews yet</h3>
                  <p className="mt-2 text-sm text-muted-foreground">This therapist hasn't received any reviews from clients yet.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {reviews.map((r) => (
                    <div key={r.id} className="rounded-[2rem] border border-border/50 bg-card p-6 shadow-sm transition-all hover:shadow-md">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 place-items-center overflow-hidden rounded-2xl bg-primary-soft text-primary text-sm font-bold">
                            {r.profiles?.avatar_url ? <img src={r.profiles.avatar_url} alt={r.profiles.full_name} className="h-full w-full object-cover" /> : r.profiles?.full_name?.[0] || "?"}
                          </div>
                          <div>
                            <div className="text-sm font-bold">{r.profiles?.full_name || "Anonymous Client"}</div>
                            <div className="text-[10px] text-muted-foreground">
                              {new Date(r.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {Array.from({length: 5}).map((_, i) => (
                            <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground/20'}`} />
                          ))}
                        </div>
                      </div>
                      <p className="mt-4 text-sm leading-relaxed text-muted-foreground italic">"{r.comment || "The client chose not to leave a written comment."}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <aside className="lg:sticky lg:top-24 h-fit">
            <div className="rounded-[2.5rem] border border-border/50 bg-card p-8 shadow-[var(--shadow-soft)]">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Investment</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">KSh {Number(t.price_per_session).toLocaleString()}</span>
                  <span className="text-sm text-muted-foreground">/ session</span>
                </div>
              </div>

              <div className="mt-8 space-y-5">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-semibold">
                    <Calendar className="h-4 w-4 text-primary" /> Preferred Date
                  </Label>
                  <Input 
                    type="date" 
                    value={date} 
                    min={new Date().toISOString().slice(0,10)} 
                    onChange={(e) => setDate(e.target.value)}
                    className="rounded-xl border-border/50 bg-muted/30 focus-visible:ring-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-semibold">
                    <Clock className="h-4 w-4 text-primary" /> Preferred Time
                  </Label>
                  <Input 
                    type="time" 
                    value={time} 
                    onChange={(e) => setTime(e.target.value)}
                    className="rounded-xl border-border/50 bg-muted/30 focus-visible:ring-primary"
                  />
                </div>

                <div className="pt-2">
                  <Button 
                    className="h-12 w-full rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70" 
                    onClick={book} 
                    disabled={busy}
                  >
                    {busy ? "Processing..." : user ? "Request Booking" : "Sign in to Book"}
                  </Button>
                </div>

                <div className="space-y-4 rounded-2xl bg-muted/40 p-4">
                  <div className="flex items-start gap-3">
                    <CreditCard className="mt-0.5 h-4 w-4 text-primary" />
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      Payments are handled securely via M-Pesa. You'll receive payment instructions once the therapist accepts your request.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      Your privacy is our priority. All sessions are encrypted and confidential.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}