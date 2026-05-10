import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { 
  Stethoscope,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  MoreVertical,
  ChevronRight,
  ShieldCheck,
  Download,
  Wallet,
  Star,
  MessageSquare,
  Activity,
  Edit3
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

export const Route = createFileRoute("/admin/therapists")({
  component: AdminTherapists,
  head: () => ({ meta: [{ title: "Therapist Management · Safe Space Admin" }] }),
});

function AdminTherapists() {
  const { roles: authRoles, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [therapists, setTherapists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("approved");
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    const superAdminSession = localStorage.getItem("safespace_admin_session");
    const isSuperAdmin = superAdminSession && JSON.parse(superAdminSession).expiry > Date.now();

    if (!authRoles.includes("admin") && !isSuperAdmin) {
      navigate({ to: "/admin/safespace/loginHere" });
    } else {
      setAuthorized(true);
      fetchTherapists();
    }
  }, [authRoles, authLoading, navigate]);

  const fetchTherapists = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_all_therapists_admin");
      if (error) throw error;
      setTherapists(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch therapists.");
    } finally {
      setLoading(false);
    }
  };

  const toggleApproval = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("therapists")
        .update({ is_approved: !currentStatus })
        .eq("id", id);
      
      if (error) throw error;
      
      toast.success(`Therapist ${!currentStatus ? 'approved' : 'deactivated'} successfully.`);
      fetchTherapists();
    } catch (err) {
      toast.error("Failed to update status.");
    }
  };

  const filteredTherapists = useMemo(() => {
    return therapists.filter(t => {
      const matchesSearch = 
        t.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.license_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.jurisdiction?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "approved" && t.is_approved) ||
        (statusFilter === "pending" && !t.is_approved && t.onboarding_completed) ||
        (statusFilter === "incomplete" && !t.onboarding_completed);
      
      return matchesSearch && matchesStatus;
    });
  }, [therapists, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: therapists.length,
      approved: therapists.filter(t => t.is_approved).length,
      pending: therapists.filter(t => !t.is_approved && t.onboarding_completed).length,
      avgRating: (therapists.filter(t => t.rating > 0).reduce((acc, t) => acc + Number(t.rating), 0) / (therapists.filter(t => t.rating > 0).length || 1)).toFixed(1),
    };
  }, [therapists]);

  if (authLoading || !authorized) {
    return null;
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-bold tracking-tight">Therapist Management</h2>
          <div className="text-muted-foreground text-sm flex items-center gap-2">
            Clinical team oversight, vetting, and performance tracking
            <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-bold text-[10px]">
              {therapists.length} TOTAL REGISTERED
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl border-black/[0.05] bg-white gap-2 shadow-sm">
            <Download className="h-4 w-4" />
            Export Roster
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rounded-2xl border-black/[0.03] bg-white shadow-sm transition-all hover:shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active Roster</p>
                <p className="text-2xl font-bold">{stats.approved}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-200/50">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-black/[0.03] bg-white shadow-sm transition-all hover:shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Vetting Queue</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-200/50">
                <Clock className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-black/[0.03] bg-white shadow-sm transition-all hover:shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Avg. Satisfaction</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-2xl font-bold">{stats.avgRating}</p>
                  <span className="text-xs text-muted-foreground">/5.0</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center border border-blue-200/50">
                <Star className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-black/[0.03] bg-white shadow-sm transition-all hover:shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">System Health</p>
                <p className="text-2xl font-bold">Optimal</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-black/[0.02] text-black/60 flex items-center justify-center border border-black/[0.05]">
                <Activity className="h-5 w-5" />
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
            placeholder="Search by name, license, or jurisdiction..." 
            className="pl-10 h-11 rounded-xl border-black/[0.05] bg-black/[0.01]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
          {[
            { label: "Approved", value: "approved" },
            { label: "Pending Vetting", value: "pending" },
            { label: "Incomplete", value: "incomplete" },
            { label: "All", value: "all" }
          ].map((status) => (
            <Button 
              key={status.value}
              variant={statusFilter === status.value ? "default" : "ghost"} 
              size="sm" 
              className={cn(
                "rounded-full px-4 h-9 text-xs font-bold uppercase tracking-wider transition-all",
                statusFilter === status.value ? "bg-black text-white shadow-md" : "text-muted-foreground hover:text-black hover:bg-black/5"
              )}
              onClick={() => setStatusFilter(status.value)}
            >
              {status.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Therapists Table */}
      <Card className="border-black/[0.03] bg-white shadow-sm overflow-hidden rounded-2xl">
        <Table>
          <TableHeader>
            <TableRow className="bg-black/[0.01] hover:bg-black/[0.01]">
              <TableHead className="font-bold py-5 pl-6">Therapist</TableHead>
              <TableHead className="font-bold">Credential</TableHead>
              <TableHead className="font-bold">Jurisdiction</TableHead>
              <TableHead className="font-bold">Rating & Volume</TableHead>
              <TableHead className="font-bold">Wallet Balance</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="text-right font-bold pr-8">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-64 text-center text-muted-foreground italic">
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative h-12 w-12">
                      <Clock className="h-12 w-12 animate-spin text-primary/20" />
                      <Stethoscope className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary" />
                    </div>
                    <span className="font-medium animate-pulse">Scanning clinical roster...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredTherapists.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-64 text-center text-muted-foreground italic">
                  <div className="flex flex-col items-center gap-2">
                    <Search className="h-8 w-8 text-muted-foreground/30" />
                    No therapists found matching your criteria.
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredTherapists.map((t) => (
                <TableRow key={t.id} className="hover:bg-black/[0.005] transition-colors group">
                  <TableCell className="py-6 pl-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center font-bold text-primary text-sm shadow-inner overflow-hidden border border-primary/10">
                        {t.avatar_url ? (
                          <img src={t.avatar_url} alt={t.full_name} className="h-full w-full object-cover" />
                        ) : (
                          t.full_name?.charAt(0)
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-black group-hover:text-primary transition-colors">{t.full_name}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                          Joined {new Date(t.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-black/80">{t.license_type}</span>
                      <code className="text-[10px] text-muted-foreground font-mono mt-1 bg-black/5 px-1.5 py-0.5 rounded w-fit">
                        {t.license_number}
                      </code>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span className="text-xs font-medium text-black/70">{t.jurisdiction}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        {t.rating || '0.0'}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold">
                        <MessageSquare className="h-3 w-3" />
                        {t.reviews_count || 0}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                        <Wallet className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-black">KSh {Number(t.wallet_balance || 0).toLocaleString()}</div>
                        <div className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">Earnings</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(
                      "rounded-full px-3 py-0.5 text-[9px] font-bold uppercase tracking-wider border-none",
                      t.is_approved ? "bg-emerald-500/10 text-emerald-600" : 
                      t.onboarding_completed ? "bg-amber-500/10 text-amber-600" : 
                      "bg-muted text-muted-foreground"
                    )}>
                      {t.is_approved ? "Approved" : t.onboarding_completed ? "Pending Vetting" : "Incomplete"}
                    </Badge>
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
                          <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold px-2 py-1.5">Management Actions</DropdownMenuLabel>
                          <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer focus:bg-primary/5 focus:text-primary">
                            <Edit3 className="h-4 w-4" /> Edit Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer">
                            <Wallet className="h-4 w-4" /> View Earnings
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer">
                            <Star className="h-4 w-4" /> Review History
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-black/5" />
                          <DropdownMenuItem 
                            className={cn("rounded-lg gap-2 cursor-pointer", t.is_approved ? "text-rose-600 focus:bg-rose-50 focus:text-rose-700" : "text-emerald-600 focus:bg-emerald-50 focus:text-emerald-700")}
                            onClick={() => toggleApproval(t.id, t.is_approved)}
                          >
                            {t.is_approved ? (
                              <>
                                <XCircle className="h-4 w-4" /> Deactivate Account
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4" /> Approve Therapist
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-9 w-9 p-0 rounded-xl text-primary hover:bg-primary/5 hover:text-primary shadow-sm border border-primary/10"
                        onClick={() => navigate({ to: `/therapists/${t.id}` })}
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
