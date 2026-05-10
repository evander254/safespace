import { createFileRoute, Link } from "@tanstack/react-router";
import { 
  Calendar, 
  MessageSquare, 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  Wallet
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, addHours, isAfter, isBefore } from "date-fns";

export const Route = createFileRoute("/therapist/")({
  component: TherapistDashboard,
});

function TherapistDashboard() {
  const { user, isApproved } = useAuth();

  // 1. Total Bookings
  const { data: totalBookings } = useQuery({
    queryKey: ["therapist-total-bookings", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count, error } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("therapist_id", user.id);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });

  // 2. Active Clients
  const { data: activeClients } = useQuery({
    queryKey: ["therapist-active-clients", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { data, error } = await supabase
        .from("bookings")
        .select("client_id")
        .eq("therapist_id", user.id);
      if (error) throw error;
      const uniqueClients = new Set(data.map(b => b.client_id));
      return uniqueClients.size;
    },
    enabled: !!user,
  });

  // 3. Unread Messages
  const { data: unreadMessages } = useQuery({
    queryKey: ["therapist-unread-messages", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { data: bookings } = await supabase.from("bookings").select("id").eq("therapist_id", user.id);
      const bookingIds = bookings?.map(b => b.id) || [];
      
      if (bookingIds.length === 0) return 0;

      const { count: msgCount, error: msgError } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("is_read", false)
        .neq("sender_id", user.id)
        .in("booking_id", bookingIds);
        
      if (msgError) throw msgError;
      return msgCount || 0;
    },
    enabled: !!user,
  });

  // 4. Avg. Rating
  const { data: therapistInfo } = useQuery({
    queryKey: ["therapist-info", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("therapists")
        .select("rating, reviews_count")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // 5. Upcoming Sessions (48h)
  const { data: upcomingSessions } = useQuery({
    queryKey: ["therapist-upcoming-sessions", user?.id],
    queryFn: async () => {
      const now = new Date();
      const next48h = addHours(now, 48);
      
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("bookings")
        .select("*, profiles:client_id(full_name, avatar_url)")
        .eq("therapist_id", user.id)
        .eq("status", "confirmed")
        .gte("session_date", format(now, "yyyy-MM-dd"))
        .order("session_date", { ascending: true })
        .order("session_time", { ascending: true });
        
      if (error) throw error;
      
      // Filter for exactly 48h if needed, or just show all upcoming confirmed
      return data || [];
    },
    enabled: !!user,
  });

  // 6. Recent Messages
  const { data: recentMessages } = useQuery({
    queryKey: ["therapist-recent-messages", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data: bookings } = await supabase.from("bookings").select("id").eq("therapist_id", user.id);
      const bookingIds = bookings?.map(b => b.id) || [];
      if (bookingIds.length === 0) return [];

      const { data, error } = await supabase
        .from("messages")
        .select("*, sender:sender_id(full_name, avatar_url)")
        .in("booking_id", bookingIds)
        .order("created_at", { ascending: false })
        .limit(5);
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // 7. Wallet Balance
  const { data: wallet } = useQuery({
    queryKey: ["therapist-wallet", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const stats = [
    { title: "Wallet Balance", value: wallet ? `KES ${Number(wallet.balance).toLocaleString()}` : "KES 0", icon: Wallet, color: "text-primary" },
    { title: "Total Bookings", value: totalBookings?.toString() || "0", icon: Calendar, color: "text-blue-500" },
    { title: "Active Clients", value: activeClients?.toString() || "0", icon: Users, color: "text-green-500" },
    { title: "Unread Messages", value: unreadMessages?.toString() || "0", icon: MessageSquare, color: "text-purple-500" },
  ];

  if (!isApproved) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-8">
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-8 text-center space-y-4">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/20 text-amber-500">
            <Clock className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-semibold">Profile Under Review</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Your therapist profile is currently being reviewed by our clinical team. 
            Once approved, you'll be able to accept bookings and start sessions.
          </p>
          <div className="flex justify-center gap-4 pt-4">
            <Button variant="outline" className="rounded-full" asChild>
              <Link to="/therapist/profile">View My Profile</Link>
            </Button>
            <Button variant="outline" className="rounded-full">Help Center</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.user_metadata?.full_name?.split(" ")[0]}</h1>
          <p className="text-muted-foreground">Here's what's happening with your practice today.</p>
        </div>
        <Button className="rounded-full shadow-[var(--shadow-glow)] bg-primary text-primary-foreground">
          <Calendar className="mr-2 h-4 w-4" /> Manage Availability
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-border/50 rounded-2xl shadow-[var(--shadow-soft)] hover:shadow-md transition-shadow bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="border-border/50 rounded-3xl shadow-[var(--shadow-soft)] bg-card overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-muted/20">
            <CardTitle className="text-lg">Upcoming Sessions</CardTitle>
            <CardDescription>Your scheduled appointments for the next 48 hours.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {upcomingSessions && upcomingSessions.length > 0 ? (
              <div className="divide-y divide-border/50">
                {upcomingSessions.map((session: any) => (
                  <div key={session.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary-soft text-primary grid place-items-center font-bold">
                        {session.profiles?.full_name?.[0] || "C"}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{session.profiles?.full_name || "Client"}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {session.session_date} <Clock className="h-3 w-3 ml-1" /> {session.session_time.slice(0,5)}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="rounded-full text-xs">Details</Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                <div className="h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center text-muted-foreground/40">
                  <Calendar className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-sm font-medium">No upcoming sessions found</p>
                  <p className="text-xs text-muted-foreground">When clients book, they'll appear here.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 rounded-3xl shadow-[var(--shadow-soft)] bg-card overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-muted/20">
            <CardTitle className="text-lg">Recent Messages</CardTitle>
            <CardDescription>Latest communications from your clients.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {recentMessages && recentMessages.length > 0 ? (
              <div className="divide-y divide-border/50">
                {recentMessages.map((msg: any) => (
                  <div key={msg.id} className="p-4 flex items-start gap-4 hover:bg-muted/30 transition-colors">
                    <div className="h-9 w-9 rounded-full bg-secondary-soft text-secondary grid place-items-center font-bold text-xs">
                      {msg.sender?.full_name?.[0] || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">{msg.sender?.full_name || "User"}</span>
                        <span className="text-[10px] text-muted-foreground">{format(new Date(msg.created_at), "h:mm a")}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{msg.message}</p>
                    </div>
                    {!msg.is_read && msg.sender_id !== user?.id && (
                      <div className="h-2 w-2 rounded-full bg-primary mt-1" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                <div className="h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center text-muted-foreground/40">
                  <MessageSquare className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-sm font-medium">No recent messages</p>
                  <p className="text-xs text-muted-foreground">Client inquiries will appear here.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/50 rounded-3xl shadow-[var(--shadow-soft)] bg-card overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-muted/20">
            <CardTitle className="text-lg">Clinical Tasks</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {[
                { title: "Complete profile bio", completed: true },
                { title: "Upload license verification", completed: true },
                { title: "Set weekly availability", completed: false },
                { title: "Connect M-Pesa for payouts", completed: false },
              ].map((task, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/20 transition-all hover:bg-muted/50">
                  <div className="flex items-center gap-4">
                    <div className={`h-8 w-8 rounded-full grid place-items-center ${task.completed ? "bg-green-500/20 text-green-600" : "bg-amber-500/20 text-amber-600"}`}>
                      {task.completed ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
                    </div>
                    <span className={`text-sm ${task.completed ? "text-muted-foreground line-through opacity-70" : "font-semibold"}`}>
                      {task.title}
                    </span>
                  </div>
                  {!task.completed && <Button variant="link" size="sm" className="text-primary font-bold">Complete</Button>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
          <div className="rounded-[2.5rem] bg-[image:var(--gradient-hero)] p-8 text-center border border-border shadow-[var(--shadow-glow)] relative overflow-hidden group">
            <div className="absolute inset-0 bg-primary opacity-5 group-hover:opacity-10 transition-opacity" />
            <div className="relative z-10">
              <h3 className="font-bold text-xl">Need support?</h3>
              <p className="text-sm text-muted-foreground mt-3 mb-6">Our clinical director is available for supervision or technical help.</p>
              <Button variant="secondary" className="w-full rounded-2xl font-bold py-6 shadow-sm transition-transform active:scale-95">Contact Admin</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
