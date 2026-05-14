import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, LogOut, Menu, MessageSquare, Bell, User, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

export function SiteHeader() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  // Notifications Query
  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Real-time notifications
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`user-notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Play sound
          const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3");
          audio.volume = 0.5;
          audio.play().catch(e => console.log("Sound play failed", e));
          
          // Refresh notifications
          queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const markAllAsRead = async () => {
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
  };

  const markAsRead = async (id: string) => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-100 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5 font-semibold group">
          <div className="relative flex h-8 w-8 items-center justify-center">
            <div className="absolute inset-0 bg-primary/20 rounded-[40%_60%_70%_30%] animate-[pulse_4s_infinite] blur-sm"></div>
            <div className="relative h-7 w-7 bg-primary rounded-[60%_40%_30%_70%] flex items-center justify-center text-primary-foreground shadow-subtle transition-transform group-hover:scale-110">
              <Heart className="h-3.5 w-3.5 fill-current" />
            </div>
          </div>
          <span className="text-[17px] tracking-tight font-bold text-slate-900">Safe Space</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link to="/therapists" className="rounded-full px-4 py-1.5 text-[13px] font-medium text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-900" activeProps={{ className: "text-slate-900 bg-slate-50" }}>
            Find a therapist
          </Link>
          {user && (
            <>
              <Link to="/bookings" className="rounded-full px-4 py-1.5 text-[13px] font-medium text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-900" activeProps={{ className: "text-slate-900 bg-slate-50" }}>
                My bookings
              </Link>
              <div className="flex items-center gap-2 border-l border-slate-100 pl-4 ml-2">
                <Link to="/messages" className="relative group/nav grid h-8 w-8 place-items-center rounded-full text-slate-400 transition-all hover:bg-slate-50 hover:text-slate-900" activeProps={{ className: "text-slate-900 bg-slate-50" }}>
                  <MessageSquare className="h-4 w-4 transition-transform group-hover/nav:scale-110" />
                </Link>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="relative group/nav grid h-8 w-8 place-items-center rounded-full text-slate-400 transition-all hover:bg-slate-50 hover:text-slate-900">
                      <Bell className="h-4 w-4 transition-transform group-hover/nav:scale-110" />
                      {unreadCount > 0 && (
                        <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-white shadow-sm ring-2 ring-white">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 rounded-2xl p-2 shadow-premium border-slate-100">
                    <div className="flex items-center justify-between px-3 py-2">
                      <DropdownMenuLabel className="p-0 text-sm font-bold">Notifications</DropdownMenuLabel>
                      {unreadCount > 0 && (
                        <button 
                          onClick={markAllAsRead}
                          className="text-[11px] font-semibold text-primary hover:underline"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <DropdownMenuSeparator className="bg-slate-50" />
                    <ScrollArea className="h-80">
                      {!notifications.length ? (
                        <div className="flex flex-col items-center justify-center p-8 text-center">
                          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
                            <Bell className="h-5 w-5" />
                          </div>
                          <p className="text-xs font-medium text-slate-500">All caught up!</p>
                        </div>
                      ) : (
                        <div className="space-y-1 py-1">
                          {notifications.map((n) => (
                            <DropdownMenuItem 
                              key={n.id}
                              className={`flex flex-col items-start gap-1 p-3 rounded-xl cursor-pointer transition-colors ${!n.is_read ? 'bg-primary/5' : 'hover:bg-slate-50'}`}
                              onClick={() => {
                                markAsRead(n.id);
                                if (n.link) navigate({ to: n.link } as any);
                              }}
                            >
                              <div className="flex w-full items-center justify-between gap-2">
                                <span className={`text-[13px] font-bold leading-tight ${!n.is_read ? 'text-slate-900' : 'text-slate-600'}`}>
                                  {n.title}
                                </span>
                                {!n.is_read && (
                                  <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                                )}
                              </div>
                              <p className="text-[12px] text-slate-500 line-clamp-2 leading-relaxed">
                                {n.content}
                              </p>
                              <span className="mt-1 text-[10px] font-medium text-slate-400">
                                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                              </span>
                            </DropdownMenuItem>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                    <DropdownMenuSeparator className="bg-slate-50" />
                    <Link 
                      to="/notifications" 
                      className="flex w-full items-center justify-center py-2 text-[11px] font-bold text-slate-500 hover:text-slate-900"
                    >
                      View all activity
                    </Link>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Link to="/profile" className="group/nav grid h-8 w-8 place-items-center rounded-full text-slate-400 transition-all hover:bg-slate-50 hover:text-slate-900" activeProps={{ className: "text-slate-900 bg-slate-50" }}>
                  <User className="h-4 w-4 transition-transform group-hover/nav:scale-110" />
                </Link>
              </div>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <Button variant="ghost" size="sm" className="hidden h-9 rounded-xl px-4 md:flex text-slate-600 font-semibold" onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </Button>
          ) : (
            <Button size="sm" asChild className="hidden h-9 rounded-xl px-5 md:flex shadow-subtle font-semibold">
              <Link to="/auth" search={{ mode: "signin" } as any}>Sign in</Link>
            </Button>
          )}
          <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 rounded-lg" onClick={() => setOpen(!open)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="container mx-auto border-t border-border p-4 md:hidden">
          <nav className="flex flex-col gap-2">
            <Link to="/therapists" className="rounded-lg px-3 py-2 text-sm hover:bg-muted" onClick={() => setOpen(false)}>
              Find a therapist
            </Link>
            {user && (
              <>
                <Link to="/messages" className="rounded-lg px-3 py-2 text-sm hover:bg-muted" onClick={() => setOpen(false)}>
                  Inbox
                </Link>
                <Link to="/bookings" className="rounded-lg px-3 py-2 text-sm hover:bg-muted" onClick={() => setOpen(false)}>
                  My bookings
                </Link>
                <Link to="/profile" className="rounded-lg px-3 py-2 text-sm hover:bg-muted" onClick={() => setOpen(false)}>
                  My Profile
                </Link>
              </>
            )}
            {user ? (
              <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate({ to: "/" }); setOpen(false); }}>
                Sign out
              </Button>
            ) : (
              <Button size="sm" asChild className="rounded-full">
                <Link to="/auth" search={{ mode: "signin" } as any} onClick={() => setOpen(false)}>Sign in</Link>
              </Button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}