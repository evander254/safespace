import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Send, 
  User, 
  Loader2, 
  ArrowLeft,
  MoreVertical,
  Phone,
  Video
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

interface Message {
  id: string;
  booking_id: string;
  sender_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface ChatViewProps {
  bookingId: string;
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string;
  status?: string;
  onBack?: () => void;
}

export function ChatView({ 
  bookingId, 
  recipientId, 
  recipientName, 
  recipientAvatar,
  status,
  onBack 
}: ChatViewProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .eq("booking_id", bookingId)
          .order("created_at", { ascending: true });

        if (error) throw error;
        setMessages(data || []);
        
        // Mark as read
        if (data && data.length > 0) {
          const unreadIds = data
            .filter(m => !m.is_read && m.sender_id === recipientId)
            .map(m => m.id);
          
          if (unreadIds.length > 0) {
            await supabase
              .from("messages")
              .update({ is_read: true })
              .in("id", unreadIds);
          }
        }
      } catch (err) {
        console.error("Error fetching messages:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat:${bookingId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `booking_id=eq.${bookingId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => [...prev, newMsg]);
          
          // Mark as read if it's from the other person
          if (newMsg.sender_id === recipientId) {
            supabase
              .from("messages")
              .update({ is_read: true })
              .eq("id", newMsg.id)
              .then();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId, recipientId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || isSending) return;

    setIsSending(true);
    try {
      const { error } = await supabase.from("messages").insert({
        booking_id: bookingId,
        sender_id: user.id,
        message: newMessage.trim(),
      });

      if (error) throw error;
      setNewMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setIsSending(false);
    }
  };

  const isEnded = status === "completed" || status === "cancelled";

  return (
    <div className="flex flex-col h-full bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <Avatar className="h-10 w-10 border border-border shadow-sm">
            <AvatarImage src={recipientAvatar} />
            <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-sm">{recipientName}</h3>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Online</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-primary">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-primary">
            <Video className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-6 bg-[radial-gradient(circle_at_top_right,var(--primary-soft)_0%,transparent_20%)]"
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
            <p className="text-xs text-muted-foreground animate-pulse">Loading conversation...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="h-16 w-16 rounded-2xl bg-primary/5 flex items-center justify-center mb-4">
              <Send className="h-8 w-8 text-primary/20" />
            </div>
            <h4 className="font-semibold text-sm">Start the conversation</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
              Send a message to {recipientName} to begin your session details.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
             {/* Group messages by date could be added here */}
             <AnimatePresence initial={false}>
               {messages.map((msg) => {
                 const isMe = msg.sender_id === user?.id;
                 return (
                   <motion.div
                     key={msg.id}
                     initial={{ opacity: 0, y: 10, scale: 0.95 }}
                     animate={{ opacity: 1, y: 0, scale: 1 }}
                     transition={{ duration: 0.2 }}
                     className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                   >
                     <div className={`max-w-[80%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                       <div 
                         className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                           isMe 
                             ? "bg-primary text-primary-foreground rounded-tr-none" 
                             : "bg-muted/50 border border-border/50 text-foreground rounded-tl-none"
                         }`}
                       >
                         {msg.message}
                       </div>
                       <div className="mt-1 flex items-center gap-1.5 px-1">
                         <span className="text-[10px] text-muted-foreground">
                           {format(new Date(msg.created_at), "HH:mm")}
                         </span>
                         {isMe && (
                            <div className={`h-1 w-1 rounded-full ${msg.is_read ? "bg-primary" : "bg-muted-foreground/30"}`} />
                         )}
                       </div>
                     </div>
                   </motion.div>
                 );
               })}
             </AnimatePresence>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border bg-card/80 backdrop-blur-md">
        {isEnded ? (
          <div className="flex flex-col items-center justify-center py-2 px-4 bg-muted/50 rounded-2xl border border-border/50">
             <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Conversation Ended</p>
             <p className="text-[10px] text-muted-foreground mt-0.5">This session has been marked as {status}.</p>
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 h-11 rounded-full bg-muted/30 border-border/50 focus-visible:ring-primary/20"
              disabled={isSending}
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={!newMessage.trim() || isSending}
              className="h-11 w-11 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-transform active:scale-95"
            >
              {isSending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
