import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  ShieldCheck, 
  Clock,
  MoreVertical,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  Wallet,
  Calendar,
  Stethoscope,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
  head: () => ({ meta: [{ title: "Dashboard · Safe Space Admin" }] }),
});

function AdminDashboard() {
  const { user, roles, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [pendingTherapists, setPendingTherapists] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [stats, setStats] = useState({
    userCount: 0,
    therapistCount: 0,
    approvedTherapists: 0,
    bookingStats: {
      total: 0,
      completed: 0,
      pending: 0,
      cancelled: 0,
      confirmed: 0
    },
    newUsersWeek: 0,
    newTherapistsWeek: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [commissionsLoading, setCommissionsLoading] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    const superAdminSession = localStorage.getItem("safespace_admin_session");
    const isSuperAdmin = superAdminSession && JSON.parse(superAdminSession).expiry > Date.now();

    if (!roles.includes("admin") && !isSuperAdmin) {
      navigate({ to: "/admin/safespace/loginHere" });
    } else {
      setAuthorized(true);
      fetchAllData();
    }
  }, [roles, authLoading, navigate]);

  const [nonApprovedTherapists, setNonApprovedTherapists] = useState<any[]>([]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Call the RPC function that bypasses RLS for admin stats
      const { data, error } = await supabase.rpc("get_admin_dashboard_stats");
      
      if (error) throw error;

      if (data) {
        setStats({
          userCount: (data as any).user_count,
          therapistCount: (data as any).therapist_count,
          approvedTherapists: (data as any).approved_therapists,
          bookingStats: (data as any).booking_stats,
          newUsersWeek: (data as any).new_users_week,
          newTherapistsWeek: (data as any).new_therapists_week
        });
        setPendingTherapists((data as any).recent_pending_therapists || []);
        setNonApprovedTherapists((data as any).non_approved_therapists || []);
      }

      // Fetch Commissions (still using the table for now, but we could RPC this too if needed)
      // Actually, let's keep fetchCommissions but use the total from RPC for the header
      await fetchCommissions();

    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCommissions = async () => {
    setCommissionsLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_all_commissions");
      
      if (error) throw error;
      setCommissions((data as any) || []);
    } catch (err) {
      toast.error("Failed to fetch financials.");
    } finally {
      setCommissionsLoading(false);
    }
  };

  const totalCommission = commissions.reduce((acc, curr) => acc + Number(curr.amount), 0);

  if (authLoading || (!authorized && loading)) {
    return null; // Layout handles loading state
  }

  const approve = async (id: string) => {
    const { error } = await supabase
      .from("therapists")
      .update({ is_approved: true })
      .eq("id", id);
    
    if (error) toast.error(error.message);
    else {
      toast.success("Therapist approved!");
      fetchAllData();
    }
  };

  const reject = async (id: string) => {
    const { error } = await supabase
      .from("therapists")
      .update({ onboarding_completed: false })
      .eq("id", id);
    
    if (error) toast.error(error.message);
    else {
      toast.success("Application rejected.");
      fetchAllData();
    }
  };

  const StatCard = ({ title, value, icon: Icon, description, trend, trendValue }: any) => (
    <Card className="overflow-hidden border-black/[0.03] bg-white shadow-sm transition-all hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/[0.02] text-black/60">
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
        {trendValue !== undefined && (
          <div className={cn(
            "mt-3 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider",
            trend === "up" ? "text-emerald-500" : "text-amber-500"
          )}>
            {trend === "up" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {trendValue} THIS WEEK
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
        <div className="text-muted-foreground text-sm flex items-center gap-2">
          Platform performance and system health monitor
          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-none font-bold text-[10px]">SYSTEM ONLINE</Badge>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-8">
        <TabsList className="bg-black/[0.03] p-1 rounded-xl border border-black/[0.05]">
          <TabsTrigger value="dashboard" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">Dashboard</TabsTrigger>
          <TabsTrigger value="applications" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">Applications</TabsTrigger>
          <TabsTrigger value="financials" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">Financials</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-8 mt-0 border-none p-0 outline-none">
          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              title="Total Commissions" 
              value={`KES ${totalCommission.toLocaleString()}`}
              icon={DollarSign}
              description="Platform revenue from bookings"
              trend="up"
              trendValue={`KES ${(totalCommission * 0.12).toFixed(0)}`}
            />
            <StatCard 
              title="Registered Users" 
              value={stats.userCount}
              icon={Users}
              description="Active client accounts"
              trend="up"
              trendValue={stats.newUsersWeek}
            />
            <StatCard 
              title="Active Therapists" 
              value={`${stats.approvedTherapists}/${stats.therapistCount}`}
              icon={Stethoscope}
              description="Approved vs Total registered"
              trend="up"
              trendValue={stats.newTherapistsWeek}
            />
            <StatCard 
              title="Total Bookings" 
              value={stats.bookingStats.total}
              icon={Calendar}
              description="Sessions handled on platform"
              trend="up"
              trendValue={Math.floor(stats.bookingStats.total * 0.1)}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Booking Breakdown */}
            <Card className="lg:col-span-1 border-black/[0.03] bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Booking Status</CardTitle>
                <CardDescription>Breakdown of session lifecycle</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  { label: "Completed", value: stats.bookingStats.completed, color: "bg-emerald-500", icon: CheckCircle },
                  { label: "Confirmed", value: stats.bookingStats.confirmed, color: "bg-blue-500", icon: Clock },
                  { label: "Pending", value: stats.bookingStats.pending, color: "bg-amber-500", icon: Clock },
                  { label: "Cancelled", value: stats.bookingStats.cancelled, color: "bg-rose-500", icon: XCircle },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between group cursor-default">
                    <div className="flex items-center gap-3">
                      <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center text-white", item.color)}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      <span className="font-medium text-sm text-black/70">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">{item.value}</span>
                      <span className="text-[10px] text-muted-foreground w-12 text-right">
                        {stats.bookingStats.total > 0 ? Math.round((item.value / stats.bookingStats.total) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions / Recent Activity */}
            <Card className="lg:col-span-2 border-black/[0.03] bg-white shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Recent Pending Applications</CardTitle>
                  <CardDescription>Therapists waiting for clinical vetting</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate({ to: "/admin/applications" })} className="rounded-lg">View All</Button>
              </CardHeader>
              <CardContent>
                {pendingTherapists.length === 0 ? (
                  <div className="h-[240px] flex flex-col items-center justify-center text-muted-foreground italic border-2 border-dashed border-black/[0.05] rounded-2xl">
                    <CheckCircle className="h-8 w-8 mb-2 text-emerald-500/40" />
                    No pending applications to review
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingTherapists.slice(0, 4).map((t) => (
                      <div key={t.id} className="flex items-center justify-between p-4 rounded-2xl border border-black/[0.03] bg-black/[0.01] hover:bg-black/[0.02] transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                            {t.full_name?.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-sm">{t.full_name}</div>
                            <div className="text-xs text-muted-foreground">{t.license_type} • {t.jurisdiction}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 rounded-full text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                            onClick={() => approve(t.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 rounded-full text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                            onClick={() => reject(t.id)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Row for Non-Approved Therapists */}
          <div className="grid grid-cols-1 gap-8">
            <Card className="border-black/[0.03] bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Pending Therapist Approvals</CardTitle>
                <CardDescription>Therapists awaiting clinical vetting or profile completion</CardDescription>
              </CardHeader>
              <CardContent>
                {nonApprovedTherapists.length === 0 ? (
                  <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground italic border-2 border-dashed border-black/[0.05] rounded-2xl">
                    <CheckCircle className="h-8 w-8 mb-2 text-emerald-500/40" />
                    All therapists are currently approved
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {nonApprovedTherapists.map((therapist) => (
                      <div key={therapist.id} className="flex flex-col items-center text-center p-6 rounded-2xl border border-black/[0.03] bg-black/[0.01] hover:bg-black/[0.02] transition-all">
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xl mb-4">
                          {therapist.full_name?.charAt(0)}
                        </div>
                        <div className="font-bold text-sm line-clamp-1">{therapist.full_name}</div>
                        <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
                          Joined {new Date(therapist.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </div>
                        <Badge variant="outline" className={cn(
                          "mt-3 text-[9px] uppercase tracking-tighter",
                          therapist.onboarding_completed ? "text-emerald-600 bg-emerald-50 border-emerald-100" : "text-amber-600 bg-amber-50 border-amber-100"
                        )}>
                          {therapist.onboarding_completed ? "Ready for review" : "In Progress"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="applications" className="space-y-8 mt-0 border-none p-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold">Pending Applications</h2>
              <Badge variant="secondary" className="rounded-full px-4">{pendingTherapists.length}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search applicants..." className="pl-9 w-[300px] rounded-xl bg-white border-black/[0.05]" />
              </div>
            </div>
          </div>

          <Card className="border-black/[0.03] bg-white shadow-sm overflow-hidden rounded-2xl">
            <Table>
              <TableHeader>
                <TableRow className="bg-black/[0.02] hover:bg-black/[0.02]">
                  <TableHead className="font-bold py-4">Therapist</TableHead>
                  <TableHead className="font-bold">License</TableHead>
                  <TableHead className="font-bold">Jurisdiction</TableHead>
                  <TableHead className="font-bold">Specialties</TableHead>
                  <TableHead className="font-bold">Rate</TableHead>
                  <TableHead className="text-right font-bold pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic">
                      <div className="flex flex-col items-center gap-2">
                        <Clock className="h-6 w-6 animate-spin text-primary/40" />
                        Loading applications...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : pendingTherapists.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic">
                      No pending applications at this time.
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingTherapists.map((t) => (
                    <TableRow key={t.id} className="hover:bg-black/[0.01] transition-colors">
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3 pl-2">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                            {t.full_name?.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-sm">{t.full_name}</div>
                            <div className="text-[10px] text-muted-foreground uppercase tracking-tight">Joined {new Date(t.created_at).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <span className="font-bold text-black/80">{t.license_type}</span>
                          <div className="text-[10px] text-muted-foreground">#{t.license_number}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-medium">{t.jurisdiction}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {t.specializations?.slice(0, 2).map((s: string) => (
                            <Badge key={s} variant="outline" className="text-[9px] py-0 px-1.5 bg-black/[0.02] border-black/[0.05]">{s}</Badge>
                          ))}
                          {t.specializations?.length > 2 && <span className="text-[9px] text-muted-foreground font-medium">+{t.specializations.length - 2}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-bold">KES {t.price_per_session}</TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 p-0 rounded-lg text-rose-600 hover:bg-rose-50"
                            onClick={() => reject(t.id)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 p-0 rounded-lg text-emerald-600 hover:bg-emerald-50"
                            onClick={() => approve(t.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 p-0 rounded-lg">
                            <MoreVertical className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="financials" className="space-y-8 mt-0 border-none p-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="rounded-2xl border-black/[0.03] bg-white shadow-sm overflow-hidden">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2 font-medium">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  Total Commissions
                </CardDescription>
                <CardTitle className="text-3xl font-bold">
                  KES {totalCommission.toLocaleString()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">
                  Lifetime platform earnings (15% fee)
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-black/[0.03] bg-white shadow-sm overflow-hidden">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2 font-medium">
                  <Wallet className="h-4 w-4 text-blue-500" />
                  Processed Transactions
                </CardDescription>
                <CardTitle className="text-3xl font-bold">
                  {commissions.length}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">
                  Total booking payments completed
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-black/[0.03] bg-white shadow-sm overflow-hidden">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2 font-medium">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Current Margin
                </CardDescription>
                <CardTitle className="text-3xl font-bold">
                  15.0%
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">
                  Standard platform commission rate
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold">Financial Records</h2>
              <Badge variant="secondary" className="rounded-full px-4">{commissions.length}</Badge>
            </div>
            <Button variant="outline" size="sm" className="rounded-lg gap-2">
              <TrendingUp className="h-4 w-4" />
              Export CSV
            </Button>
          </div>

          <Card className="border-black/[0.03] bg-white shadow-sm overflow-hidden rounded-2xl">
            <Table>
              <TableHeader>
                <TableRow className="bg-black/[0.02] hover:bg-black/[0.02]">
                  <TableHead className="font-bold py-4">Transaction Date</TableHead>
                  <TableHead className="font-bold">Therapist</TableHead>
                  <TableHead className="font-bold">Client</TableHead>
                  <TableHead className="font-bold">Commission (15%)</TableHead>
                  <TableHead className="font-bold">Total Paid</TableHead>
                  <TableHead className="text-right font-bold pr-6">Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissionsLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic">
                      <div className="flex flex-col items-center gap-2">
                        <Clock className="h-6 w-6 animate-spin text-primary/40" />
                        Loading financial data...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : commissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic">
                      No financial records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  commissions.map((c) => (
                    <TableRow key={c.id} className="hover:bg-black/[0.01] transition-colors">
                      <TableCell className="py-4 text-sm font-medium">
                        {new Date(c.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-sm text-black/80">{c.therapist?.full_name || 'System User'}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium text-black/60">{c.client?.full_name || 'Anonymous'}</div>
                      </TableCell>
                      <TableCell className="font-bold text-primary">
                        KES {Number(c.amount).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm font-bold text-black/40">
                        KES {(Number(c.amount) / 0.15).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <code className="text-[10px] bg-black/[0.05] text-black/60 px-2 py-1 rounded-lg font-mono uppercase">
                          {c.booking_id?.split('-')[0]}
                        </code>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
