import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, 
  Stethoscope, 
  UserCircle, 
  Sparkles, 
  Calendar, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Video, 
  Clock,
  Heart,
  Globe,
  Star
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/therapist-onboarding")({
  component: TherapistOnboarding,
  head: () => ({ meta: [{ title: "Therapist Onboarding · Safe Space" }] }),
});

const STEPS = [
  { id: "foundation", title: "Foundations", icon: ShieldCheck },
  { id: "clinical", title: "Clinical", icon: Stethoscope },
  { id: "identity", title: "Identity", icon: UserCircle },
  { id: "personality", title: "Personality", icon: Sparkles },
  { id: "logistics", title: "Logistics", icon: Calendar },
];

const SPECIALTIES = [
  "Anxiety", "Depression", "ADHD", "Trauma/PTSD", "Relationships", 
  "Grief", "Post-partum", "Bipolar Disorder", "Eating Disorders", "Substance Use"
];

const MODALITIES = [
  "CBT", "EMDR", "Psychodynamic", "Somatic Experiencing", "DBT", "ACT", "IFS"
];

const LANGUAGES = ["English", "Swahili", "French", "Spanish", "Arabic"];

const INSURANCE_PLANS = ["NHIF", "AAR", "Jubilee", "Britam", "Old Mutual"];

