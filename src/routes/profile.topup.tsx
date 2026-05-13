import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { 
  Wallet, 
  ChevronLeft, 
  CreditCard, 
  Smartphone, 
  Building2, 
  AlertCircle,
  Plus,
  History as HistoryIcon,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight,
  Save,
  Trash2,
  Star
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profile/topup")({
  component: TopUpPage,
  head: () => ({ meta: [{ title: "Top Up Wallet · Safe Space" }] }),
});

const PAYMENT_METHODS = [
  { id: "M-Pesa", name: "M-Pesa", icon: Smartphone, description: "Mobile money transfer" },
  { id: "Card", name: "Credit/Debit Card", icon: CreditCard, description: "Visa or Mastercard" },
  { id: "Bank", name: "Bank Transfer", icon: Building2, description: "Direct bank deposit" },
];

const PRESET_AMOUNTS = [500, 1000, 2000, 5000];

interface PaymentMethod {
  id: string;
  user_id: string;
  type: string;
  nickname: string | null;
  details: {
    phone?: string;
    [key: string]: any;
  };
  is_default: boolean;
  created_at: string;
}

interface TopUpRequest {
  id: string;
  user_id: string;
  amount: number;
  method: string;
  reference_code: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

function TopUpPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState<string>("");
  const [method, setMethod] = useState<string>("M-Pesa");
  const [reference, setReference] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [saveMethod, setSaveMethod] = useState(false);
  const [methodNickname, setMethodNickname] = useState("");

  const { data: requests, isLoading: requestsLoading } = useQuery({
    queryKey: ["topup-requests", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("topup_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as TopUpRequest[];
    },
    enabled: !!user,
  });

  const { data: savedMethods, isLoading: methodsLoading } = useQuery({
    queryKey: ["payment-methods", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .order("is_default", { ascending: false });
      if (error) throw error;
      return data as PaymentMethod[];
    },
    enabled: !!user,
  });

  const saveMethodMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      const { error } = await supabase
        .from("payment_methods")
        .insert({
          user_id: user.id,
          type: method,
          nickname: methodNickname || `${method} Method`,
          details: method === "M-Pesa" ? { phone } : {},
          is_default: (savedMethods?.length || 0) === 0
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
    }
  });

