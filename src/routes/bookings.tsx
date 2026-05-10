import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { CalendarCheck, Clock, Sparkles, History, CheckCircle2, AlertCircle, Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteHeader } from "@/components/site-header";
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
    <div className="min-h-screen bg-background pb-20">
      <SiteHeader />
      <section className="mx-auto max-w-5xl px-4 py-8 md:py-12">
        <div className="mb-10 flex flex-col gap-2">
          <h1 className="text-4xl font-bold tracking-tight">Bookings</h1>
          <p className="text-muted-foreground text-lg">Manage your therapy journey and session history.</p>
          {/* Debug info - will remove once fixed */}
          <div className="text-[10px] text-muted-foreground bg-muted/20 p-2 rounded-lg mt-2">
            Debug: {rows?.length ?? 0} rows found. 
            {queryError && <span className="text-rose-500 ml-2">Error: {JSON.stringify(queryError)}</span>}
            {rows && rows.length > 0 && (
              <span className="ml-2">First status: {rows[0].status}</span>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <Card className="rounded-3xl border-border/40 bg-card/50 shadow-sm overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pending Approval</p>
                  <p className="text-3xl font-bold">{stats.pending}</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <Clock3 className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-3xl border-border/40 bg-card/50 shadow-sm overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Confirmed</p>
                  <p className="text-3xl font-bold">{stats.confirmed}</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-3xl border-border/40 bg-card/50 shadow-sm overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Completed</p>
                  <p className="text-3xl font-bold">{stats.completed}</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <CalendarCheck className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-12">
          {/* Active Bookings */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold tracking-tight">Active Sessions</h2>
            </div>
            
            {active.length === 0 ? (
              <div className="rounded-[2.5rem] border border-dashed border-border bg-card/30 p-12 text-center">
                <p className="text-muted-foreground italic">No active bookings. Find your perfect therapist to start.</p>
                <Button asChild className="mt-6 rounded-full px-8 py-6 h-auto font-bold shadow-lg shadow-primary/20"><Link to="/therapists">Browse therapists</Link></Button>
              </div>
            ) : (
              <div className="grid gap-4">
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
              <div className="flex items-center gap-2 mb-6">
                <History className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-2xl font-bold tracking-tight">Session History</h2>
              </div>
              <div className="grid gap-4 opacity-80 hover:opacity-100 transition-opacity">
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
      </section>
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
    <div className="group flex flex-col gap-4 rounded-[2rem] border border-border/50 bg-card p-6 transition-all hover:shadow-md hover:border-primary/20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          <div className={`grid h-14 w-14 place-items-center rounded-2xl ${isHistory ? "bg-muted text-muted-foreground" : "bg-primary-soft text-primary"} shadow-sm group-hover:scale-105 transition-transform`}>
            <CalendarCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="font-bold text-lg">{b.therapists?.full_name ?? "Therapist"}</div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground font-medium">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-primary" /> {b.session_date} · {b.session_time?.slice(0,5)}
              </div>
              {!isHistory && (
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" /> KSh {Number(b.therapists?.price_per_session || 0).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-4">
          <Badge variant="outline" className={`rounded-full px-4 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm border ${statusColor[b.status]}`}>{b.status}</Badge>
          {!isHistory && b.status === "confirmed" && (
            <Button variant="outline" size="sm" className="rounded-full h-8 text-xs font-bold">Reschedule</Button>
          )}
          {isHistory && b.status === "completed" && !isReviewed && (
            <Button 
              onClick={onRate}
              className="rounded-full h-8 text-xs font-bold bg-primary shadow-sm"
            >
              Rate Session
            </Button>
          )}
          {isHistory && isReviewed && (
            <Badge variant="secondary" className="rounded-full px-3 py-1 text-[9px] font-semibold bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Reviewed</Badge>
          )}
        </div>
      </div>
      
      {b.notes && (
        <div className="mt-2 rounded-2xl bg-muted/30 p-4 border border-border/10">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Session Notes</div>
          <p className="text-sm text-muted-foreground leading-relaxed italic">"{b.notes}"</p>
        </div>
      )}
      
      <div className="flex items-center justify-between pt-2 border-t border-border/10 text-[10px] text-muted-foreground/60">
        <span>Booking ID: {b.id.slice(0,8)}...</span>
        <span>Requested on {new Date(b.created_at).toLocaleDateString()}</span>
      </div>
    </div>
  );
}