import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Heart, ArrowLeft, ArrowRight, Check, Phone, Shield, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
  head: () => ({ meta: [{ title: "Tell us about you · Safe Space" }] }),
});

/* ─── Constants ─── */

const TOTAL_STEPS = 5;

const CONCERNS = [
  "Anxiety", "Depression", "Trauma & PTSD", "LGBTQ+ Issues", "Grief & Loss",
  "Career Stress", "Relationships", "Self-esteem", "Addiction",
  "Anger Management", "OCD", "Eating Disorders",
];

const AFFECTED_AREAS = ["Sleep", "Work / Productivity", "Relationships", "Physical Health", "Daily Functioning"];

const GOALS = [
  "I want tools to manage my symptoms",
  "I want to understand my past",
  "I want to improve my relationships",
  "I want a safe space to talk",
  "I want help with a specific life event",
];

const AVAILABILITY_OPTIONS = [
  "Weekday Mornings", "Weekday Afternoons", "Weekday Evenings",
  "Weekend Mornings", "Weekend Afternoons",
];

const QUOTES = [
  { text: "The first step toward change is awareness.", author: "Nathaniel Branden" },
  { text: "Your identity is your most valuable possession. Protect it.", author: "Elastigirl" },
  { text: "The meeting of two personalities is like the contact of two chemical substances.", author: "Carl Jung" },
  { text: "The obstacle is the path.", author: "Zen proverb" },
  { text: "You are braver than you believe, stronger than you seem, and smarter than you think.", author: "A.A. Milne" },
];

/* ─── Types ─── */

interface IntakeData {
  // Step 1
  primary_concerns: string[];
  concern_trigger: string;
  affected_areas: string[];
  therapy_goals: string[];
  goals_detail: string;
  // Step 2
  gender: string;
  ethnicity: string;
  religion: string;
  identity_match_importance: number;
  // Step 3
  therapeutic_style: string;
  therapy_approach: string;
  communication_notes: string;
  // Step 4
  availability: string[];
  budget_range: string;
  insurance_provider: string;
  preferred_channel: string;
  // Step 5
  previous_therapy: string;
  previous_therapy_feedback: string;
  current_safety: string;
}

const INITIAL: IntakeData = {
  primary_concerns: [], concern_trigger: "", affected_areas: [], therapy_goals: [], goals_detail: "",
  gender: "", ethnicity: "", religion: "", identity_match_importance: 3,
  therapeutic_style: "", therapy_approach: "", communication_notes: "",
  availability: [], budget_range: "", insurance_provider: "", preferred_channel: "",
  previous_therapy: "", previous_therapy_feedback: "", current_safety: "",
};

/* ─── Helpers ─── */

function ChipSelect({ options, selected, onChange }: { options: string[]; selected: string[]; onChange: (v: string[]) => void }) {
  const toggle = (v: string) => onChange(selected.includes(v) ? selected.filter((s) => s !== v) : [...selected, v]);
  return (
    <div className="chip-group">
      {options.map((o) => (
        <button key={o} type="button" className={`chip${selected.includes(o) ? " selected" : ""}`} onClick={() => toggle(o)}>
          <svg className="chip-check" viewBox="0 0 14 14" fill="none"><path d="M2.5 7.5L5.5 10.5L11.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          {o}
        </button>
      ))}
    </div>
  );
}

function RadioCard({ icon, title, desc, selected, onClick }: { icon: string; title: string; desc: string; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" className={`radio-card${selected ? " selected" : ""}`} onClick={onClick}>
      <div className="rc-icon">{icon}</div>
      <div className="rc-body">
        <h4>{title}</h4>
        <p>{desc}</p>
      </div>
    </button>
  );
}

/* ─── Steps ─── */

