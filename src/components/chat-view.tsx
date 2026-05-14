import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { toast } from "sonner";
import { AlertCircle, Lock, ShieldAlert } from "lucide-react";

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

// Contact detection logic (First Line of Defense)
const containsContactInfo = (text: string) => {
  const patterns = [
    /(07|01)\d{8}/,               // Phone numbers (Kenya focus)
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, // Full email
    /@/,                          // Social handles/partial email
    /https?:\/\/\S+/,             // Full links
    /www\.\S+/,                   // www links
    /wa\.me\/\S+/,                 // WhatsApp links
    /t\.me\/\S+/,                  // Telegram links
    /\.(com|net|org|co|me|io)/i   // Common domains
  ];
  return patterns.some(pattern => pattern.test(text));
};

export function ChatView({ 
  bookingId, 
  recipientId, 
  recipientName, 
  recipientAvatar,
  status,
  onBack 
}: ChatViewProps) {
  const { user, roles } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isRecipientOnline, setIsRecipientOnline] = useState(false);
  const [isRecipientTyping, setIsRecipientTyping] = useState(false);
  const [lastTypingTime, setLastTypingTime] = useState(0);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<any>(null);

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

    // Real-time channel for messages, presence, and typing
    const channel = supabase
      .channel(`chat:${bookingId}`, {
        config: {
          presence: {
            key: user?.id || 'anonymous',
          },
        },
      })
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `booking_id=eq.${bookingId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newMsg = payload.new as Message;
            setMessages((prev) => {
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
            
            // Mark as read if it's from the other person
            if (newMsg.sender_id === recipientId) {
              supabase
                .from("messages")
                .update({ is_read: true })
                .eq("id", newMsg.id)
                .then();
            }
          } else if (payload.eventType === "UPDATE") {
            const updatedMsg = payload.new as Message;
            setMessages((prev) => 
              prev.map((msg) => (msg.id === updatedMsg.id ? updatedMsg : msg))
            );
          }
        }
      )
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const recipientInRoom = Object.values(state).some(
          (presence: any) => presence[0]?.user_id === recipientId
        );
        setIsRecipientOnline(recipientInRoom);
      })
      .on("broadcast", { event: "typing" }, (payload) => {
        if (payload.payload.user_id === recipientId) {
          setIsRecipientTyping(payload.payload.isTyping);
          
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          if (payload.payload.isTyping) {
            // Play a very subtle sound when typing starts? (Maybe too much, let's skip typing sound)
            typingTimeoutRef.current = setTimeout(() => {
              setIsRecipientTyping(false);
            }, 3000);
          }
        }
      })
      .on("broadcast", { event: "new_message" }, (payload) => {
        if (payload.payload.sender_id === recipientId) {
          // Play notification sound
          const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3");
          audio.volume = 0.5;
          audio.play().catch(e => console.log("Sound play failed", e));
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED" && user?.id) {
          await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
        }
      });

    channelRef.current = channel;

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      supabase.removeChannel(channel);
    };
  }, [bookingId, recipientId, user?.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isRecipientTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const messageText = newMessage.trim();
    if (!messageText || !user || isSending) return;

    // Contact sharing block (First Line of Defense)
    if (containsContactInfo(messageText)) {
      toast.error(
        "For your safety and privacy, sharing contact details is not allowed.",
        {
          icon: <ShieldAlert className="h-4 w-4 text-destructive" />,
          duration: 6000,
          description: "Please keep all communications within the Safe Space platform."
        }
      );
      return;
    }

    if (status !== "confirmed") {
      const isTherapist = roles.includes("therapist");
      toast.error(
        isTherapist 
          ? "You must confirm this booking before you can chat with the client."
          : "Please wait for the therapist to confirm your booking before you can send messages.",
        {
          icon: <AlertCircle className="h-4 w-4" />,
          duration: 5000,
        }
      );
      return;
    }

    setIsSending(true);
    
    // Stop typing indicator when sending
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: { user_id: user.id, isTyping: false },
      });
      
      // Notify other side to play sound
      channelRef.current.send({
        type: "broadcast",
        event: "new_message",
        payload: { sender_id: user.id },
      });
    }

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
              <div className={`h-1.5 w-1.5 rounded-full ${isRecipientOnline ? "bg-green-500 animate-pulse" : "bg-slate-300"}`} />
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                {isRecipientOnline ? "Online" : "Offline"}
              </span>
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
                            <div className={`h-1 w-1 rounded-full ${msg.is_read ? "bg-primary" : "bg-muted-foreground/30"} transition-colors duration-300`} />
                         )}
                       </div>
                     </div>
                   </motion.div>
                 );
               })}
             </AnimatePresence>
          </div>
        )}
        
        {/* Typing Indicator Overlay */}
        <AnimatePresence>
          {isRecipientTyping && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex items-center gap-2 px-2 py-1"
            >
              <div className="flex gap-1 bg-muted/30 px-3 py-2 rounded-2xl rounded-tl-none border border-border/50">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce"></span>
              </div>
              <span className="text-[10px] font-medium text-muted-foreground italic">{recipientName} is typing...</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border bg-card/80 backdrop-blur-md">
        {status !== "confirmed" && !isEnded && (
          <div className="mb-3 flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-100 text-amber-800 animate-in fade-in slide-in-from-bottom-2">
            <Lock className="h-4 w-4 shrink-0" />
            <p className="text-[11px] font-medium leading-tight">
              {roles.includes("therapist") 
                ? "Confirm this booking to enable real-time messaging with your client."
                : "Messaging will be enabled once your therapist confirms the booking."}
            </p>
          </div>
        )}
        {isEnded ? (
          <div className="flex flex-col items-center justify-center py-2 px-4 bg-muted/50 rounded-2xl border border-border/50">
             <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Conversation Ended</p>
             <p className="text-[10px] text-muted-foreground mt-0.5">This session has been marked as {status}.</p>
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <Input
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                
                // Broadcast typing status
                const now = Date.now();
                if (now - lastTypingTime > 2000) {
                  setLastTypingTime(now);
                  if (channelRef.current) {
                    channelRef.current.send({
                      type: "broadcast",
                      event: "typing",
                      payload: { user_id: user?.id, isTyping: true },
                    });
                  }
                }
              }}
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
