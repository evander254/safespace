import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
  Mail,
  Phone,
  FileText
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

export const Route = createFileRoute("/admin/applications")({
  component: AdminApplications,
  head: () => ({ meta: [{ title: "Therapist Applications · Safe Space Admin" }] }),
});

function AdminApplications() {
  const { roles, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    const superAdminSession = localStorage.getItem("safespace_admin_session");
    const isSuperAdmin = superAdminSession && JSON.parse(superAdminSession).expiry > Date.now();

    if (!roles.includes("admin") && !isSuperAdmin) {
      navigate({ to: "/admin/safespace/loginHere" });
    } else {
      setAuthorized(true);
      fetchApplications();
    }
  }, [roles, authLoading, navigate]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_all_applications");
      if (error) throw error;
      setApplications(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch applications.");
    } finally {
      setLoading(false);
    }
  };

  const approve = async (id: string) => {
    const { error } = await supabase.rpc("admin_action_therapist", {
      p_therapist_id: id,
      p_is_approved: true
    });
    
    if (error) toast.error(error.message);
    else {
      toast.success("Therapist approved!");
      fetchApplications();
    }
  };

  const reject = async (id: string) => {
    const { error } = await supabase.rpc("admin_action_therapist", {
      p_therapist_id: id,
      p_is_approved: false
    });
    
    if (error) toast.error(error.message);
    else {
      toast.success("Application rejected.");
      fetchApplications();
    }
  };

  const filteredApplications = applications.filter(app => 
    app.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.license_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.jurisdiction?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading || !authorized) {
    return null;
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-bold tracking-tight">Therapist Applications</h2>
          <div className="text-muted-foreground text-sm flex items-center gap-2">
            Review and vet clinical professionals joining the team
            <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-bold text-[10px]">
              {applications.length} TOTAL PENDING
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl border-black/[0.05] bg-white gap-2 shadow-sm">
            <Download className="h-4 w-4" />
            Export List
          </Button>
          <Button className="rounded-xl bg-black text-white hover:bg-black/90 gap-2 shadow-lg shadow-black/10">
            <Filter className="h-4 w-4" />
            Advanced Filter
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-2xl border-black/[0.03] bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vetting Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{applications.length}</div>
            <div className="text-xs text-muted-foreground mt-1">Applications awaiting review</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-black/[0.03] bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Processing Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24.5 hrs</div>
            <div className="text-xs text-emerald-500 font-medium mt-1">↓ 12% from last month</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-black/[0.03] bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approval Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">68%</div>
            <div className="text-xs text-muted-foreground mt-1">Quality threshold maintained</div>
          </CardContent>
        </Card>
      </div>

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
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-black">All</Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-black">Vulnerable Population Expert</Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-black">Child Specialists</Button>
        </div>
      </div>

      <Card className="border-black/[0.03] bg-white shadow-sm overflow-hidden rounded-2xl">
        <Table>
          <TableHeader>
            <TableRow className="bg-black/[0.01] hover:bg-black/[0.01]">
              <TableHead className="font-bold py-5 pl-6">Therapist Profile</TableHead>
              <TableHead className="font-bold">License & Credential</TableHead>
              <TableHead className="font-bold">Jurisdiction</TableHead>
              <TableHead className="font-bold">Clinical Focus</TableHead>
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
                      <ShieldCheck className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary" />
                    </div>
                    <span className="font-medium animate-pulse">Scanning Applications...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredApplications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center text-muted-foreground italic">
                  <div className="flex flex-col items-center gap-2">
                    <Search className="h-8 w-8 text-muted-foreground/30" />
                    No applications found matching your criteria.
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredApplications.map((t) => (
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
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                            Applied {new Date(t.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
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
                    <div className="flex flex-wrap gap-1.5 max-w-[220px]">
                      {t.specializations?.slice(0, 2).map((s: string) => (
                        <Badge key={s} variant="outline" className="text-[10px] py-0.5 px-2 bg-black/[0.02] border-black/[0.08] rounded-md font-medium text-black/60 italic lowercase">
                          #{s}
                        </Badge>
                      ))}
                      {t.specializations?.length > 2 && (
                        <span className="text-[10px] text-muted-foreground font-bold pl-1">
                          +{t.specializations.length - 2}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-black">KES {t.price_per_session}</span>
                      <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">Per Session</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <div className="flex justify-end gap-2 opacity-100 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-black/5">
                            <MoreVertical className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-xl border-black/[0.08] shadow-xl p-2">
                          <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold px-2 py-1.5">Therapist Profile</DropdownMenuLabel>
                          <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer focus:bg-primary/5 focus:text-primary">
                            <FileText className="h-4 w-4" /> View Credentials
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer">
                            <Mail className="h-4 w-4" /> Contact Applicant
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer">
                            <Phone className="h-4 w-4" /> Schedule Interview
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-black/5" />
                          <DropdownMenuItem 
                            className="rounded-lg gap-2 cursor-pointer text-emerald-600 focus:bg-emerald-50 focus:text-emerald-700"
                            onClick={() => approve(t.id)}
                          >
                            <CheckCircle className="h-4 w-4" /> Approve Therapist
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="rounded-lg gap-2 cursor-pointer text-rose-600 focus:bg-rose-50 focus:text-rose-700"
                            onClick={() => reject(t.id)}
                          >
                            <XCircle className="h-4 w-4" /> Reject Application
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
