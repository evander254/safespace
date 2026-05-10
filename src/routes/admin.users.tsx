import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { 
  Users,
  Search,
  Filter,
  Shield,
  Clock,
  MoreVertical,
  ChevronRight,
  ShieldCheck,
  Download,
  Wallet,
  Mail,
  Phone,
  UserCheck,
  UserX
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

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
  head: () => ({ meta: [{ title: "User Management · Safe Space Admin" }] }),
});

function AdminUsers() {
  const { roles: authRoles, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    const superAdminSession = localStorage.getItem("safespace_admin_session");
    const isSuperAdmin = superAdminSession && JSON.parse(superAdminSession).expiry > Date.now();

    if (!authRoles.includes("admin") && !isSuperAdmin) {
      navigate({ to: "/admin/safespace/loginHere" });
    } else {
      setAuthorized(true);
      fetchUsers();
    }
  }, [authRoles, authLoading, navigate]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_all_users_admin");
      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch users.");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = 
        u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.phone?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = roleFilter === "all" || u.roles?.includes(roleFilter);
      
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      clients: users.filter(u => u.roles?.includes("client")).length,
      therapists: users.filter(u => u.roles?.includes("therapist")).length,
      admins: users.filter(u => u.roles?.includes("admin")).length,
    };
  }, [users]);

  if (authLoading || !authorized) {
    return null;
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
          <div className="text-muted-foreground text-sm flex items-center gap-2">
            Manage all registered accounts, roles, and platform access
            <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-bold text-[10px]">
              {users.length} TOTAL USERS
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl border-black/[0.05] bg-white gap-2 shadow-sm">
            <Download className="h-4 w-4" />
            Export Users
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rounded-2xl border-black/[0.03] bg-white shadow-sm transition-all hover:shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-black/[0.02] text-black/60 flex items-center justify-center border border-black/[0.05]">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-black/[0.03] bg-white shadow-sm transition-all hover:shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Clients</p>
                <p className="text-2xl font-bold">{stats.clients}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center border border-blue-200/50">
                <UserCheck className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-black/[0.03] bg-white shadow-sm transition-all hover:shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Therapists</p>
                <p className="text-2xl font-bold">{stats.therapists}</p>
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
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Admins</p>
                <p className="text-2xl font-bold">{stats.admins}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-200/50">
                <Shield className="h-5 w-5" />
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
            placeholder="Search by name, ID, or phone..." 
            className="pl-10 h-11 rounded-xl border-black/[0.05] bg-black/[0.01]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
          {["all", "client", "therapist", "admin"].map((role) => (
            <Button 
              key={role}
              variant={roleFilter === role ? "default" : "ghost"} 
              size="sm" 
              className={cn(
                "rounded-full px-4 h-9 text-xs font-bold uppercase tracking-wider transition-all",
                roleFilter === role ? "bg-black text-white shadow-md" : "text-muted-foreground hover:text-black hover:bg-black/5"
              )}
              onClick={() => setRoleFilter(role)}
            >
              {role}
            </Button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <Card className="border-black/[0.03] bg-white shadow-sm overflow-hidden rounded-2xl">
        <Table>
          <TableHeader>
            <TableRow className="bg-black/[0.01] hover:bg-black/[0.01]">
              <TableHead className="font-bold py-5 pl-6">User Profile</TableHead>
              <TableHead className="font-bold">Contact Info</TableHead>
              <TableHead className="font-bold">Roles</TableHead>
              <TableHead className="font-bold">Wallet Balance</TableHead>
              <TableHead className="font-bold">Joined Date</TableHead>
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
                      <Users className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary" />
                    </div>
                    <span className="font-medium animate-pulse">Syncing user database...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center text-muted-foreground italic">
                  <div className="flex flex-col items-center gap-2">
                    <Search className="h-8 w-8 text-muted-foreground/30" />
                    No users found matching your filters.
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((u) => (
                <TableRow key={u.id} className="hover:bg-black/[0.005] transition-colors group">
                  <TableCell className="py-6 pl-6">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center font-bold text-primary text-xs shadow-inner overflow-hidden border border-primary/10">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt={u.full_name} className="h-full w-full object-cover" />
                        ) : (
                          u.full_name?.charAt(0) || <Users className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-black group-hover:text-primary transition-colors">{u.full_name || 'Anonymous User'}</div>
                        <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{u.id.slice(0, 8)}...</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-xs font-medium text-black/70">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        {u.email || 'No email'}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-medium text-black/70">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        {u.phone || 'No phone'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {u.roles?.map((role: string) => (
                        <Badge 
                          key={role} 
                          variant="outline" 
                          className={cn(
                            "rounded-full px-2 py-0 text-[9px] font-bold uppercase tracking-wider",
                            role === 'admin' ? "bg-amber-500/10 text-amber-600 border-amber-200/50" :
                            role === 'therapist' ? "bg-emerald-500/10 text-emerald-600 border-emerald-200/50" :
                            "bg-blue-500/10 text-blue-600 border-blue-200/50"
                          )}
                        >
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                        <Wallet className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-black">KSh {Number(u.balance || 0).toLocaleString()}</div>
                        <div className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">Credits</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs font-medium text-black/70">
                      {new Date(u.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
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
                          <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold px-2 py-1.5">User Actions</DropdownMenuLabel>
                          <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer focus:bg-primary/5 focus:text-primary">
                            <Users className="h-4 w-4" /> View Full Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer">
                            <Wallet className="h-4 w-4" /> Adjust Balance
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer">
                            <Shield className="h-4 w-4" /> Change Roles
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-black/5" />
                          <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer text-rose-600 focus:bg-rose-50 focus:text-rose-700">
                            <UserX className="h-4 w-4" /> Suspend User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-9 w-9 p-0 rounded-xl text-primary hover:bg-primary/5 hover:text-primary shadow-sm border border-primary/10"
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
