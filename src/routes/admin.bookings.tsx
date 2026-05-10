import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { 
  Calendar,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  MoreVertical,
  ChevronRight,
  ShieldCheck,
  Download,
  User,
  Stethoscope,
  Clock3,
  CalendarCheck
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/admin/bookings")({
  component: AdminBookings,
  head: () => ({ meta: [{ title: "System Bookings · Safe Space Admin" }] }),
});

const statusColor: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600 border-amber-200/50",
  confirmed: "bg-blue-500/10 text-blue-600 border-blue-200/50",
  completed: "bg-emerald-500/10 text-emerald-600 border-emerald-200/50",
  cancelled: "bg-rose-500/10 text-rose-600 border-rose-200/50",
};

function AdminBookings() {
  const { roles, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    const superAdminSession = localStorage.getItem("safespace_admin_session");
    const isSuperAdmin = superAdminSession && JSON.parse(superAdminSession).expiry > Date.now();

    if (!roles.includes("admin") && !isSuperAdmin) {
      navigate({ to: "/admin/safespace/loginHere" });
    } else {
      setAuthorized(true);
      fetchBookings();
    }
  }, [roles, authLoading, navigate]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_all_bookings_admin");
      if (error) throw error;
      setBookings(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch bookings.");
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchesSearch = 
        b.therapist?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.client?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.id?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || b.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [bookings, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: bookings.length,
      pending: bookings.filter(b => b.status === "pending").length,
      confirmed: bookings.filter(b => b.status === "confirmed").length,
      completed: bookings.filter(b => b.status === "completed").length,
    };
  }, [bookings]);

  if (authLoading || !authorized) {
    return null;
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-bold tracking-tight">System Bookings</h2>
          <div className="text-muted-foreground text-sm flex items-center gap-2">
            Monitor all therapy sessions and booking lifecycle across the platform
            <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-bold text-[10px]">
              {bookings.length} TOTAL RECORDS
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl border-black/[0.05] bg-white gap-2 shadow-sm">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rounded-2xl border-black/[0.03] bg-white shadow-sm transition-all hover:shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Bookings</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-black/[0.02] text-black/60 flex items-center justify-center border border-black/[0.05]">
                <Calendar className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-black/[0.03] bg-white shadow-sm transition-all hover:shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-200/50">
                <Clock3 className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-black/[0.03] bg-white shadow-sm transition-all hover:shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Confirmed</p>
                <p className="text-2xl font-bold">{stats.confirmed}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center border border-blue-200/50">
                <CalendarCheck className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-black/[0.03] bg-white shadow-sm transition-all hover:shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-200/50">
                <CheckCircle className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-black/[0.03] shadow-sm">
        <div className="relative w-full md:w-[400px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by therapist, client, or ID..." 
            className="pl-10 h-11 rounded-xl border-black/[0.05] bg-black/[0.01]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
          {["all", "pending", "confirmed", "completed", "cancelled"].map((status) => (
            <Button 
              key={status}
              variant={statusFilter === status ? "default" : "ghost"} 
              size="sm" 
              className={cn(
                "rounded-full px-4 h-9 text-xs font-bold uppercase tracking-wider transition-all",
                statusFilter === status ? "bg-black text-white shadow-md" : "text-muted-foreground hover:text-black hover:bg-black/5"
              )}
              onClick={() => setStatusFilter(status)}
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      {/* Bookings Table */}
      <Card className="border-black/[0.03] bg-white shadow-sm overflow-hidden rounded-2xl">
        <Table>
          <TableHeader>
            <TableRow className="bg-black/[0.01] hover:bg-black/[0.01]">
              <TableHead className="font-bold py-5 pl-6">Therapist</TableHead>
              <TableHead className="font-bold">Client</TableHead>
              <TableHead className="font-bold">Session Schedule</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="font-bold">Fee</TableHead>
              <TableHead className="text-right font-bold pr-8">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center text-muted-foreground italic">
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative h-12 w-12">
                      <Clock className="h-12 w-12 animate-spin text-primary/20" />
                      <Calendar className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary" />
                    </div>
                    <span className="font-medium animate-pulse">Syncing system bookings...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredBookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center text-muted-foreground italic">
                  <div className="flex flex-col items-center gap-2">
                    <Search className="h-8 w-8 text-muted-foreground/30" />
                    No bookings found matching your filters.
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredBookings.map((b) => (
                <TableRow key={b.id} className="hover:bg-black/[0.005] transition-colors group">
                  <TableCell className="py-6 pl-6">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center font-bold text-primary text-xs shadow-inner overflow-hidden border border-primary/10">
                        {b.therapist?.avatar_url ? (
                          <img src={b.therapist.avatar_url} alt={b.therapist.full_name} className="h-full w-full object-cover" />
                        ) : (
                          b.therapist?.full_name?.charAt(0) || <Stethoscope className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-black group-hover:text-primary transition-colors">{b.therapist?.full_name || 'Unassigned'}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Therapist</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-black/5 flex items-center justify-center font-bold text-black/40 text-xs shadow-inner overflow-hidden border border-black/10">
                        {b.client?.avatar_url ? (
                          <img src={b.client.avatar_url} alt={b.client.full_name} className="h-full w-full object-cover" />
                        ) : (
                          b.client?.full_name?.charAt(0) || <User className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-black/80">{b.client?.full_name || 'Anonymous'}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Client</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 text-xs font-bold text-black/80">
                        <Calendar className="h-3 w-3 text-primary" />
                        {b.session_date}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1">
                        <Clock className="h-3 w-3" />
                        {b.session_time?.slice(0, 5)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("rounded-full px-3 py-0.5 text-[9px] font-bold uppercase tracking-wider border-none", statusColor[b.status] || "bg-muted text-muted-foreground")}>
                      {b.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-black">KES {b.therapist?.price_per_session || '0'}</span>
                      <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">Transaction</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <div className="flex justify-end gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-black/5">
                            <MoreVertical className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-xl border-black/[0.08] shadow-xl p-2">
                          <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold px-2 py-1.5">Booking Actions</DropdownMenuLabel>
                          <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer focus:bg-primary/5 focus:text-primary">
                            <Calendar className="h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer">
                            <User className="h-4 w-4" /> View Client Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer">
                            <Stethoscope className="h-4 w-4" /> View Therapist
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-black/5" />
                          <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer text-rose-600 focus:bg-rose-50 focus:text-rose-700">
                            <XCircle className="h-4 w-4" /> Cancel Booking
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-9 w-9 p-0 rounded-xl text-primary hover:bg-primary/5 hover:text-primary shadow-sm border border-primary/10"
                        onClick={() => navigate({ to: `/therapists/${b.therapist_id}` })}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
