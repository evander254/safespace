import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowRight, CalendarCheck, MessageCircleHeart, ShieldCheck, Sparkles, Video, Smartphone } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Badge } from "@/components/ui/badge";
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
    if (!authLoading && user) {
      if (roles.length > 0) {
        if (roles.includes("admin")) {
          navigate({ to: "/admin" });
        } else if (roles.includes("therapist")) {
          if (onboardingCompleted) {
            navigate({ to: "/therapist" });
          } else {
            navigate({ to: "/therapist-onboarding" });
          }
        } else if (intakeCompleted) {
          navigate({ to: "/therapists" });
        } else {
          navigate({ to: "/onboarding" });
        }
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
    <div className="min-h-screen bg-background/50 text-foreground selection:bg-primary/10">
      <SiteHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 opacity-30"
            style={{ backgroundImage: "var(--gradient-hero)" }}
          />
          <div className="grid gap-12 md:grid-cols-2 md:gap-16 items-center">
            <div className="flex flex-col items-start">
              <Badge variant="secondary" className="mb-6 rounded-full bg-primary/10 text-primary border-none px-4 py-1.5 font-semibold tracking-wide uppercase text-[11px]">
                <Sparkles className="mr-2 h-4 w-4" /> Professional Care in Kenya
              </Badge>
              <h1 className="text-4xl font-bold leading-[1.15] tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
                A calmer mind is one <span className="text-primary italic font-medium">conversation</span> away.
              </h1>
              <p className="mt-6 max-w-lg text-base text-slate-600 leading-relaxed md:text-lg">
                Match with licensed therapists across Kenya. Book in minutes, pay with M-Pesa, and meet privately by video — all in one safe space.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Button size="lg" asChild className="rounded-xl px-8 h-12 text-sm font-semibold shadow-card hover:shadow-subtle transition-all active:scale-95">
                  <Link to="/therapists">
                    Find a therapist <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="rounded-xl px-8 h-12 text-sm font-semibold border border-slate-200 hover:bg-white hover:shadow-subtle transition-all">
                  <Link to="/auth" search={{ mode: "signup" } as never}>Get Started</Link>
                </Button>
              </div>
              <div className="mt-12 flex items-center gap-10 text-[13px] font-medium text-slate-500">
                <div className="flex items-center gap-2.5"><ShieldCheck className="h-5 w-5 text-primary/60" /> Confidential</div>
                <div className="flex items-center gap-2.5"><Smartphone className="h-5 w-5 text-primary/60" /> M-Pesa Integrated</div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-slate-100 shadow-card">
                <img src={heroImg} alt="Calm therapy environment" width={1536} height={1024} className="h-full w-full object-cover" />
              </div>
              <div className="absolute -bottom-6 -left-6 hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-card md:block">
                <div className="flex items-center gap-4">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><CalendarCheck className="h-5 w-5" /></div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Session booked</div>
                    <div className="text-[12px] font-medium text-slate-500">Tomorrow · 10:00 AM</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 md:py-32">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Care that fits your life</h2>
            <p className="mt-4 text-base text-slate-600 leading-relaxed">Everything you need from first hello to ongoing support.</p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="group relative rounded-2xl border border-slate-100 bg-white p-5 transition-all duration-300 hover:shadow-card hover:-translate-y-1">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 text-slate-600 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-6 text-lg font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-[14px] text-slate-500 leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="pb-24 md:pb-32">
          <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white px-8 py-12 text-center md:px-16 md:py-16 shadow-card">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,var(--color-primary-soft),transparent_70%)] opacity-20"></div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Take the first step today</h2>
            <p className="mx-auto mt-4 max-w-lg text-base text-slate-600 leading-relaxed">Reaching out is the bravest part. We'll handle the rest.</p>
            <Button size="lg" asChild className="mt-10 rounded-xl px-10 h-12 text-sm font-semibold shadow-card hover:shadow-subtle transition-all active:scale-95">
              <Link to="/therapists">Browse therapists</Link>
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
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