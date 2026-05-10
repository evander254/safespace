import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { 
  Calendar, 
  Clock, 
  MoreVertical, 
  CheckCircle2, 
  XCircle, 
  ExternalLink,
  Search,
  Filter,
  User,
  Brain,
  Target,
  Sparkles,
  Heart,
  History as HistoryIcon,
  Phone,
  Mail,
  ShieldAlert
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/therapist/bookings")({
  component: TherapistBookings,
});

function TherapistBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [intakeData, setIntakeData] = useState<any>(null);
  const [loadingIntake, setLoadingIntake] = useState(false);

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from("bookings")
        .select("*, profiles!client_id(id, full_name, avatar_url, phone, email)")
        .eq("therapist_id", user.id)
        .order("session_date", { ascending: false });
      
      if (error) throw error;
      console.log("Therapist bookings fetched:", data);
      setBookings(data || []);
    } catch (err) {
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const fetchClientIntake = async (clientId: string) => {
    setLoadingIntake(true);
    try {
      const { data, error } = await supabase
        .from("client_intake")
        .select("*")
        .eq("user_id", clientId)
        .single();
      
      if (error && error.code !== "PGRST116") throw error;
      setIntakeData(data);
    } catch (err) {
      console.error("Error fetching intake:", err);
      toast.error("Failed to load client intake data");
    } finally {
      setLoadingIntake(false);
    }
  };

  const handleViewProfile = (booking: any) => {
    setSelectedBooking(booking);
    fetchClientIntake(booking.client_id);
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: status as any })
        .eq("id", id);
      
      if (error) {
        toast.error(error.message);
        return;
      }
      
      toast.success(`Booking ${status}`);
      fetchBookings();
      if (selectedBooking?.id === id) {
        setSelectedBooking((prev: any) => ({ ...prev, status }));
      }
    } catch (err: any) {
      toast.error(err.message || "Update failed");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed": return <Badge className="bg-green-500 hover:bg-green-600">Confirmed</Badge>;
      case "pending": return <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20">Pending</Badge>;
      case "completed": return <Badge variant="outline" className="border-primary text-primary">Completed</Badge>;
      case "cancelled": return <Badge variant="destructive">Cancelled</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Session Bookings</h1>
          <p className="text-sm text-muted-foreground">Manage your upcoming and past client sessions.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search clients..." className="pl-9 w-[250px] rounded-full" />
          </div>
          <Button variant="outline" size="icon" className="rounded-full">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="border border-border rounded-3xl overflow-hidden bg-card shadow-[var(--shadow-soft)]">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>Client</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">
                  Loading sessions...
                </TableCell>
              </TableRow>
            ) : bookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">
                  No bookings found.
                </TableCell>
              </TableRow>
            ) : (
              bookings.map((b) => (
                <TableRow key={b.id} className="hover:bg-muted/10 transition-colors group">
                  <TableCell>
                    <div 
                      className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => handleViewProfile(b)}
                    >
                      <div className="h-9 w-9 rounded-full bg-accent flex items-center justify-center font-medium text-accent-foreground text-xs overflow-hidden">
                        {b.profiles?.avatar_url ? (
                          <img src={b.profiles.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          b.profiles?.full_name?.charAt(0) || "?"
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-sm flex items-center gap-1.5">
                          {b.profiles?.full_name || "Guest Client"}
                          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-40 transition-opacity" />
                        </div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-tight">ID: {b.id.slice(0, 8)}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Calendar className="h-3.5 w-3.5 text-primary" />
                        {new Date(b.session_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground text-xs mt-0.5">
                        <Clock className="h-3.5 w-3.5" />
                        {b.session_time}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(b.status)}</TableCell>
                  <TableCell>
                    <div className="text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Mail className="h-3 w-3 text-primary/60" />
                        <span>{b.profiles?.email || "No email"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Phone className="h-3 w-3 text-primary/60" />
                        <span>{b.profiles?.phone || "No phone"}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {b.status === "pending" && (
                        <>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 p-0 rounded-full text-destructive hover:bg-destructive/10"
                            onClick={(e) => { e.stopPropagation(); updateStatus(b.id, "cancelled"); }}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 p-0 rounded-full text-green-600 hover:bg-green-600/10"
                            onClick={(e) => { e.stopPropagation(); updateStatus(b.id, "confirmed"); }}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {b.status === "confirmed" && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0 rounded-full text-primary hover:bg-primary/10"
                          onClick={(e) => { e.stopPropagation(); updateStatus(b.id, "completed"); }}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8 p-0 rounded-full"
                        onClick={() => handleViewProfile(b)}
                      >
                        <User className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
        <SheetContent className="sm:max-w-xl flex flex-col h-full p-0">
          <SheetHeader className="p-6 border-b border-border bg-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-[1.25rem] bg-primary-soft text-primary flex items-center justify-center text-xl font-bold overflow-hidden shadow-sm">
                  {selectedBooking?.profiles?.avatar_url ? (
                    <img src={selectedBooking.profiles.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    selectedBooking?.profiles?.full_name?.charAt(0) || "?"
                  )}
                </div>
                <div>
                  <SheetTitle className="text-2xl font-bold">{selectedBooking?.profiles?.full_name}</SheetTitle>
                  <div className="flex flex-col gap-1.5 mt-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3.5 w-3.5 text-primary" />
                      <span>{selectedBooking?.profiles?.email || "No email available"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 text-primary" />
                      <span>{selectedBooking?.profiles?.phone || "No phone available"}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                {selectedBooking && getStatusBadge(selectedBooking.status)}
                <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-tighter">Booking Status</p>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {loadingIntake ? (
              <div className="space-y-6">
                <Skeleton className="h-32 w-full rounded-2xl" />
                <Skeleton className="h-48 w-full rounded-2xl" />
              </div>
            ) : !intakeData ? (
              <div className="py-12 text-center text-muted-foreground">
                <User className="h-12 w-12 mx-auto opacity-20 mb-4" />
                <p>No clinical intake data available for this client yet.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Presenting Concerns */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-primary">
                    <Brain className="h-5 w-5" />
                    <h3 className="font-bold text-lg">Presenting Concerns</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {intakeData.primary_concerns?.map((c: string) => (
                      <Badge key={c} variant="secondary" className="rounded-full px-4 py-1">{c}</Badge>
                    ))}
                  </div>
                  {intakeData.concern_trigger && (
                    <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 italic text-sm text-muted-foreground leading-relaxed">
                      "{intakeData.concern_trigger}"
                    </div>
                  )}
                </section>

                {/* Goals */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-primary">
                    <Target className="h-5 w-5" />
                    <h3 className="font-bold text-lg">Therapy Goals</h3>
                  </div>
                  <div className="grid gap-3">
                    {intakeData.therapy_goals?.map((g: string) => (
                      <div key={g} className="flex items-start gap-3 p-3 rounded-xl bg-primary/5 text-sm">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                        <span>{g}</span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* therapeutic Style */}
                <section className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl border border-border/50 bg-card">
                    <div className="flex items-center gap-2 text-primary mb-3">
                      <Sparkles className="h-4 w-4" />
                      <h4 className="font-bold text-sm">Preferred Style</h4>
                    </div>
                    <p className="text-sm font-medium capitalize">{intakeData.therapeutic_style}</p>
                  </div>
                  <div className="p-4 rounded-2xl border border-border/50 bg-card">
                    <div className="flex items-center gap-2 text-primary mb-3">
                      <Brain className="h-4 w-4" />
                      <h4 className="font-bold text-sm">Preferred Approach</h4>
                    </div>
                    <p className="text-sm font-medium capitalize">{intakeData.therapy_approach?.replace('-', ' ')}</p>
                  </div>
                </section>

                {/* Identity */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-primary">
                    <Heart className="h-5 w-5" />
                    <h3 className="font-bold text-lg">Identity & Culture</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Gender</span>
                      <p className="font-medium">{intakeData.gender || "N/A"}</p>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Ethnicity</span>
                      <p className="font-medium">{intakeData.ethnicity || "N/A"}</p>
                    </div>
                  </div>
                </section>

                {/* Safety & History */}
                <section className="space-y-4 p-5 rounded-[2rem] bg-rose-500/[0.03] border border-rose-500/10">
                  <div className="flex items-center gap-2 text-rose-600">
                    <ShieldAlert className="h-5 w-5" />
                    <h3 className="font-bold text-lg">Safety & History</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Previous Therapy</span>
                      <p className="font-medium capitalize">{intakeData.previous_therapy}</p>
                      {intakeData.previous_therapy_feedback && (
                        <p className="mt-1 text-xs text-muted-foreground italic">"{intakeData.previous_therapy_feedback}"</p>
                      )}
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Current Safety Status</span>
                      <p className="font-bold text-rose-600 uppercase tracking-wider">{intakeData.current_safety}</p>
                    </div>
                  </div>
                </section>

                {/* Logistic info */}
                <section className="space-y-4 pb-12">
                  <div className="flex items-center gap-2 text-primary">
                    <HistoryIcon className="h-5 w-5" />
                    <h3 className="font-bold text-lg">Logistics</h3>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Communication Channel</span>
                    <p className="font-medium capitalize">{intakeData.preferred_channel}</p>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Availability</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {intakeData.availability?.map((d: string) => (
                        <Badge key={d} variant="outline" className="text-[10px] uppercase font-bold">{d}</Badge>
                      ))}
                    </div>
                  </div>
                </section>
              </div>
            )}
          </div>

          {/* Action Footer */}
          {selectedBooking?.status === "pending" && (
            <div className="p-6 border-t border-border bg-card flex gap-4">
              <Button 
                variant="outline" 
                className="flex-1 h-12 rounded-2xl text-destructive border-destructive/20 hover:bg-destructive/10"
                onClick={() => updateStatus(selectedBooking.id, "cancelled")}
              >
                <XCircle className="h-4 w-4 mr-2" /> Decline Request
              </Button>
              <Button 
                className="flex-1 h-12 rounded-2xl bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20"
                onClick={() => updateStatus(selectedBooking.id, "confirmed")}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" /> Confirm Booking
              </Button>
            </div>
          )}

          {selectedBooking?.status === "confirmed" && (
            <div className="p-6 border-t border-border bg-card flex gap-4">
              <Button 
                className="flex-1 h-12 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                onClick={() => updateStatus(selectedBooking.id, "completed")}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" /> Mark as Completed
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
