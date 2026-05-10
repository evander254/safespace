import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { 
  MessageSquare, 
  Search,
  Clock,
  ChevronRight,
  User
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChatView } from "@/components/chat-view";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { format } from "date-fns";

export const Route = createFileRoute("/therapist/messages")({
  component: TherapistMessages,
});

function TherapistMessages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  const [selectedChat, setSelectedChat] = useState<any>(null);

  const { data: chats, isLoading } = useQuery({
    queryKey: ["therapist-chats", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data: bookings, error } = await supabase
        .from("bookings")
        .select(`
          id, 
          status, 
          profiles!client_id(id, full_name, avatar_url), 
          messages(*)
        `)
        .eq("therapist_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      return bookings.map(b => ({
        id: b.id,
        client: b.profiles,
        lastMessage: (b.messages as any[])?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0],
        unreadCount: (b.messages as any[])?.filter(m => !m.is_read && m.sender_id !== user?.id).length || 0,
        status: b.status
      }));
    },
    enabled: !!user,
  });

  const filteredChats = chats?.filter(c => 
    c.client?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-background">
      {/* Sidebar - List of Chats */}
      <div className={`
        ${selectedChat && isMobile ? 'hidden' : 'flex'} 
        flex-col w-full md:w-[350px] lg:w-[400px] border-r border-border bg-card
      `}>
        <div className="p-6 border-b border-border space-y-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
            <p className="text-xs text-muted-foreground mt-1">Manage client communications</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search clients..." 
              className="pl-9 h-10 rounded-2xl bg-muted/30 border-border/50" 
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
                  <div className="h-12 w-12 rounded-2xl bg-muted" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 w-24 bg-muted rounded" />
                    <div className="h-3 w-full bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : !filteredChats?.length ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-primary/5 text-primary/40">
                <MessageSquare className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No conversations found</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {filteredChats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setSelectedChat(chat)}
                  className={`
                    flex w-full items-center gap-3 p-4 text-left transition-all
                    ${selectedChat?.id === chat.id ? 'bg-primary/5 border-l-4 border-primary' : 'hover:bg-muted/30 border-l-4 border-transparent'}
                  `}
                >
                  <div className="relative shrink-0">
                    <Avatar className="h-12 w-12 rounded-2xl border border-border shadow-sm">
                      <AvatarImage src={chat.client?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/5 text-primary font-bold">
                        {chat.client?.full_name?.charAt(0) || "C"}
                      </AvatarFallback>
                    </Avatar>
                    {chat.unreadCount > 0 && (
                      <div className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-card bg-destructive" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-semibold text-sm truncate">{chat.client?.full_name || "Client"}</h4>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {chat.lastMessage ? format(new Date(chat.lastMessage.created_at), "HH:mm") : ""}
                      </span>
                    </div>
                    <p className={`mt-0.5 text-xs line-clamp-1 ${chat.unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                      {chat.lastMessage?.message || "No messages yet."}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                       <Badge variant="outline" className="text-[9px] h-4 px-1.5 rounded-full font-normal capitalize">
                         {chat.status}
                       </Badge>
                       {chat.unreadCount > 0 && (
                         <Badge variant="destructive" className="h-4 px-1 min-w-[16px] justify-center rounded-full text-[9px]">
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
        ${!selectedChat && isMobile ? 'hidden' : 'flex'} 
        flex-1 flex-col bg-muted/10 relative
      `}>
        <AnimatePresence mode="wait">
          {selectedChat ? (
            <motion.div 
              key={selectedChat.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full"
            >
              <ChatView
                bookingId={selectedChat.id}
                recipientId={selectedChat.client?.id}
                recipientName={selectedChat.client?.full_name || "Client"}
                recipientAvatar={selectedChat.client?.avatar_url || undefined}
                status={selectedChat.status}
                onBack={() => setSelectedChat(null)}
              />
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="h-20 w-20 rounded-[2rem] bg-card border border-border shadow-[var(--shadow-soft)] flex items-center justify-center mb-6">
                <MessageSquare className="h-10 w-10 text-primary/20" />
              </div>
              <h3 className="text-lg font-bold">Select a conversation</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">
                Choose a client from the list to view your session history and start a real-time conversation.
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