function Step1({ data, set }: { data: IntakeData; set: (p: Partial<IntakeData>) => void }) {
  return (
    <div className="space-y-6 step-fade-up">
      <div>
        <Label className="text-base font-semibold">What's bringing you here?</Label>
        <p className="mt-1 text-sm text-muted-foreground">Select all that apply.</p>
        <div className="mt-3">
          <ChipSelect options={CONCERNS} selected={data.primary_concerns} onChange={(v) => set({ primary_concerns: v })} />
        </div>
      </div>

      <div>
        <Label htmlFor="trigger" className="text-base font-semibold">Why now?</Label>
        <p className="mt-1 text-sm text-muted-foreground">What's brought you to seek support at this point in your life?</p>
        <Textarea id="trigger" className="mt-2" rows={3} placeholder="Take your time — there's no right answer..." value={data.concern_trigger} onChange={(e) => set({ concern_trigger: e.target.value })} />
      </div>

      <div>
        <Label className="text-base font-semibold">How is this affecting you?</Label>
        <p className="mt-1 text-sm text-muted-foreground">Select areas of your life that feel impacted.</p>
        <div className="mt-3">
          <ChipSelect options={AFFECTED_AREAS} selected={data.affected_areas} onChange={(v) => set({ affected_areas: v })} />
        </div>
      </div>

      <div>
        <Label className="text-base font-semibold">What does "getting better" look like?</Label>
        <p className="mt-1 text-sm text-muted-foreground">What are you hoping to get out of therapy?</p>
        <div className="mt-3">
          <ChipSelect options={GOALS} selected={data.therapy_goals} onChange={(v) => set({ therapy_goals: v })} />
        </div>
      </div>

      <div>
        <Label htmlFor="goals-detail" className="text-sm font-medium text-muted-foreground">Want to tell us more? (optional)</Label>
        <Textarea id="goals-detail" className="mt-2" rows={2} placeholder="Anything else you'd like us to know about your goals..." value={data.goals_detail} onChange={(e) => set({ goals_detail: e.target.value })} />
      </div>
    </div>
  );
}

