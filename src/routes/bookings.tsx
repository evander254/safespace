import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { CalendarCheck, Clock, Sparkles, History, CheckCircle2, AlertCircle, Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ReviewDialog } from "@/components/review-dialog";
import { useState } from "react";
import { toast } from "sonner";

type BookingRow = {
  id: string;
  session_date: string;
  session_time: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes: string | null;
  created_at: string;
  therapists: { id: string; full_name: string; price_per_session: number } | null;
  reviews: { id: string }[] | null;
};

export const Route = createFileRoute("/bookings")({
  component: BookingsPage,
  head: () => ({ meta: [{ title: "My bookings · Safe Space" }] }),
});

const statusColor: Record<BookingRow["status"], string> = {
  pending: "bg-amber-500/15 text-amber-700 border-amber-200",
  confirmed: "bg-emerald-500/15 text-emerald-700 border-emerald-200",
  completed: "bg-secondary/20 text-secondary border-secondary/30",
  cancelled: "bg-muted text-muted-foreground border-border",
};

function BookingsPage() {
  const { user, loading, intakeCompleted, roles } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [reviewBooking, setReviewBooking] = useState<any>(null);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate({ to: "/auth", search: { mode: "signin" } as any });
      } else if (roles.includes("client") && !intakeCompleted) {
        navigate({ to: "/onboarding" });
      }
    }
  }, [loading, user, intakeCompleted, roles, navigate]);

  // Bookings Data
  const { data: rows, isLoading: bookingsLoading, error: queryError } = useQuery({
    queryKey: ["user-bookings", user?.id],
    queryFn: async () => {
      console.log("Fetching bookings for user:", user?.id);
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id,
          session_date,
          session_time,
          status,
          notes,
          created_at,
          therapist_id,
          therapists(id, full_name, price_per_session),
          reviews(id)
        `)
        .order("session_date", { ascending: false });
      
      if (error) {
        console.error("Supabase error fetching bookings:", error);
        throw error;
      }
      console.log("Fetched bookings count:", data?.length);
      return (data ?? []) as unknown as BookingRow[];
    },
    enabled: !!user,
  });

  if (queryError) {
    console.error("React Query error:", queryError);
  }

  const stats = useMemo(() => {
    if (!rows) return { pending: 0, confirmed: 0, completed: 0 };
    return rows.reduce((acc, b) => {
      if (b.status === "pending") acc.pending++;
      if (b.status === "confirmed") acc.confirmed++;
      if (b.status === "completed") acc.completed++;
      return acc;
    }, { pending: 0, confirmed: 0, completed: 0 });
  }, [rows]);

  const { active, history } = useMemo(() => {
    if (!rows) return { active: [], history: [] };
    const active = rows.filter(r => r.status === "pending" || r.status === "confirmed");
    const history = rows.filter(r => r.status === "completed" || r.status === "cancelled");
    return { active, history };
  }, [rows]);

  if (loading || (user && bookingsLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Sparkles className="h-10 w-10 animate-pulse text-primary" />
          <p className="text-sm text-muted-foreground font-medium animate-pulse">Loading your safe space...</p>
        </div>
      </div>
    );
  }

  if (!user || (roles.includes("client") && !intakeCompleted)) return null;

  return (
    <div className="min-h-screen bg-background/50 selection:bg-primary/10 pb-20">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 md:py-12 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Bookings</h1>
          <p className="text-slate-500 text-base">Manage your therapy journey and session history.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-12">
          <Card className="rounded-2xl border-slate-100 bg-white shadow-card overflow-hidden transition-all hover:shadow-subtle">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Pending</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.pending}</p>
                </div>
                <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-subtle border border-amber-100">
                  <Clock3 className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-slate-100 bg-white shadow-card overflow-hidden transition-all hover:shadow-subtle">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Confirmed</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.confirmed}</p>
                </div>
                <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-subtle border border-emerald-100">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-slate-100 bg-white shadow-card overflow-hidden transition-all hover:shadow-subtle">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Completed</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.completed}</p>
                </div>
                <div className="h-11 w-11 rounded-xl bg-primary/5 text-primary flex items-center justify-center shadow-subtle border border-primary/10">
                  <CalendarCheck className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-16">
          {/* Active Bookings */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-subtle border border-primary/10">
                <Sparkles className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Active Sessions</h2>
            </div>
            
            {active.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-subtle">
                <p className="text-slate-500 text-base italic">No active bookings. Find your perfect therapist to start.</p>
                <Button asChild className="mt-8 rounded-xl px-10 h-11 text-sm font-semibold shadow-card transition-all active:scale-95"><Link to="/therapists">Browse therapists</Link></Button>
              </div>
            ) : (
              <div className="grid gap-6">
                {active.map((b) => (
                  <BookingCard key={b.id} booking={b} />
                ))}
              </div>
            )}
          </div>

          <ReviewDialog 
            booking={reviewBooking} 
            open={!!reviewBooking} 
            onOpenChange={(open) => !open && setReviewBooking(null)}
            onSuccess={() => queryClient.invalidateQueries({ queryKey: ["user-bookings"] })}
          />

          {/* History */}
          {history.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="h-10 w-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center shadow-subtle border border-slate-100">
                  <History className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">Session History</h2>
              </div>
              <div className="grid gap-6 opacity-80 hover:opacity-100 transition-opacity duration-300">
                {history.map((b) => (
                  <BookingCard 
                    key={b.id} 
                    booking={b} 
                    isHistory 
                    onRate={() => setReviewBooking(b)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}


function BookingCard({ 
  booking: b, 
  isHistory = false,
  onRate
}: { 
  booking: BookingRow; 
  isHistory?: boolean;
  onRate?: () => void;
}) {
  const isReviewed = b.reviews && b.reviews.length > 0;
  return (
    <div className="group flex flex-col gap-6 rounded-2xl border border-slate-100 bg-white p-5 transition-all duration-300 hover:shadow-card hover:border-primary/20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className={`grid h-12 w-12 place-items-center rounded-xl ${isHistory ? "bg-slate-50 text-slate-400 border-slate-100" : "bg-primary/5 text-primary border-primary/10"} border shadow-subtle transition-all duration-300 group-hover:scale-105`}>
            <CalendarCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="font-bold text-lg text-slate-900">{b.therapists?.full_name ?? "Therapist"}</div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-1 text-[13px] text-slate-500 font-medium">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400" /> {b.session_date} · {b.session_time?.slice(0,5)}
              </div>
              {!isHistory && (
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary/60" /> KSh {Number(b.therapists?.price_per_session || 0).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-3">
          <Badge variant="outline" className={`rounded-full px-4 py-1 text-[10px] font-bold uppercase tracking-wider shadow-subtle border ${statusColor[b.status]}`}>{b.status}</Badge>
          {!isHistory && b.status === "confirmed" && (
            <Button variant="outline" size="sm" className="rounded-xl h-9 px-5 text-[11px] font-semibold border-slate-200">Reschedule</Button>
          )}
          {isHistory && b.status === "completed" && !isReviewed && (
            <Button 
              onClick={onRate}
              className="rounded-xl h-9 px-5 text-[11px] font-bold bg-primary shadow-subtle hover:shadow-card transition-all active:scale-95"
            >
              Rate Session
            </Button>
          )}
          {isHistory && isReviewed && (
            <Badge variant="secondary" className="rounded-full px-4 py-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border-emerald-100">Reviewed</Badge>
          )}
        </div>
      </div>
      
      {b.notes && (
        <div className="mt-2 rounded-xl bg-slate-50 p-4 border border-slate-100">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Session Notes</div>
          <p className="text-[13px] text-slate-600 leading-relaxed italic">"{b.notes}"</p>
        </div>
      )}
      
      <div className="flex items-center justify-between pt-4 border-t border-slate-50 text-[11px] font-medium text-slate-300">
        <span className="tracking-wider uppercase">ID: {b.id.slice(0,8)}</span>
        <span className="tracking-wider uppercase">Requested on {new Date(b.created_at).toLocaleDateString()}</span>
      </div>
    </div>
  );
}