import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Bell, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  Trash2,
  MailOpen
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/therapist/notifications")({
  component: TherapistNotifications,
});

function TherapistNotifications() {
  const { user } = useAuth();
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

  if (isLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted/40" />
        ))}
      </div>
    );
  }

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="rounded-full">
                {unreadCount} New
              </Badge>
            )}
          </h1>
          <p className="text-sm text-muted-foreground">Stay updated with your practice activity.</p>
        </div>
        {unreadCount > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-full"
            onClick={() => markAllAsRead.mutate()}
            disabled={markAllAsRead.isPending}
          >
            <MailOpen className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      {!notifications?.length ? (
        <div className="flex flex-col items-center justify-center p-20 border border-dashed rounded-3xl bg-card/50 text-center">
          <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-muted text-muted-foreground">
            <Bell className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-semibold">No notifications yet</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-xs">
            We'll notify you here about new bookings, messages, and system updates.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div 
              key={n.id} 
              className={`group relative flex items-start gap-4 p-5 rounded-2xl border transition-all ${
                n.is_read 
                ? 'bg-card border-border/50 opacity-80' 
                : 'bg-card border-primary/20 shadow-[var(--shadow-soft)]'
              }`}
            >
              <div className={`mt-1 p-2 rounded-xl ${n.is_read ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                <Bell className="h-4 w-4" />
              </div>
              
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className={`font-medium ${!n.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {n.title}
                  </h4>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {n.content}
                </p>
                {n.link && (
                  <div className="mt-3">
                    <Button variant="link" size="sm" className="h-auto p-0 text-primary text-xs" asChild>
                      <a href={n.link}>
                        View details <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {!n.is_read && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full" 
                    onClick={() => markAsRead.mutate(n.id)}
                    title="Mark as read"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full hover:text-destructive" 
                  onClick={() => deleteNotification.mutate(n.id)}
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
