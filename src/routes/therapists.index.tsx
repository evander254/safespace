import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, Star, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SiteHeader } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "@tanstack/react-router";

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
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Find your therapist</h1>
        <p className="mt-2 text-muted-foreground">Browse licensed professionals across Kenya.</p>

        <div className="mt-6 grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-[1fr_auto_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search name or keyword" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Select value={spec} onValueChange={setSpec}>
            <SelectTrigger className="md:w-44"><SelectValue placeholder="Specialization" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All specializations</SelectItem>
              {SPECS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={maxPrice} onValueChange={setMaxPrice}>
            <SelectTrigger className="md:w-40"><SelectValue placeholder="Max price" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any price</SelectItem>
              <SelectItem value="1500">≤ KSh 1,500</SelectItem>
              <SelectItem value="3000">≤ KSh 3,000</SelectItem>
              <SelectItem value="5000">≤ KSh 5,000</SelectItem>
            </SelectContent>
          </Select>
          <Select value={minRating} onValueChange={setMinRating}>
            <SelectTrigger className="md:w-36"><SelectValue placeholder="Min rating" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Any rating</SelectItem>
              <SelectItem value="3">3+ stars</SelectItem>
              <SelectItem value="4">4+ stars</SelectItem>
              <SelectItem value="4.5">4.5+ stars</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {items === null ? (
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-2xl border border-border bg-muted/40" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-16 rounded-3xl border border-dashed border-border bg-card/40 p-12 text-center">
            <Sparkles className="mx-auto h-8 w-8 text-primary" />
            <h3 className="mt-3 text-lg font-medium">No therapists yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Approved therapist profiles will appear here. Check back soon.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((t) => (
              <article key={t.id} className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-1 hover:shadow-[var(--shadow-soft)]">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-full bg-primary-soft text-primary font-semibold">
                    {t.avatar_url ? <img src={t.avatar_url} alt={t.full_name} className="h-full w-full object-cover" /> : t.full_name.split(" ").map((n) => n[0]).slice(0,2).join("")}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate font-medium">{t.full_name}</h3>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="h-3.5 w-3.5 fill-current text-amber-500" /> {Number(t.rating).toFixed(1)} · {t.reviews_count} reviews · {t.completed_sessions_count || 0} sessions
                    </div>
                  </div>
                </div>
                <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{t.bio ?? "—"}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {t.specializations.slice(0, 3).map((s) => (
                    <Badge key={s} variant="secondary" className="rounded-full">{s}</Badge>
                  ))}
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                  <div className="text-sm"><span className="font-semibold">KSh {Number(t.price_per_session).toLocaleString()}</span> <span className="text-muted-foreground">/session</span></div>
                  <Button asChild size="sm" className="rounded-full">
                    <Link to="/therapists/$id" params={{ id: t.id }}>View</Link>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