function Step2({ data, set }: { data: IntakeData; set: (p: Partial<IntakeData>) => void }) {
  return (
    <div className="space-y-6 step-fade-up">
      <p className="text-sm text-muted-foreground">
        Research shows that sharing aspects of identity with your therapist can strengthen your connection. These are entirely optional.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Gender</Label>
          <Select value={data.gender} onValueChange={(v) => set({ gender: v })}>
            <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
            <SelectContent>
              {["Woman", "Man", "Non-binary", "Prefer not to say", "Other"].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Race / Ethnicity</Label>
          <Select value={data.ethnicity} onValueChange={(v) => set({ ethnicity: v })}>
            <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
            <SelectContent>
              {["Black / African", "White", "Asian", "Mixed / Multiracial", "Other", "Prefer not to say"].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Religion / Spirituality</Label>
        <Select value={data.religion} onValueChange={(v) => set({ religion: v })}>
          <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
          <SelectContent>
            {["Christian", "Muslim", "Hindu", "Buddhist", "Traditional / Indigenous", "Spiritual but not religious", "None", "Other", "Prefer not to say"].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-base font-semibold">How important is it that your therapist shares your background?</Label>
        <p className="text-sm text-muted-foreground">This helps us prioritize cultural concordance in your match.</p>
        <div className="pt-2 px-1">
          <Slider
            min={1} max={5} step={1}
            value={[data.identity_match_importance]}
            onValueChange={([v]) => set({ identity_match_importance: v })}
          />
          <div className="slider-labels">
            <span>Not important</span>
            <span>Somewhat</span>
            <span>Very important</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Step3({ data, set }: { data: IntakeData; set: (p: Partial<IntakeData>) => void }) {
  return (
    <div className="space-y-6 step-fade-up">
      <div>
        <Label className="text-base font-semibold">What kind of therapist feels right?</Label>
        <p className="mt-1 text-sm text-muted-foreground">There's no wrong answer — just what suits you best.</p>
        <div className="mt-3 radio-card-group">
          <RadioCard
            icon="🫶" title="Gentle & Validating"
            desc="Someone who listens deeply and creates a safe, non-judgmental space."
            selected={data.therapeutic_style === "validating"} onClick={() => set({ therapeutic_style: "validating" })}
          />
          <RadioCard
            icon="⚡" title="Direct & Challenging"
            desc="Someone who gives homework, pushes me, and holds me accountable."
            selected={data.therapeutic_style === "challenging"} onClick={() => set({ therapeutic_style: "challenging" })}
          />
          <RadioCard
            icon="🤝" title="Balanced"
            desc="A mix of both — warmth with structure."
            selected={data.therapeutic_style === "balanced"} onClick={() => set({ therapeutic_style: "balanced" })}
          />
        </div>
      </div>

      <div>
        <Label className="text-base font-semibold">What would you like to focus on?</Label>
        <p className="mt-1 text-sm text-muted-foreground">This helps us match your approach preference.</p>
        <div className="mt-3 radio-card-group">
          <RadioCard
            icon="🔧" title="Present & Practical"
            desc="Focus on tools, coping strategies, and solving what's in front of me right now."
            selected={data.therapy_approach === "present-practical"} onClick={() => set({ therapy_approach: "present-practical" })}
          />
          <RadioCard
            icon="🔍" title="Past & Exploratory"
            desc="Explore deep-rooted experiences and understand where my patterns come from."
            selected={data.therapy_approach === "past-exploratory"} onClick={() => set({ therapy_approach: "past-exploratory" })}
          />
          <RadioCard
            icon="🔄" title="A bit of both"
            desc="A blend depending on what I need at the time."
            selected={data.therapy_approach === "both"} onClick={() => set({ therapy_approach: "both" })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="comm-notes" className="text-sm font-medium text-muted-foreground">Anything else about how you like to communicate? (optional)</Label>
        <Textarea id="comm-notes" className="mt-2" rows={2} placeholder="e.g. I prefer to take things slow at first..." value={data.communication_notes} onChange={(e) => set({ communication_notes: e.target.value })} />
      </div>
    </div>
  );
}

function Step4({ data, set }: { data: IntakeData; set: (p: Partial<IntakeData>) => void }) {
  return (
    <div className="space-y-6 step-fade-up">
      <div>
        <Label className="text-base font-semibold">When are you available?</Label>
        <p className="mt-1 text-sm text-muted-foreground">Select all the windows that work for you.</p>
        <div className="mt-3">
          <ChipSelect options={AVAILABILITY_OPTIONS} selected={data.availability} onChange={(v) => set({ availability: v })} />
        </div>
      </div>

      <div>
        <Label className="text-base font-semibold">Budget per session</Label>
        <p className="mt-1 text-sm text-muted-foreground">This helps us show therapists in your range.</p>
        <div className="mt-3 radio-card-group">
          {[
            { v: "500-1500", label: "KSh 500 – 1,500" },
            { v: "1500-3000", label: "KSh 1,500 – 3,000" },
            { v: "3000-5000", label: "KSh 3,000 – 5,000" },
            { v: "5000+", label: "KSh 5,000+" },
            { v: "sliding-scale", label: "I need a sliding-scale option" },
          ].map(({ v, label }) => (
            <button key={v} type="button" className={`radio-card${data.budget_range === v ? " selected" : ""}`} onClick={() => set({ budget_range: v })}>
              <div className="rc-body"><h4>{label}</h4></div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="insurance">Insurance provider (optional)</Label>
        <input
          id="insurance"
          type="text"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          placeholder="e.g. Jubilee, AAR, NHIF, or 'Self-pay'"
          value={data.insurance_provider}
          onChange={(e) => set({ insurance_provider: e.target.value })}
        />
      </div>

      <div>
        <Label className="text-base font-semibold">How would you like to meet?</Label>
        <div className="mt-3 radio-card-group sm:grid-cols-2" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}>
          {[
            { v: "video", icon: "📹", label: "Video" },
            { v: "phone", icon: "📞", label: "Phone" },
            { v: "chat", icon: "💬", label: "Chat" },
            { v: "no-preference", icon: "🤷", label: "No preference" },
          ].map(({ v, icon, label }) => (
            <button key={v} type="button" className={`radio-card${data.preferred_channel === v ? " selected" : ""}`} onClick={() => set({ preferred_channel: v })} style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", textAlign: "center", padding: "18px 12px" }}>
              <span style={{ fontSize: "1.5rem" }}>{icon}</span>
              <span style={{ fontWeight: 600, fontSize: "0.875rem", marginTop: 4 }}>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step5({ data, set }: { data: IntakeData; set: (p: Partial<IntakeData>) => void }) {
  return (
    <div className="space-y-6 step-fade-up">
      <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
        <Shield className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <p className="text-sm text-muted-foreground">
          These questions help us ensure you get the right level of support. Your answers are <strong className="text-foreground">completely confidential</strong>.
        </p>
      </div>

      <div>
        <Label className="text-base font-semibold">Have you been in therapy before?</Label>
        <div className="mt-3 flex gap-3">
          {["yes", "no"].map((v) => (
            <button
              key={v} type="button"
              className={`chip${data.previous_therapy === v ? " selected" : ""}`}
              style={{ minWidth: 80, justifyContent: "center" }}
              onClick={() => set({ previous_therapy: v })}
            >
              {v === "yes" ? "Yes" : "No"}
            </button>
          ))}
        </div>
      </div>

      {data.previous_therapy === "yes" && (
        <div className="step-fade-up">
          <Label htmlFor="prev-feedback" className="text-sm font-medium">What worked well? What didn't?</Label>
          <p className="mt-1 text-xs text-muted-foreground">This helps your new therapist avoid repeating unhelpful patterns.</p>
          <Textarea id="prev-feedback" className="mt-2" rows={3} placeholder="e.g. I liked CBT exercises but didn't feel heard..." value={data.previous_therapy_feedback} onChange={(e) => set({ previous_therapy_feedback: e.target.value })} />
        </div>
      )}

      <div>
        <Label className="text-base font-semibold">How are you feeling right now?</Label>
        <p className="mt-1 text-sm text-muted-foreground">This is to ensure we connect you with the right support.</p>
        <div className="mt-3 radio-card-group">
          <RadioCard
            icon="💚" title="I feel safe"
            desc="I'm not in crisis — I'm looking for ongoing support."
            selected={data.current_safety === "safe"} onClick={() => set({ current_safety: "safe" })}
          />
          <RadioCard
            icon="💛" title="I sometimes struggle"
            desc="I have difficult thoughts sometimes, but I'm managing."
            selected={data.current_safety === "sometimes-struggle"} onClick={() => set({ current_safety: "sometimes-struggle" })}
          />
          <RadioCard
            icon="🧡" title="I need immediate support"
            desc="I'm having thoughts of harming myself or others."
            selected={data.current_safety === "need-help-now"} onClick={() => set({ current_safety: "need-help-now" })}
          />
        </div>
      </div>

      {data.current_safety === "need-help-now" && (
        <div className="crisis-banner step-fade-up">
          <div className="flex items-center gap-2 text-destructive font-semibold text-base">
            <Phone className="h-5 w-5" />
            Your safety is the most important thing
          </div>
          <p className="mt-2 text-sm">
            Please reach out to one of these services right away. You can still complete your profile later.
          </p>
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-3">
              <a href="tel:0800723253" className="inline-flex items-center gap-2 rounded-full bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground no-underline hover:opacity-90 transition-opacity">
                <Phone className="h-4 w-4" /> Kenya Red Cross: 0800 723 253
              </a>
            </div>
            <div className="flex items-center gap-3">
              <a href="tel:+254722178177" className="inline-flex items-center gap-2 rounded-full border-2 border-destructive px-4 py-2 text-sm font-semibold text-destructive no-underline hover:bg-destructive hover:text-destructive-foreground transition-colors">
                <Phone className="h-4 w-4" /> Befrienders Kenya: +254 722 178 177
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Step metadata ─── */

const STEP_META = [
  { title: "Presenting Concerns", subtitle: "Help us understand what you're going through." },
  { title: "Identity & Culture", subtitle: "So we can find someone who gets you." },
  { title: "Communication Style", subtitle: "Let's find the right personality fit." },
  { title: "Practical Details", subtitle: "Logistics that make it work." },
  { title: "Safety & History", subtitle: "Ensuring you get the right support." },
];

/* ─── Main Page ─── */

function OnboardingPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<"right" | "left">("right");
  const [data, setData] = useState<IntakeData>(INITIAL);
  const [saving, setSaving] = useState(false);

  // Guard: must be logged in
  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth", search: { mode: "signup" } });
  }, [authLoading, user, navigate]);

  // Guard: already completed
  useEffect(() => {
    if (user?.user_metadata?.intake_completed) navigate({ to: "/therapists" });
  }, [user, navigate]);

  const set = useCallback((partial: Partial<IntakeData>) => setData((d) => ({ ...d, ...partial })), []);

  const canProceed = (): boolean => {
    switch (step) {
      case 0: return data.primary_concerns.length > 0;
      case 1: return true; // all optional
      case 2: return !!data.therapeutic_style && !!data.therapy_approach;
      case 3: return data.availability.length > 0 && !!data.budget_range && !!data.preferred_channel;
      case 4: return !!data.current_safety;
      default: return true;
    }
  };

  const goNext = () => {
    if (!canProceed()) {
      toast.error("Please complete the required fields before continuing.");
      return;
    }
    if (step < TOTAL_STEPS - 1) { setDir("right"); setStep((s) => s + 1); }
  };

  const goBack = () => {
    if (step > 0) { setDir("left"); setStep((s) => s - 1); }
  };

  const finish = async () => {
    if (!canProceed()) {
      toast.error("Please complete the required fields.");
      return;
    }
    if (!user) return;
    setSaving(true);
    try {
      // 1. Upsert intake data into the client_intake table
      const { error: dbError } = await supabase
        .from("client_intake")
        .upsert(
          {
            user_id: user.id,
            primary_concerns: data.primary_concerns,
            concern_trigger: data.concern_trigger || null,
            affected_areas: data.affected_areas,
            therapy_goals: data.therapy_goals,
            goals_detail: data.goals_detail || null,
            gender: data.gender || null,
            ethnicity: data.ethnicity || null,
            religion: data.religion || null,
            identity_match_importance: data.identity_match_importance,
            therapeutic_style: data.therapeutic_style || null,
            therapy_approach: data.therapy_approach || null,
            communication_notes: data.communication_notes || null,
            availability: data.availability,
            budget_range: data.budget_range || null,
            insurance_provider: data.insurance_provider || null,
            preferred_channel: data.preferred_channel || null,
            previous_therapy: data.previous_therapy || null,
            previous_therapy_feedback: data.previous_therapy_feedback || null,
            current_safety: data.current_safety || null,
          },
          { onConflict: "user_id" }
        );
      if (dbError) throw dbError;

      // 2. Mark intake as completed in auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { intake_completed: true },
      });
      if (authError) throw authError;

      toast.success("Profile complete. Let's find your therapist.");
      navigate({ to: "/therapists" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Sparkles className="h-6 w-6 animate-pulse text-primary" />
      </div>
    );
  }

  const stepComponents = [
    <Step1 key={0} data={data} set={set} />,
    <Step2 key={1} data={data} set={set} />,
    <Step3 key={2} data={data} set={set} />,
    <Step4 key={3} data={data} set={set} />,
    <Step5 key={4} data={data} set={set} />,
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="grid min-h-screen md:grid-cols-[380px_1fr] lg:grid-cols-[420px_1fr]">
        {/* Left Quote Panel */}
        <div
          className="hidden md:flex flex-col justify-between p-10"
          style={{ backgroundImage: "var(--gradient-hero)" }}
        >
          <div className="flex items-center gap-2 font-semibold">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground">
              <Heart className="h-4 w-4" />
            </span>
            safe space
          </div>

          <div className="onboarding-quote" key={step}>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border/40 bg-card/30 px-3 py-1 text-xs backdrop-blur">
              <Sparkles className="h-3 w-3 text-primary" />
              Step {step + 1} of {TOTAL_STEPS}
            </div>
            <h2 className="text-3xl font-semibold leading-tight step-fade-up">
              "{QUOTES[step].text}"
            </h2>
            <p className="mt-3 text-muted-foreground step-fade-up" style={{ animationDelay: "0.1s" }}>
              — {QUOTES[step].author}
            </p>
          </div>

          <div className="text-xs text-muted-foreground">
            Confidential. Encrypted. Always yours.
          </div>
        </div>

        {/* Right Content Panel */}
        <div className="flex flex-col">
          {/* Progress bar */}
          <div className="border-b border-border px-6 py-4">
            <div className="mx-auto max-w-xl">
              <div className="onboarding-progress">
                {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                  <div key={i} className={`seg${i <= step ? " filled" : ""}`} />
                ))}
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <h1 className="text-lg font-semibold">{STEP_META[step].title}</h1>
                <span className="text-xs text-muted-foreground">{step + 1} / {TOTAL_STEPS}</span>
              </div>
              <p className="text-sm text-muted-foreground">{STEP_META[step].subtitle}</p>
            </div>
          </div>

          {/* Step Content */}
          <div className="flex-1 overflow-y-auto px-6 py-8">
            <div className="mx-auto max-w-xl" key={step}>
              <div className={dir === "right" ? "step-enter-right" : "step-enter-left"}>
                {stepComponents[step]}
              </div>
            </div>
          </div>

          {/* Navigation Footer */}
          <div className="border-t border-border px-6 py-4">
            <div className="mx-auto flex max-w-xl items-center justify-between">
              <Button
                variant="ghost"
                onClick={goBack}
                disabled={step === 0}
                className="rounded-full gap-2"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>

              {step < TOTAL_STEPS - 1 ? (
                <Button
                  onClick={goNext}
                  disabled={!canProceed()}
                  className="rounded-full gap-2 px-6 shadow-[var(--shadow-glow)]"
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={finish}
                  disabled={saving || !canProceed()}
                  className="rounded-full gap-2 px-6 shadow-[var(--shadow-glow)]"
                >
                  {saving ? "Saving…" : <><Check className="h-4 w-4" /> Complete profile</>}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
