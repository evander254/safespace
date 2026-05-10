import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowRight, CalendarCheck, MessageCircleHeart, ShieldCheck, Sparkles, Video, Smartphone } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import heroImg from "@/assets/hero-calm.jpg";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "Safe Space — Therapy in Kenya, on your terms" },
      { name: "description", content: "Book secure, affordable sessions with licensed therapists in Kenya. Pay with M-Pesa, chat and meet by video." },
    ],
  }),
});

function Landing() {
  const { user, loading: authLoading, intakeCompleted, onboardingCompleted, roles } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user && roles.length > 0) {
      if (roles.includes("admin")) {
        navigate({ to: "/admin" });
      } else if (roles.includes("therapist")) {
        if (onboardingCompleted) {
          navigate({ to: "/therapist" });
        } else {
          navigate({ to: "/therapist-onboarding" });
        }
      } else if (roles.includes("client") && !intakeCompleted) {
        navigate({ to: "/onboarding" });
      } else {
        navigate({ to: "/therapists" });
      }
    }
  }, [authLoading, user, intakeCompleted, roles, onboardingCompleted, navigate]);

  if (authLoading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Sparkles className="h-6 w-6 animate-pulse text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-70"
          style={{ backgroundImage: "var(--gradient-hero)" }}
        />
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:py-24 md:gap-16 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Built for Kenya · M-Pesa ready
            </span>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
              A calmer mind is one <span className="bg-[image:var(--gradient-primary)] bg-clip-text text-transparent">conversation</span> away.
            </h1>
            <p className="mt-5 max-w-lg text-base text-muted-foreground md:text-lg">
              Match with licensed therapists across Kenya. Book in minutes, pay with M-Pesa, and meet privately by video — all in one safe space.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild className="rounded-full px-6 shadow-[var(--shadow-glow)]">
                <Link to="/therapists">
                  Find a therapist <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="rounded-full px-6">
                <Link to="/auth" search={{ mode: "signup" } as never}>Create an account</Link>
              </Button>
            </div>
            <div className="mt-8 flex items-center gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Confidential & secure</div>
              <div className="flex items-center gap-2"><Smartphone className="h-4 w-4 text-primary" /> Works on any phone</div>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-[4/3] overflow-hidden rounded-3xl border border-border shadow-[var(--shadow-glow)]">
              <img src={heroImg} alt="Calm sage and blue landscape" width={1536} height={1024} className="h-full w-full object-cover" />
            </div>
            <div className="absolute -bottom-6 -left-6 hidden rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)] md:block">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-accent text-accent-foreground"><CalendarCheck className="h-5 w-5" /></div>
                <div>
                  <div className="text-sm font-medium">Session booked</div>
                  <div className="text-xs text-muted-foreground">Tomorrow · 10:00 AM</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Care that fits your life</h2>
          <p className="mt-4 text-muted-foreground">Everything you need from first hello to ongoing support.</p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="group rounded-3xl border border-border bg-card p-6 transition-[transform,box-shadow] hover:-translate-y-1 hover:shadow-[var(--shadow-soft)]">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary-soft text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-medium">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-24">
        <div className="overflow-hidden rounded-3xl border border-border bg-[image:var(--gradient-hero)] p-10 text-center md:p-16">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Take the first step today</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">Reaching out is the bravest part. We'll handle the rest.</p>
          <Button size="lg" asChild className="mt-8 rounded-full px-8 shadow-[var(--shadow-glow)]">
            <Link to="/therapists">Browse therapists</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Safe Space · Made with care in Kenya
      </footer>
    </div>
  );
}

const features = [
  { icon: ShieldCheck, title: "Licensed & vetted", body: "Every therapist is verified and approved by our clinical team." },
  { icon: Smartphone, title: "M-Pesa payments", body: "Pay seamlessly with STK push — confirmed in seconds." },
  { icon: Video, title: "Secure video", body: "Private sessions over encrypted video, from anywhere." },
  { icon: MessageCircleHeart, title: "Real-time chat", body: "Message your therapist between sessions when you need support." },
  { icon: CalendarCheck, title: "Smart scheduling", body: "See live availability and book in just a few taps." },
  { icon: Sparkles, title: "Plans that flex", body: "Pay-as-you-go or subscribe for discounts and priority booking." },
];