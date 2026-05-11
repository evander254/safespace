import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, Star, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "@tanstack/react-router";
import { CheckCircle2, MapPin, Clock, ShieldCheck } from "lucide-react";

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

export const Route = createFileRoute("/therapists/")({
  component: TherapistsPage,
  head: () => ({
    meta: [
      { title: "Find a therapist · Safe Space" },
      { name: "description", content: "Search licensed therapists in Kenya by specialization, price and rating." },
    ],
  }),
});

const SPECS = ["Anxiety", "Depression", "Trauma", "Relationships", "Stress", "Grief", "Addiction", "Self-esteem"];

function TherapistsPage() {
  const { user, loading: authLoading, intakeCompleted, roles } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Therapist[] | null>(null);
  const [q, setQ] = useState("");
  const [spec, setSpec] = useState<string>("all");
  const [maxPrice, setMaxPrice] = useState<string>("any");
  const [minRating, setMinRating] = useState<string>("0");

  useEffect(() => {
    if (!authLoading && user && roles.includes("client") && !intakeCompleted) {
      navigate({ to: "/onboarding" });
    }
  }, [authLoading, user, intakeCompleted, roles, navigate]);

  useEffect(() => {
    supabase
      .from("therapists")
      .select("id,full_name,bio,specializations,languages,price_per_session,rating,reviews_count,avatar_url,completed_sessions_count")
      .eq("is_approved", true)
      .order("rating", { ascending: false })
      .then(({ data }) => setItems((data ?? []) as Therapist[]));
  }, []);

  const filtered = useMemo(() => {
    if (!items) return [];
    return items.filter((t) => {
      if (q && !`${t.full_name} ${t.bio ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (spec !== "all" && !t.specializations.includes(spec)) return false;
      if (maxPrice !== "any" && Number(t.price_per_session) > Number(maxPrice)) return false;
      if (Number(t.rating) < Number(minRating)) return false;
      return true;
    });
  }, [items, q, spec, maxPrice, minRating]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Sparkles className="h-6 w-6 animate-pulse text-primary" />
      </div>
    );
  }

  if (user && roles.includes("client") && !intakeCompleted) return null;

  return (
    <div className="min-h-screen bg-background/50 selection:bg-primary/10">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-12 md:py-20 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Find your therapist</h1>
          <p className="text-base text-slate-500">Browse licensed professionals across Kenya</p>
        </div>

        <div className="mt-10 flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-2 shadow-card md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input 
              className="h-11 border-none bg-transparent pl-11 text-sm focus-visible:ring-0 shadow-none" 
              placeholder="Search name or keyword" 
              value={q} 
              onChange={(e) => setQ(e.target.value)} 
            />
          </div>
          <div className="flex flex-wrap gap-2 p-1.5 md:flex-nowrap md:p-0">
            <Select value={spec} onValueChange={setSpec}>
              <SelectTrigger className="h-10 border-slate-100 bg-slate-50 md:w-44 rounded-xl text-[13px] text-slate-600 font-medium"><SelectValue placeholder="Specializations" /></SelectTrigger>
              <SelectContent className="rounded-xl shadow-card border-slate-100">
                <SelectItem value="all">All specializations</SelectItem>
                {SPECS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={maxPrice} onValueChange={setMaxPrice}>
              <SelectTrigger className="h-10 border-slate-100 bg-slate-50 md:w-36 rounded-xl text-[13px] text-slate-600 font-medium"><SelectValue placeholder="Price Range" /></SelectTrigger>
              <SelectContent className="rounded-xl shadow-card border-slate-100">
                <SelectItem value="any">Any price</SelectItem>
                <SelectItem value="1500">≤ KSh 1,500</SelectItem>
                <SelectItem value="3000">≤ KSh 3,000</SelectItem>
                <SelectItem value="5000">≤ KSh 5,000</SelectItem>
              </SelectContent>
            </Select>
            <Select value={minRating} onValueChange={setMinRating}>
              <SelectTrigger className="h-10 border-slate-100 bg-slate-50 md:w-32 rounded-xl text-[13px] text-slate-600 font-medium"><SelectValue placeholder="Rating" /></SelectTrigger>
              <SelectContent className="rounded-xl shadow-card border-slate-100">
                <SelectItem value="0">Any rating</SelectItem>
                <SelectItem value="3">3+ stars</SelectItem>
                <SelectItem value="4">4+ stars</SelectItem>
                <SelectItem value="4.5">4.5+ stars</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {items === null ? (
          <div className="mt-12 grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl border border-slate-100 bg-slate-50" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-20 rounded-3xl border border-dashed border-slate-200 bg-white p-16 text-center shadow-subtle">
            <Sparkles className="mx-auto h-10 w-10 text-primary/40" />
            <h3 className="mt-6 text-xl font-bold text-slate-900">No therapists found</h3>
            <p className="mt-2 text-sm text-slate-500">
              Try adjusting your filters or search keywords.
            </p>
          </div>
        ) : (
          <div className="mt-12 grid gap-8 md:grid-cols-1 lg:grid-cols-2">
            {filtered.map((t) => (
              <article 
                key={t.id} 
                className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 transition-all duration-300 hover:shadow-card hover:border-primary/20 md:p-6"
              >
                <div className="grid h-full gap-6 md:grid-cols-[140px_1fr]">
                  <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-slate-50 md:h-36 md:w-36 shadow-subtle">
                    {t.avatar_url ? (
                      <img src={t.avatar_url} alt={t.full_name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-primary/5 text-2xl font-bold text-primary">
                        {t.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-lg font-bold text-slate-900">{t.full_name}</h3>
                          <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none rounded-full flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                            <CheckCircle2 className="h-3 w-3" /> Verified
                          </Badge>
                        </div>
                        <p className="text-[13px] font-medium text-slate-500 mt-1">Licensed Psychologist</p>
                        
                        <div className="mt-3 flex items-center gap-4">
                          <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-100 shadow-subtle">
                            <Star className="h-3 w-3 fill-current" /> {Number(t.rating).toFixed(1)}
                          </div>
                          <span className="text-[12px] font-medium text-slate-400">{t.reviews_count} reviews · {t.completed_sessions_count || 0} sessions</span>
                        </div>
                      </div>
                      <div className="hidden shrink-0 flex-col items-end md:flex">
                        <span className="text-xl font-bold text-primary">KSh {Number(t.price_per_session).toLocaleString()}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">per session</span>
                      </div>
                    </div>

                    <p className="mt-5 text-sm leading-relaxed text-slate-600 line-clamp-2 md:line-clamp-3">
                      {t.bio ? t.bio : `Experienced specialist helping clients navigate mental health challenges with compassion and professional expertise.`}
                    </p>

                    <div className="mt-6 flex flex-wrap gap-2">
                      {t.specializations.slice(0, 3).map((s) => (
                        <Badge key={s} variant="secondary" className="rounded-lg bg-slate-50 text-slate-600 border border-slate-100 font-semibold px-3 py-1 hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-all text-[11px]">
                          {s}
                        </Badge>
                      ))}
                    </div>

                    <div className="mt-8 flex items-center justify-between gap-4 md:hidden">
                      <div className="flex flex-col">
                        <span className="text-lg font-bold text-primary">KSh {Number(t.price_per_session).toLocaleString()}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">per session</span>
                      </div>
                      <Button asChild size="sm" className="rounded-xl px-6 font-semibold shadow-subtle">
                        <Link to="/therapists/$id" params={{ id: t.id }}>View Profile</Link>
                      </Button>
                    </div>
                    
                    <div className="mt-auto hidden pt-8 md:block">
                      <Button asChild className="rounded-xl px-8 h-10 text-sm font-semibold shadow-subtle hover:shadow-card transition-all active:scale-95">
                        <Link to="/therapists/$id" params={{ id: t.id }}>View Full Profile</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
