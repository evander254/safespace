import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { 
  Wallet, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Download, 
  Users, 
  ChevronLeft,
  ArrowUpRight,
  TrendingUp,
  UserCheck,
  AlertCircle
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
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/wallets")({
  component: AdminWalletsPage,
  head: () => ({ meta: [{ title: "Wallet Management · Safe Space Admin" }] }),
});

function AdminWalletsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  const { data: wallets, isLoading, error: queryError } = useQuery({
    queryKey: ["admin-wallets"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_all_wallets_admin");
      if (error) {
        console.error("Wallet Fetch Error:", error);
        throw error;
      }
      console.log("Fetched Wallets:", data);
      return data as any[];
    },
  });

  const filteredWallets = wallets?.filter(w => {
    const matchesSearch = 
      w.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "all" || (w.roles && w.roles.includes(roleFilter));
    
    return matchesSearch && matchesRole;
  }).sort((a, b) => {
    return sortOrder === "desc" ? b.balance - a.balance : a.balance - b.balance;
  });

  const handleExport = () => {
    if (!filteredWallets) return;
    const csvContent = [
      ["Name", "Email", "Balance", "Currency", "Roles", "Last Updated"],
      ...filteredWallets.map(w => [
        w.full_name,
        w.email,
        w.balance,
        w.currency,
        w.roles?.join(", "),
        new Date(w.updated_at).toLocaleString()
      ])
    ].map(e => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `safespace_wallets_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalBalance = wallets?.reduce((acc, w) => acc + Number(w.balance), 0) || 0;
  const clientBalance = wallets?.filter(w => w.roles?.includes("client")).reduce((acc, w) => acc + Number(w.balance), 0) || 0;
  const therapistBalance = wallets?.filter(w => w.roles?.includes("therapist")).reduce((acc, w) => acc + Number(w.balance), 0) || 0;

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
      {queryError && (
        <Card className="border-rose-200 bg-rose-50 text-rose-600">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5" />
            <div className="text-sm font-bold">
              Database Error: {(queryError as any).message}
            </div>
          </CardContent>
        </Card>
      )}
      <div className="flex flex-col gap-4">
        <button 
          onClick={() => navigate({ to: "/admin/financials" })}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors w-fit"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Financials
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Wallet Management</h1>
            <p className="text-muted-foreground">Monitor and manage all user account balances.</p>
          </div>
          <Button onClick={handleExport} variant="outline" className="gap-2 rounded-xl border-slate-200">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-[#0a0a0a] border-white/5 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Wallet className="h-12 w-12" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-white/60 text-xs font-bold uppercase tracking-widest">Total Liability</CardDescription>
            <CardTitle className="text-3xl font-bold">KSh {totalBalance.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-white/40 font-medium">Sum of all active wallets</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-black/5 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-primary">
            <Users className="h-12 w-12" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-500 text-xs font-bold uppercase tracking-widest">Client Balances</CardDescription>
            <CardTitle className="text-3xl font-bold">KSh {clientBalance.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-emerald-600 font-bold">{Math.round((clientBalance/totalBalance)*100) || 0}% of total</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-black/5 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-primary">
            <UserCheck className="h-12 w-12" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-500 text-xs font-bold uppercase tracking-widest">Therapist Balances</CardDescription>
            <CardTitle className="text-3xl font-bold">KSh {therapistBalance.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-primary font-bold">{Math.round((therapistBalance/totalBalance)*100) || 0}% of total</p>
          </CardContent>
        </Card>
      </div>

      {/* Table Section */}
      <Card className="border-black/5 shadow-sm bg-white overflow-hidden rounded-2xl">
        <CardHeader className="border-b border-black/5 bg-slate-50/50 py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search by name or email..."
                  className="pl-10 w-full md:w-80 bg-white border-slate-200 focus:border-primary focus:ring-primary/10 rounded-xl h-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-xl border-slate-200 h-10 gap-2 font-medium">
                    <Filter className="h-4 w-4" />
                    {roleFilter === "all" ? "All Users" : roleFilter.charAt(0).toUpperCase() + roleFilter.slice(1) + "s"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 rounded-xl">
                  <DropdownMenuItem onClick={() => setRoleFilter("all")}>All Users</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setRoleFilter("client")}>Clients Only</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setRoleFilter("therapist")}>Therapists Only</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Button 
              variant="ghost" 
              className="gap-2 text-sm font-bold text-slate-500"
              onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
            >
              <ArrowUpDown className="h-4 w-4" />
              Balance: {sortOrder === "desc" ? "High to Low" : "Low to High"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/30">
                <TableRow>
                  <TableHead className="w-[350px] font-bold text-slate-500 uppercase tracking-wider text-[11px] pl-6">User Details</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">Roles</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">Current Balance</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">Currency</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">Last Activity</TableHead>
                  <TableHead className="text-right font-bold text-slate-500 uppercase tracking-wider text-[11px] pr-6">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      <TableCell colSpan={6} className="h-16 bg-slate-50/10" />
                    </TableRow>
                  ))
                ) : filteredWallets?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-40 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <Wallet className="h-10 w-10 mb-2 opacity-20" />
                        <p className="font-medium text-sm">No wallets matching your search</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredWallets?.map((w) => (
                    <TableRow key={w.id} className="group hover:bg-slate-50/50 transition-colors">
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                            {w.avatar_url ? (
                              <img src={w.avatar_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <Users className="h-5 w-5 text-slate-400" />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 text-sm">{w.full_name || "Unknown"}</span>
                            <span className="text-[11px] text-slate-500 font-medium">{w.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {w.roles?.map((r: string) => (
                            <Badge 
                              key={r} 
                              variant="outline" 
                              className={cn(
                                "rounded-lg font-bold text-[9px] uppercase px-2 py-0.5 border-none",
                                r === "admin" ? "bg-amber-100 text-amber-700" : r === "therapist" ? "bg-primary/10 text-primary" : "bg-emerald-100 text-emerald-700"
                              )}
                            >
                              {r}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-base font-bold text-slate-900">
                          {Number(w.balance).toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{w.currency}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-700">{new Date(w.updated_at).toLocaleDateString()}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{new Date(w.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Badge className={cn(
                          "rounded-full px-3 py-1 font-bold text-[10px] uppercase",
                          w.balance > 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-slate-100 text-slate-400"
                        )}>
                          {w.balance > 0 ? "Active" : "Empty"}
                        </Badge>
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
