import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { 
  MessageSquare, 
  Search,
  Clock,
  Sparkles,
  User
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  const [search, setSearch] = useState("");
  const [selectedChat, setSelectedChat] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && (!user || (roles.includes("client") && !intakeCompleted))) {
      navigate({ to: user ? "/onboarding" : "/auth", search: user ? undefined : { mode: "signin" } } as any);
    }
  }, [authLoading, user, intakeCompleted, roles, navigate]);

  const { data: chats, isLoading } = useQuery({
    queryKey: ["chats", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      // Fetch bookings to get therapists info and latest messages
      const { data: bookings, error: bError } = await supabase
        .from("bookings")
        .select("id, status, therapists(id, full_name, avatar_url), messages(*)")
        .order("created_at", { ascending: false });
      
      if (bError) throw bError;
      
      return bookings.map(b => ({
        id: b.id,
        therapist: b.therapists,
        lastMessage: b.messages?.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0],
        unreadCount: b.messages?.filter((m: any) => !m.is_read && m.sender_id !== user?.id).length || 0,
        status: b.status
      }));
    },
    enabled: !!user,
  });

  const filteredChats = chats?.filter(c => 
    c.therapist?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Sparkles className="h-6 w-6 animate-pulse text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <SiteHeader />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - List of Chats */}
        <div className={`
          ${selectedChat ? 'hidden md:flex' : 'flex'} 
          flex-col w-full md:w-[350px] lg:w-[400px] border-r border-border bg-card
        `}>
          <div className="p-6 border-b border-border space-y-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Inbox</h1>
              <p className="text-xs text-muted-foreground mt-1 font-medium">Your sanctuary for conversation</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search conversations..." 
                className="pl-10 h-10 rounded-2xl bg-slate-50 border-transparent focus-visible:bg-white focus-visible:ring-primary/20 transition-all text-sm font-medium" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({length: 6}).map((_, i) => (
                  <div key={i} className="flex gap-3 p-3 animate-pulse">
                    <div className="h-12 w-12 rounded-2xl bg-slate-50" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-4 w-24 bg-slate-50 rounded" />
                      <div className="h-3 w-full bg-slate-50 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !filteredChats?.length ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="mb-4 grid h-14 w-14 place-items-center rounded-3xl bg-primary-soft text-primary">
                  <MessageSquare className="h-7 w-7" />
                </div>
                <p className="text-[13px] font-bold text-slate-900">No conversations found</p>
                <p className="mt-1 text-xs text-slate-500 font-medium max-w-[180px]">Your messages with therapists will appear here.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {filteredChats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => setSelectedChat(chat)}
                    className={`
                      flex w-full items-center gap-4 p-4 text-left transition-all relative
                      ${selectedChat?.id === chat.id ? 'bg-primary/5' : 'hover:bg-slate-50/50'}
                    `}
                  >
                    {selectedChat?.id === chat.id && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                    )}
                    <div className="relative shrink-0">
                      <Avatar className="h-13 w-13 rounded-2xl border border-slate-100 shadow-subtle">
                        <AvatarImage src={chat.therapist?.avatar_url || undefined} className="object-cover" />
                        <AvatarFallback className="bg-primary-soft text-primary font-bold text-sm">
                          {chat.therapist?.full_name?.split(" ").map((n: string) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      {chat.unreadCount > 0 && (
                        <div className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-primary shadow-sm" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-[14px] text-slate-900 truncate">{chat.therapist?.full_name}</h4>
                        <span className="text-[10px] font-bold text-slate-400 shrink-0">
                          {chat.lastMessage ? format(new Date(chat.lastMessage.created_at), "HH:mm") : ""}
                        </span>
                      </div>
                      <p className={`mt-0.5 text-xs line-clamp-1 font-medium ${chat.unreadCount > 0 ? 'text-slate-900' : 'text-slate-400'}`}>
                        {chat.lastMessage?.message || "Start a conversation."}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                         <Badge variant="outline" className="text-[9px] h-4.5 px-2 rounded-full font-bold capitalize border-slate-200 text-slate-500 bg-white">
                           {chat.status}
                         </Badge>
                         {chat.unreadCount > 0 && (
                           <Badge className="h-4.5 px-1.5 min-w-[18px] justify-center rounded-full text-[9px] font-bold bg-primary">
                             {chat.unreadCount}
                           </Badge>
                         )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content - Chat Area */}
        <div className={`
          ${!selectedChat ? 'hidden md:flex' : 'flex'} 
          flex-1 flex-col bg-slate-50/30 relative
        `}>
          <AnimatePresence mode="wait">
            {selectedChat ? (
              <motion.div 
                key={selectedChat.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
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
                <div className="h-24 w-24 rounded-[2.5rem] bg-white border border-slate-100 shadow-premium flex items-center justify-center mb-8 animate-in fade-in zoom-in duration-500">
                  <MessageSquare className="h-10 w-10 text-primary-soft fill-primary-soft stroke-primary" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Your Sanctuary</h3>
                <p className="mt-2 text-[14px] text-slate-500 max-w-[280px] mx-auto font-medium leading-relaxed">
                  Choose a conversation to continue your journey with your therapist.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
