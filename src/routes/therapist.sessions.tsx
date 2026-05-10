import { createFileRoute } from "@tanstack/react-router";
import { Video, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/therapist/sessions")({
  component: TherapistSessions,
});

function TherapistSessions() {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Video Sessions</h1>
          <p className="text-sm text-muted-foreground">Access your secure clinical video room.</p>
        </div>
        <Button className="rounded-full shadow-[var(--shadow-glow)]">
          <Sparkles className="mr-2 h-4 w-4" /> Test Equipment
        </Button>
      </div>

      <div className="aspect-video rounded-3xl border border-border bg-card flex flex-col items-center justify-center text-center p-12 shadow-[var(--shadow-soft)]">
        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6">
          <Video className="h-10 w-10" />
        </div>
        <h3 className="text-xl font-semibold">No active session</h3>
        <p className="text-muted-foreground max-w-sm mt-2 mb-8">
          Join a session from your bookings or dashboard when it's time to meet with a client.
        </p>
        <div className="flex gap-4">
          <Button variant="outline" className="rounded-full">View Schedule</Button>
          <Button variant="outline" className="rounded-full">Setup Guide</Button>
        </div>
      </div>
    </div>
  );
}