  const deleteMethodMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payment_methods").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Payment method deleted");
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
    }
  });

  const submitTopupMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        throw new Error("Please enter a valid amount");
      }

      const { error } = await supabase
        .from("topup_requests")
        .insert({
          user_id: user.id,
          amount: Number(amount),
          method,
          reference_code: reference,
          status: "pending"
        });

      if (error) throw error;

      if (saveMethod) {
        await saveMethodMutation.mutateAsync();
      }
    },
    onSuccess: () => {
      toast.success("Top-up request submitted for approval!");
      setAmount("");
      setReference("");
      queryClient.invalidateQueries({ queryKey: ["topup-requests"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to submit request");
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "rejected": return <XCircle className="h-4 w-4 text-rose-500" />;
      default: return <Clock className="h-4 w-4 text-amber-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "rejected": return "bg-rose-50 text-rose-700 border-rose-100";
      default: return "bg-amber-50 text-amber-700 border-amber-100";
    }
  };

  return (
    <div className="min-h-screen bg-background/50 selection:bg-primary/10 pb-20">
      <SiteHeader />
      
      <main className="mx-auto max-w-4xl px-4 py-8 md:py-12 sm:px-6 lg:px-8">
        <Link 
          to="/profile" 
          className="group mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-primary"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm border border-slate-100 transition-all group-hover:bg-primary/5 group-hover:border-primary/20 group-hover:text-primary">
            <ChevronLeft className="h-4 w-4" />
          </div>
          Back to Profile
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-8">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Top Up Wallet</h1>
              <p className="text-slate-500">Add funds to your wallet to pay for your therapy sessions.</p>
            </div>

            <Card className="rounded-3xl border-slate-200/60 shadow-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Top Up Details</CardTitle>
                <CardDescription>Select your preferred payment method and amount.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Saved Methods */}
                {savedMethods && savedMethods.length > 0 && (
                  <div className="space-y-4">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Use Saved Method</Label>
                    <div className="flex flex-wrap gap-3">
                      {savedMethods.map((sm) => (
                        <button
                          key={sm.id}
                          onClick={() => {
                            setMethod(sm.type);
                            if (sm.type === "M-Pesa") setPhone(sm.details?.phone || "");
                          }}
                          className={cn(
                            "flex items-center gap-3 rounded-xl border px-4 py-3 transition-all",
                            method === sm.type && (sm.type !== "M-Pesa" || phone === sm.details?.phone)
                              ? "border-primary bg-primary/5 text-primary shadow-sm"
                              : "border-slate-100 bg-white text-slate-600 hover:border-slate-200"
                          )}
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-100 shadow-sm">
                            {sm.type === "M-Pesa" ? <Smartphone className="h-4 w-4" /> : sm.type === "Card" ? <CreditCard className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                          </div>
                          <div className="text-left">
                            <p className="text-[11px] font-bold leading-tight">{sm.nickname}</p>
                            <p className="text-[9px] text-slate-400 font-medium">
                              {sm.type === "M-Pesa" ? sm.details?.phone : sm.type}
                            </p>
                          </div>
                          {sm.is_default && <Star className="h-3 w-3 fill-amber-400 text-amber-400" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Method Selection */}
                <div className="space-y-4">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Select Method</Label>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {PAYMENT_METHODS.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setMethod(item.id);
                          // Clear phone if switching away from M-Pesa or if not selecting a saved one
                        }}
                        className={cn(
                          "group relative flex flex-col items-center gap-3 rounded-2xl border p-5 transition-all text-center",
                          method === item.id 
                            ? "border-primary bg-primary/[0.03] ring-1 ring-primary" 
                            : "border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200"
                        )}
                      >
                        <div className={cn(
                          "flex h-12 w-12 items-center justify-center rounded-xl transition-all",
                          method === item.id ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-white text-slate-400 border border-slate-100 group-hover:text-slate-600"
                        )}>
                          <item.icon className="h-6 w-6" />
                        </div>
                        <div>
                          <p className={cn("text-sm font-bold", method === item.id ? "text-primary" : "text-slate-700")}>{item.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{item.description}</p>
                        </div>
                        {method === item.id && (
                          <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
                            <CheckCircle2 className="h-3 w-3" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount Selection */}
                <div className="space-y-4">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Select Amount (KSh)</Label>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {PRESET_AMOUNTS.map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setAmount(amt.toString())}
                        className={cn(
                          "rounded-xl border py-3 text-sm font-bold transition-all",
                          amount === amt.toString() 
                            ? "border-primary bg-primary text-white shadow-md shadow-primary/20" 
                            : "border-slate-100 bg-white text-slate-600 hover:border-slate-200 hover:bg-slate-50"
                        )}
                      >
                        {amt.toLocaleString()}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                      <span className="text-slate-400 font-bold text-sm">KSh</span>
                    </div>
                    <Input
                      type="number"
                      placeholder="Enter custom amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="rounded-xl h-12 pl-12 text-base font-semibold border-slate-200 focus:border-primary focus:ring-primary/20"
                    />
                  </div>
                </div>

                {/* Method Details */}
                {method === "M-Pesa" && (
                  <div className="space-y-4 rounded-2xl bg-slate-50/50 border border-slate-100 p-5">
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">M-Pesa Phone Number</Label>
                      <Smartphone className="h-4 w-4 text-slate-300" />
                    </div>
                    <Input
                      placeholder="e.g. 0712345678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="rounded-xl h-11 border-slate-200 bg-white"
                    />
                    <div className="flex items-center gap-3">
                      <Checkbox 
                        id="save-method" 
                        checked={saveMethod} 
                        onCheckedChange={(checked) => setSaveMethod(!!checked)} 
                        className="rounded-md border-slate-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label htmlFor="save-method" className="text-sm font-semibold text-slate-700 cursor-pointer">Save this payment method</Label>
                        <p className="text-[10px] text-slate-400 font-medium">Fast-track your future top-ups.</p>
                      </div>
                    </div>
                    {saveMethod && (
                      <div className="pt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Method Nickname</Label>
                        <Input
                          placeholder="e.g. My M-Pesa"
                          value={methodNickname}
                          onChange={(e) => setMethodNickname(e.target.value)}
                          className="rounded-xl h-10 border-slate-200 bg-white text-sm"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Reference Code */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Reference Code (Optional)</Label>
                    <Badge variant="outline" className="text-[10px] font-bold rounded-lg border-slate-200 bg-slate-50 text-slate-500 uppercase px-2 py-0.5">Verification</Badge>
                  </div>
                  <Input
                    placeholder="e.g. QXF1234567"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="rounded-xl h-12 border-slate-200 uppercase font-mono tracking-wider"
                  />
                  <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Enter the transaction ID to help us verify your payment faster.
                  </p>
                </div>

                <div className="pt-4">
                  <Button 
                    className="w-full rounded-2xl h-14 text-base font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
                    onClick={() => submitTopupMutation.mutate()}
                    disabled={submitTopupMutation.isPending || !amount}
                  >
                    {submitTopupMutation.isPending ? "Submitting..." : "Submit Top Up Request"}
                    {!submitTopupMutation.isPending && <ArrowRight className="ml-2 h-5 w-5" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar: Recent Requests */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 px-1">
              <HistoryIcon className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-slate-900">Recent Requests</h2>
            </div>

            <div className="space-y-3">
              {requestsLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="h-24 rounded-2xl bg-white border border-slate-100 animate-pulse" />
                ))
              ) : requests?.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center bg-slate-50/30">
                  <Clock className="mx-auto h-8 w-8 text-slate-300 mb-3" />
                  <p className="text-sm font-medium text-slate-500">No recent requests</p>
                </div>
              ) : (
                requests?.map((req) => (
                  <Card key={req.id} className="rounded-2xl border-slate-100 shadow-sm overflow-hidden bg-white hover:border-slate-200 transition-colors">
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{req.method}</span>
                        <Badge variant="outline" className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-bold border flex items-center gap-1", getStatusColor(req.status))}>
                          {getStatusIcon(req.status)}
                          {req.status}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-slate-900">KSh {Number(req.amount).toLocaleString()}</p>
                        <p className="text-[11px] text-slate-500 font-medium">{new Date(req.created_at).toLocaleDateString()} · {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      {req.reference_code && (
                        <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-2 py-1.5 border border-slate-100/50">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Ref:</span>
                          <span className="text-[11px] font-mono font-bold text-slate-600">{req.reference_code}</span>
                        </div>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>

            <div className="rounded-2xl bg-primary/[0.03] border border-primary/10 p-5 space-y-3">
              <h3 className="text-sm font-bold text-primary flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Need Help?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Top-up requests are usually approved within 15-30 minutes during business hours. 
                If your request takes longer, please contact our support.
              </p>
              <Button variant="outline" className="w-full rounded-xl h-9 text-xs font-bold border-primary/20 text-primary hover:bg-primary hover:text-white">
                Contact Support
              </Button>
            </div>

            {/* Manage Methods Dialog */}
            {savedMethods && savedMethods.length > 0 && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" className="w-full rounded-xl h-10 text-[11px] font-bold text-slate-400 hover:text-primary transition-all">
                    Manage Payment Methods
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] rounded-3xl">
                  <DialogHeader>
                    <DialogTitle>Saved Payment Methods</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 py-4">
                    {savedMethods.map((sm) => (
                      <div key={sm.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200 shadow-sm">
                            {sm.type === "M-Pesa" ? <Smartphone className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{sm.nickname}</p>
                            <p className="text-xs text-slate-500">{sm.type === "M-Pesa" ? sm.details?.phone : sm.type}</p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg"
                          onClick={() => deleteMethodMutation.mutate(sm.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
