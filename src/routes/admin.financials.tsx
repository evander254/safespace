import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  DollarSign, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MoreHorizontal,
  ArrowUpRight,
  TrendingUp,
  Users,
  Wallet,
  Calendar,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/financials")({
  component: AdminFinancialsPage,
});

function AdminFinancialsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: requests, isLoading } = useQuery({
    queryKey: ["admin-topup-requests"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_all_topup_requests_admin");
      if (error) throw error;
      return data as any[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "approved" | "rejected" }) => {
      const { error } = await supabase.rpc("update_topup_status_admin", {
        p_request_id: id,
        p_status: status
      });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast.success(`Request ${variables.status} successfully`);
      queryClient.invalidateQueries({ queryKey: ["admin-topup-requests"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update request");
    }
  });

  const filteredRequests = requests?.filter(req => {
    const matchesSearch = 
      req.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.reference_code?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || req.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    pending: requests?.filter(r => r.status === "pending").length || 0,
    totalPendingAmount: requests?.filter(r => r.status === "pending").reduce((acc, r) => acc + Number(r.amount), 0) || 0,
    approvedToday: requests?.filter(r => r.status === "approved" && new Date(r.created_at).toDateString() === new Date().toDateString()).length || 0,
    totalApproved: requests?.filter(r => r.status === "approved").reduce((acc, r) => acc + Number(r.amount), 0) || 0,
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle2 className="h-3.5 w-3.5" />;
      case "rejected": return <XCircle className="h-3.5 w-3.5" />;
      default: return <Clock className="h-3.5 w-3.5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "rejected": return "bg-rose-500/10 text-rose-500 border-rose-500/20";
      default: return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Financials</h1>
        <p className="text-muted-foreground">Manage wallet top-ups and financial transactions.</p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-[#0a0a0a] border-white/5 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Clock className="h-12 w-12" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-white/60 text-xs font-bold uppercase tracking-widest">Pending Requests</CardDescription>
            <CardTitle className="text-3xl font-bold">{stats.pending}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-white/40 font-medium">Value: KSh {stats.totalPendingAmount.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-black/5 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-primary">
            <TrendingUp className="h-12 w-12" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-500 text-xs font-bold uppercase tracking-widest">Approved Today</CardDescription>
            <CardTitle className="text-3xl font-bold">{stats.approvedToday}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-emerald-600 font-bold">+ {stats.approvedToday > 0 ? "Active" : "None"}</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-black/5 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-primary">
            <DollarSign className="h-12 w-12" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-500 text-xs font-bold uppercase tracking-widest">Total Approved</CardDescription>
            <CardTitle className="text-3xl font-bold">KSh {stats.totalApproved.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-400 font-medium">All-time top-ups</p>
          </CardContent>
        </Card>

        <Card className="bg-primary text-white border-none shadow-lg shadow-primary/20 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <Wallet className="h-12 w-12" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-white/70 text-xs font-bold uppercase tracking-widest">Quick Action</CardDescription>
            <CardTitle className="text-xl font-bold">Manage Wallets</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              variant="secondary" 
              size="sm" 
              className="w-full bg-white/10 hover:bg-white/20 border-none text-white text-xs font-bold"
              onClick={() => navigate({ to: "/admin/wallets" })}
            >
              View All Wallets
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Section */}
      <Card className="border-black/5 shadow-sm bg-white overflow-hidden">
        <CardHeader className="border-b border-black/5 bg-slate-50/50 py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-xl font-bold">Top-up Requests</CardTitle>
              <CardDescription>Review and approve user balance additions.</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search user or reference..."
                  className="pl-10 w-full md:w-64 bg-white border-slate-200 focus:border-primary focus:ring-primary/10 rounded-xl h-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-xl border-slate-200 h-10 gap-2 font-medium">
                    <Filter className="h-4 w-4" />
                    {statusFilter === "all" ? "All Status" : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 rounded-xl">
                  <DropdownMenuItem onClick={() => setStatusFilter("all")}>All Status</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("pending")}>Pending</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("approved")}>Approved</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("rejected")}>Rejected</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/30">
                <TableRow>
                  <TableHead className="w-[280px] font-bold text-slate-500 uppercase tracking-wider text-[11px]">User</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">Method</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">Amount</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">Reference</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">Date</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">Status</TableHead>
                  <TableHead className="text-right font-bold text-slate-500 uppercase tracking-wider text-[11px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      <TableCell colSpan={7} className="h-16 bg-slate-50/10" />
                    </TableRow>
                  ))
                ) : filteredRequests?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-40 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <Clock className="h-10 w-10 mb-2 opacity-20" />
                        <p className="font-medium text-sm">No requests found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests?.map((req) => (
                    <TableRow key={req.id} className="group hover:bg-slate-50/50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                            {req.profiles?.avatar_url ? (
                              <img src={req.profiles.avatar_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <Users className="h-5 w-5 text-slate-400" />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 text-sm">{req.profiles?.full_name || "User"}</span>
                            <span className="text-[11px] text-slate-500 font-medium">{req.profiles?.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="rounded-lg bg-slate-50 text-slate-600 border-slate-200 font-bold text-[10px] uppercase px-2 py-0.5">
                          {req.method}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-bold text-slate-900">KSh {Number(req.amount).toLocaleString()}</TableCell>
                      <TableCell>
                        <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                          {req.reference_code || "NONE"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-700">{new Date(req.created_at).toLocaleDateString()}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("rounded-full flex items-center gap-1.5 w-fit font-bold text-[10px] uppercase px-3 py-1 border", getStatusColor(req.status))}>
                          {getStatusIcon(req.status)}
                          {req.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {req.status === "pending" ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 rounded-lg border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 font-bold text-xs"
                              onClick={() => updateStatusMutation.mutate({ id: req.id, status: "approved" })}
                              disabled={updateStatusMutation.isPending}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 rounded-lg border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-bold text-xs"
                              onClick={() => updateStatusMutation.mutate({ id: req.id, status: "rejected" })}
                              disabled={updateStatusMutation.isPending}
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <div className="text-xs font-bold text-slate-400 flex items-center justify-end gap-1 px-4">
                            Processed <CheckCircle2 className="h-3 w-3" />
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
