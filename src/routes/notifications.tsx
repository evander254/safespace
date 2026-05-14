import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Bell, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  Trash2,
  MailOpen,
  Sparkles
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/notifications")({
  component: NotificationsPage,
  head: () => ({ meta: [{ title: "Activity · Safe Space" }] }),
});

function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All notifications marked as read");
    },
  });

  const deleteNotification = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Sparkles className="h-6 w-6 animate-pulse text-primary" />
      </div>
    );
  }

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

  return (
    <div className="min-h-screen bg-background/50">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-8 md:py-12">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
              Activity
              {unreadCount > 0 && (
                <Badge className="rounded-full bg-primary font-bold">
                  {unreadCount} New
                </Badge>
              )}
            </h1>
            <p className="mt-2 text-base text-slate-500 font-medium">Stay updated with your journey on Safe Space.</p>
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-xl h-10 px-4 font-semibold border-slate-200 hover:bg-slate-50 transition-all"
              onClick={() => markAllAsRead.mutate()}
              disabled={markAllAsRead.isPending}
            >
              <MailOpen className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-white border border-slate-100 shadow-subtle" />
            ))}
          </div>
        ) : !notifications?.length ? (
          <div className="flex flex-col items-center justify-center p-20 border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-white/50 text-center">
            <div className="mb-6 grid h-20 w-20 place-items-center rounded-3xl bg-primary-soft text-primary shadow-subtle">
              <Bell className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">All caught up</h3>
            <p className="mt-2 text-slate-500 max-w-xs mx-auto font-medium">
              New updates about your bookings and account will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((n) => (
              <div 
                key={n.id} 
                className={`group relative flex items-start gap-5 p-6 rounded-2xl border transition-all duration-300 ${
                  n.is_read 
                  ? 'bg-white border-slate-100' 
                  : 'bg-white border-primary/20 shadow-premium'
                }`}
              >
                <div className={`mt-1 p-3 rounded-xl transition-colors ${n.is_read ? 'bg-slate-50 text-slate-400' : 'bg-primary-soft text-primary shadow-sm'}`}>
                  <Bell className="h-5 w-5" />
                </div>
                
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h4 className={`text-[15px] font-bold ${!n.is_read ? 'text-slate-900' : 'text-slate-600'}`}>
                      {n.title}
                    </h4>
                    <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      {new Date(n.created_at).toLocaleDateString()} · {new Date(n.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <p className="text-[14px] text-slate-500 leading-relaxed font-medium">
                    {n.content}
                  </p>
                  {n.link && (
                    <div className="mt-4">
                      <Button variant="ghost" size="sm" className="h-8 px-3 rounded-lg text-primary text-xs font-bold hover:bg-primary-soft transition-all" asChild>
                        <a href={n.link}>
                          View details <ExternalLink className="ml-1.5 h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                  {!n.is_read && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9 rounded-xl hover:bg-emerald-50" 
                      onClick={() => markAsRead.mutate(n.id)}
                      title="Mark as read"
                    >
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 rounded-xl hover:bg-rose-50 hover:text-rose-500 transition-colors" 
                    onClick={() => deleteNotification.mutate(n.id)}
                    title="Delete"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
