import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { 
  MessageSquare, 
  Bell, 
  Sparkles, 
  ChevronRight, 
  Search,
  CheckCircle2,
  Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ChatView } from "@/components/chat-view";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { format } from "date-fns";

export const Route = createFileRoute("/messages")({
  component: MessagesPage,
  head: () => ({ meta: [{ title: "Inbox · Safe Space" }] }),
});

function MessagesPage() {
  const { user, loading: authLoading, intakeCompleted, roles } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [tab, setTab] = useState("chats");
  const [selectedChat, setSelectedChat] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && (!user || (roles.includes("client") && !intakeCompleted))) {
      navigate({ to: user ? "/onboarding" : "/auth", search: user ? undefined : { mode: "signin" } } as any);
    }
  }, [authLoading, user, intakeCompleted, roles, navigate]);

  const { data: notifications, isLoading: notificationsLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: chats, isLoading: chatsLoading } = useQuery({
    queryKey: ["chats", user?.id],
    queryFn: async () => {
      // Fetch bookings to get therapists info and latest messages
      const { data: bookings, error: bError } = await supabase
        .from("bookings")
        .select("id, status, therapists(id, full_name, avatar_url), messages(*)")
        .order("created_at", { ascending: false });
      
      if (bError) throw bError;
      
      return bookings.map(b => ({
        id: b.id,
        therapist: b.therapists,
        lastMessage: b.messages?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0],
        unreadCount: b.messages?.filter(m => !m.is_read && m.sender_id !== user?.id).length || 0,
        status: b.status
      }));
    },
    enabled: !!user,
  });

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Sparkles className="h-6 w-6 animate-pulse text-primary" />
      </div>
    );
  }

  const isLoading = notificationsLoading || chatsLoading;
  const unreadNotifications = notifications?.filter(n => !n.is_read).length || 0;
  const unreadChats = chats?.reduce((acc, c) => acc + c.unreadCount, 0) || 0;

  return (
    <div className="min-h-screen bg-background/50 selection:bg-primary/10">
      <SiteHeader />
      
      <main className="mx-auto max-w-7xl px-4 py-8 md:py-12 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Inbox</h1>
            <p className="mt-2 text-base text-slate-500 font-medium">Your sanctuary for conversation and updates.</p>
          </div>
          
          <Tabs value={tab} onValueChange={setTab} className="w-full md:w-auto">
            <TabsList className="grid h-11 w-full grid-cols-2 rounded-xl p-1 md:w-[280px] bg-white border border-slate-100 shadow-subtle">
              <TabsTrigger value="chats" className="rounded-lg gap-2 font-bold text-xs data-[state=active]:shadow-subtle data-[state=active]:bg-slate-50 transition-all text-slate-500 data-[state=active]:text-slate-900">
                <MessageSquare className="h-4 w-4" />
                Chats
                {unreadChats > 0 && (
                  <Badge className="h-4.5 min-w-[18px] justify-center rounded-full bg-primary p-0 text-[9px] font-bold">
                    {unreadChats}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="notifications" className="rounded-lg gap-2 font-bold text-xs data-[state=active]:shadow-subtle data-[state=active]:bg-slate-50 transition-all text-slate-500 data-[state=active]:text-slate-900">
                <Bell className="h-4 w-4" />
                Activity
                {unreadNotifications > 0 && (
                  <Badge className="h-4.5 min-w-[18px] justify-center rounded-full bg-primary p-0 text-[9px] font-bold">
                    {unreadNotifications}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card shadow-soft overflow-hidden">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsContent value="chats" className="m-0 border-none outline-none">
              <div className="flex h-[500px] overflow-hidden">
                {/* Chat List Sidebar */}
                <div className={`
                  ${selectedChat && isMobile ? 'hidden' : 'flex'} 
                  flex-col w-full md:w-[300px] border-r border-border
                `}>
                  {isLoading ? (
                    <div className="p-4 space-y-4">
                      {Array.from({length: 3}).map((_, i) => (
                        <div key={i} className="flex gap-4 animate-pulse">
                          <div className="h-12 w-12 rounded-2xl bg-slate-50" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 w-32 bg-slate-50 rounded" />
                            <div className="h-3 w-full bg-slate-50 rounded" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : !chats?.length ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center">
                      <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-slate-50 text-slate-400">
                        <MessageSquare className="h-6 w-6" />
                      </div>
                      <p className="text-[13px] font-semibold text-slate-500">No conversations yet</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border overflow-y-auto">
                      {chats.map((chat) => (
                        <button
                          key={chat.id}
                          onClick={() => setSelectedChat(chat)}
                          className={`
                            flex w-full items-center gap-3 p-3 text-left transition-all
                            ${selectedChat?.id === chat.id ? 'bg-primary/5' : 'hover:bg-muted/30'}
                          `}
                        >
                          <div className="relative shrink-0">
                            <div className="h-12 w-12 overflow-hidden rounded-2xl bg-muted border border-border shadow-sm">
                              {chat.therapist?.avatar_url ? (
                                <img src={chat.therapist.avatar_url} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-primary-soft text-primary font-bold text-xs">
                                  {chat.therapist?.full_name?.split(" ").map((n: string) => n[0]).join("")}
                                </div>
                              )}
                            </div>
                            {chat.unreadCount > 0 && (
                              <div className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-card bg-destructive" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="font-semibold text-sm truncate">{chat.therapist?.full_name}</h4>
                              <span className="text-[10px] text-muted-foreground shrink-0">
                                {chat.lastMessage ? format(new Date(chat.lastMessage.created_at), "HH:mm") : ""}
                              </span>
                            </div>
                            <p className={`mt-0.5 text-xs line-clamp-1 ${chat.unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                              {chat.lastMessage?.message || "No messages yet."}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Chat Window Area */}
                <div className={`
                  ${!selectedChat && isMobile ? 'hidden' : 'flex'} 
                  flex-1 flex-col bg-muted/5
                `}>
                  <AnimatePresence mode="wait">
                    {selectedChat ? (
                      <motion.div 
                        key={selectedChat.id}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="h-full"
                      >
                        <ChatView
                          bookingId={selectedChat.id}
                          recipientId={selectedChat.therapist?.id}
                          recipientName={selectedChat.therapist?.full_name || "Therapist"}
                          recipientAvatar={selectedChat.therapist?.avatar_url}
                          status={selectedChat.status}
                          onBack={() => setSelectedChat(null)}
                        />
                      </motion.div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                        <div className="h-16 w-16 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-center mb-4">
                          <MessageSquare className="h-8 w-8 text-primary/20" />
                        </div>
                        <h3 className="font-bold">Select a message</h3>
                        <p className="mt-1 text-xs text-muted-foreground max-w-[200px] mx-auto">
                          Choose a conversation to view details and chat with your therapist.
                        </p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="notifications" className="m-0 border-none outline-none">
              {!notifications?.length ? (
                <div className="flex flex-col items-center justify-center p-20 text-center">
                  <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-primary-soft text-primary">
                    <Bell className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-semibold">All caught up</h3>
                  <p className="mt-2 text-sm text-muted-foreground max-w-xs">
                    New updates about your bookings and account will appear here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map((n) => (
                    <div key={n.id} className={`p-5 transition hover:bg-slate-50/50 ${!n.is_read ? 'bg-primary/5' : ''}`}>
                      <div className="flex gap-4">
                        <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${!n.is_read ? 'bg-primary' : 'bg-slate-200'}`} />
                        <div className="flex-1">
                          <h4 className="font-bold text-[14px] text-slate-900">{n.title}</h4>
                          <p className="mt-1 text-[13px] text-slate-600 leading-relaxed">{n.content}</p>
                          <div className="mt-4 flex items-center justify-between">
                            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                              <Clock className="h-3 w-3" />
                              {new Date(n.created_at).toLocaleDateString()} · {new Date(n.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                            {n.link && (
                               <button 
                                 onClick={() => navigate({ to: n.link } as any)}
                                 className="text-xs text-primary font-medium flex items-center hover:underline"
                               >
                                 View details <ChevronRight className="h-3 w-3 ml-0.5" />
                               </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
