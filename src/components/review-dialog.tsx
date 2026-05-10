import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ReviewDialogProps {
  booking: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ReviewDialog({ booking, open, onOpenChange, onSuccess }: ReviewDialogProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a star rating");
      return;
    }

    if (!user?.id || !booking?.id) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("reviews").insert({
        booking_id: booking.id,
        client_id: user.id,
        therapist_id: booking.therapist_id || booking.therapists?.id,
        rating,
        comment: comment.trim(),
      });

      if (error) {
        if (error.message.includes("unique")) {
          toast.error("You have already reviewed this session.");
        } else {
          throw error;
        }
      } else {
        toast.success("Thank you for your feedback!");
        onSuccess();
        onOpenChange(false);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-[2rem]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Rate your Session</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            How was your session with {booking?.therapists?.full_name}? Your feedback helps our community.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 flex flex-col items-center gap-6">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
                className="transition-transform active:scale-90 hover:scale-110"
              >
                <Star
                  className={`h-10 w-10 ${
                    star <= (hoveredRating || rating)
                      ? "fill-amber-500 text-amber-500"
                      : "text-muted-foreground/20"
                  }`}
                />
              </button>
            ))}
          </div>

          <div className="w-full space-y-2">
            <label className="text-sm font-semibold px-1">Any comments? (Optional)</label>
            <Textarea
              placeholder="Share your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[100px] rounded-2xl resize-none bg-muted/30 border-border/50 focus-visible:ring-primary"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="rounded-xl bg-primary shadow-lg shadow-primary/20"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...
              </>
            ) : (
              "Submit Review"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