function TherapistOnboarding() {
  const { user, roles, onboardingCompleted, isApproved, refreshTherapistStatus } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    license_type: "",
    license_number: "",
    jurisdiction: "",
    modalities: [] as string[],
    specializations: [] as string[],
    excluded_populations: [] as string[],
    lived_experience: [] as string[],
    languages: [] as string[],
    faith_based_integration: false,
    engagement_style_directive: 3,
    engagement_style_formal: 3,
    bio: "",
    intro_video_url: "",
    accepts_insurance: false,
    insurance_plans: [] as string[],
    sliding_scale: false,
    session_types: ["video"] as string[],
    price_per_session: 3000,
  });

  useEffect(() => {
    if (loading) return;

    if (!user || !roles.includes("therapist")) {
      navigate({ to: "/auth", search: { mode: "signin" } });
      return;
    }
    if (onboardingCompleted && isApproved) {
      navigate({ to: "/therapist" });
    }
  }, [user, roles, onboardingCompleted, isApproved, loading, navigate]);

  const updateFormData = (data: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const toggleItem = (field: keyof typeof formData, item: string) => {
    const current = formData[field] as string[];
    if (current.includes(item)) {
      updateFormData({ [field]: current.filter(i => i !== item) });
    } else {
      updateFormData({ [field]: [...current, item] });
    }
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else finish();
  };

  const back = () => {
    if (step > 0) setStep(step - 1);
  };

  const finish = async () => {
    setLoading(true);
    try {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from("therapists")
        .update({
          ...formData,
          onboarding_completed: true,
          onboarding_step: 5,
        })
        .eq("id", user.id);

      if (error) throw error;
      
      await refreshTherapistStatus();
      toast.success("Onboarding complete! Your profile is now being reviewed by our clinical team.");
      navigate({ to: "/therapist" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (onboardingCompleted && !isApproved) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Clock className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-semibold">Application Pending</h1>
          <p className="text-muted-foreground">
            Thank you for completing your profile! Our team is currently verifying your credentials. This usually takes 24-48 hours.
          </p>
          <Button variant="outline" onClick={() => navigate({ to: "/" })} className="rounded-full">
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  const currentStep = STEPS[step];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2 font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[image:var(--gradient-primary)] text-primary-foreground">
            <Heart className="h-4 w-4" />
          </span>
          safe space
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex gap-1">
            {STEPS.map((s, i) => (
              <div 
                key={s.id} 
                className={`h-1.5 w-8 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-muted"}`} 
              />
            ))}
          </div>
          <span className="text-sm font-medium text-muted-foreground">Step {step + 1} of 5</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <currentStep.icon className="h-6 w-6" />
                </div>
                <h2 className="text-3xl font-semibold tracking-tight">{currentStep.title}</h2>
                <p className="text-muted-foreground">
                  {step === 0 && "Let's start with your professional credentials."}
                  {step === 1 && "Tell us about your clinical expertise and focus areas."}
                  {step === 2 && "Helping clients find cultural concordance."}
                  {step === 3 && "How do you show up in the therapy room?"}
                  {step === 4 && "Finalize your availability and logistical preferences."}
                </p>
              </div>

              <div className="bg-card border border-border rounded-3xl p-8 shadow-[var(--shadow-soft)]">
                {step === 0 && (
                  <div className="grid gap-6">
                    <div className="space-y-2">
                      <Label>License Type</Label>
                      <Input 
                        placeholder="e.g. LCSW, LMFT, PsyD" 
                        value={formData.license_type} 
                        onChange={e => updateFormData({ license_type: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>License Number</Label>
                      <Input 
                        placeholder="Registration number" 
                        value={formData.license_number} 
                        onChange={e => updateFormData({ license_number: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Jurisdiction</Label>
                      <Input 
                        placeholder="State or Country of licensure" 
                        value={formData.jurisdiction} 
                        onChange={e => updateFormData({ jurisdiction: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <Label className="text-lg font-medium">Core Expertise (Power Areas)</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {SPECIALTIES.map(s => (
                          <div key={s} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`spec-${s}`} 
                              checked={formData.specializations.includes(s)}
                              onCheckedChange={() => toggleItem("specializations", s)}
                            />
                            <label htmlFor={`spec-${s}`} className="text-sm cursor-pointer">{s}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <Label className="text-lg font-medium">Treatment Modalities</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {MODALITIES.map(m => (
                          <div key={m} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`mod-${m}`} 
                              checked={formData.modalities.includes(m)}
                              onCheckedChange={() => toggleItem("modalities", m)}
                            />
                            <label htmlFor={`mod-${m}`} className="text-sm cursor-pointer">{m}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <Label className="text-lg font-medium">Languages</Label>
                      <div className="flex flex-wrap gap-2">
                        {LANGUAGES.map(l => (
                          <button
                            key={l}
                            onClick={() => toggleItem("languages", l)}
                            className={`px-4 py-2 rounded-full border text-sm transition-all ${
                              formData.languages.includes(l) 
                                ? "bg-primary border-primary text-primary-foreground shadow-[var(--shadow-glow)]" 
                                : "bg-muted border-border hover:border-primary/50"
                            }`}
                          >
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-lg font-medium">Faith-Based Integration</Label>
                          <p className="text-sm text-muted-foreground">Do you offer spiritually integrated therapy?</p>
                        </div>
                        <Switch 
                          checked={formData.faith_based_integration}
                          onCheckedChange={checked => updateFormData({ faith_based_integration: checked })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Lived Experience (Optional)</Label>
                      <Textarea 
                        placeholder="e.g. LGBTQ+, Neurodivergent, Person of Color"
                        value={formData.lived_experience.join(", ")}
                        onChange={e => updateFormData({ lived_experience: e.target.value.split(",").map(s => s.trim()) })}
                      />
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-8">
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex justify-between text-sm font-medium">
                          <span>Reflective / Listening</span>
                          <span>Directive / Coaching</span>
                        </div>
                        <Slider 
                          value={[formData.engagement_style_directive]} 
                          onValueChange={v => updateFormData({ engagement_style_directive: v[0] })}
                          max={5} min={1} step={1}
                        />
                      </div>
                      <div className="space-y-4">
                        <div className="flex justify-between text-sm font-medium">
                          <span>Casual / Relatable</span>
                          <span>Formal / Clinical</span>
                        </div>
                        <Slider 
                          value={[formData.engagement_style_formal]} 
                          onValueChange={v => updateFormData({ engagement_style_formal: v[0] })}
                          max={5} min={1} step={1}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Biography</Label>
                      <Textarea 
                        className="h-32"
                        placeholder="Focus on how you help clients rather than just your education..."
                        value={formData.bio}
                        onChange={e => updateFormData({ bio: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Intro Video URL (YouTube/Vimeo)</Label>
                      <Input 
                        placeholder="https://..."
                        value={formData.intro_video_url}
                        onChange={e => updateFormData({ intro_video_url: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-8">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Base Rate (KES per session)</Label>
                        <Input 
                          type="number"
                          value={formData.price_per_session}
                          onChange={e => updateFormData({ price_per_session: Number(e.target.value) })}
                        />
                      </div>
                      <div className="flex items-center justify-between pt-8">
                        <Label>Sliding Scale</Label>
                        <Switch 
                          checked={formData.sliding_scale}
                          onCheckedChange={checked => updateFormData({ sliding_scale: checked })}
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <Label className="text-lg font-medium">Insurance Accepted</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {INSURANCE_PLANS.map(p => (
                          <div key={p} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`ins-${p}`} 
                              checked={formData.insurance_plans.includes(p)}
                              onCheckedChange={() => toggleItem("insurance_plans", p)}
                            />
                            <label htmlFor={`ins-${p}`} className="text-sm cursor-pointer">{p}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <Label className="text-lg font-medium">Session Types</Label>
                      <div className="flex gap-4">
                        {["video", "in-person", "text"].map(t => (
                          <div key={t} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`type-${t}`} 
                              checked={formData.session_types.includes(t)}
                              onCheckedChange={() => toggleItem("session_types", t)}
                            />
                            <label htmlFor={`type-${t}`} className="text-sm cursor-pointer capitalize">{t}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <Button 
                  variant="ghost" 
                  onClick={back} 
                  disabled={step === 0 || loading}
                  className="rounded-full px-6"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button 
                  onClick={next} 
                  disabled={loading}
                  className="rounded-full px-8 shadow-[var(--shadow-glow)]"
                >
                  {step === STEPS.length - 1 ? (loading ? "Finishing..." : "Complete Setup") : "Next step"} 
                  {step < STEPS.length - 1 && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <footer className="p-6 text-center text-xs text-muted-foreground border-t border-border">
        Your data is encrypted and handled according to HIPAA guidelines.
      </footer>
    </div>
  );
}
