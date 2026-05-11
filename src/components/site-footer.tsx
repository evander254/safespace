import { Link } from "@tanstack/react-router";
import { ShieldCheck, Lock, HeartHandshake } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-slate-100 bg-white pb-12 pt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-16 md:grid-cols-3">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5 font-bold text-slate-900">
              <div className="h-6 w-6 bg-primary rounded-[40%_60%_70%_30%] flex items-center justify-center text-white scale-90 shadow-subtle">
                <ShieldCheck className="h-3.5 w-3.5" />
              </div>
              Safe Space
            </div>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
              Making mental healthcare accessible, affordable, and professional for every Kenyan.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-12 md:col-span-2">
            <div className="flex flex-col gap-5">
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Trust & Safety</h4>
              <div className="flex flex-col gap-3.5">
                <div className="flex items-center gap-2.5 text-sm text-slate-600">
                  <ShieldCheck className="h-4 w-4 text-primary/60" />
                  <span>Certified Therapists</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-slate-600">
                  <Lock className="h-4 w-4 text-primary/60" />
                  <span>Secure Sessions</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-slate-600">
                  <HeartHandshake className="h-4 w-4 text-primary/60" />
                  <span>Confidential</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-5">
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Resources</h4>
              <nav className="flex flex-col gap-3.5">
                <Link to="/" className="text-sm text-slate-600 hover:text-primary transition-colors font-medium">
                  Featured Articles
                </Link>
                <Link to="/therapists" className="text-sm text-slate-600 hover:text-primary transition-colors font-medium">
                  Find a Therapist
                </Link>
                <Link to="/" className="text-sm text-slate-600 hover:text-primary transition-colors font-medium">
                  Privacy Policy
                </Link>
              </nav>
            </div>
          </div>
        </div>
        
        <div className="mt-20 flex flex-col items-center justify-between gap-6 border-t border-slate-100 pt-10 md:flex-row">
          <p className="text-[12px] font-medium text-slate-400">
            © {new Date().getFullYear()} Safe Space Kenya. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <div className="h-6 w-px bg-slate-100"></div>
            <span className="text-[12px] font-medium text-slate-400 italic">
              "Your journey to healing starts here."
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
