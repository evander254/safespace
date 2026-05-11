import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, LogOut, Menu, MessageSquare, Bell, User, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export function SiteHeader() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-100 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5 font-semibold group">
          <div className="relative flex h-8 w-8 items-center justify-center">
            <div className="absolute inset-0 bg-primary/20 rounded-[40%_60%_70%_30%] animate-[pulse_4s_infinite] blur-sm"></div>
            <div className="relative h-7 w-7 bg-primary rounded-[60%_40%_30%_70%] flex items-center justify-center text-primary-foreground shadow-subtle transition-transform group-hover:scale-110">
              <Heart className="h-3.5 w-3.5 fill-current" />
            </div>
          </div>
          <span className="text-[17px] tracking-tight font-bold text-slate-900">Safe Space</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link to="/therapists" className="rounded-full px-4 py-1.5 text-[13px] font-medium text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-900" activeProps={{ className: "text-slate-900 bg-slate-50" }}>
            Find a therapist
          </Link>
          {user && (
            <>
              <Link to="/bookings" className="rounded-full px-4 py-1.5 text-[13px] font-medium text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-900" activeProps={{ className: "text-slate-900 bg-slate-50" }}>
                My bookings
              </Link>
              <div className="flex items-center gap-2 border-l border-slate-100 pl-4 ml-2">
                <Link to="/messages" className="relative group/nav grid h-8 w-8 place-items-center rounded-full text-slate-400 transition-all hover:bg-slate-50 hover:text-slate-900" activeProps={{ className: "text-slate-900 bg-slate-50" }}>
                  <MessageSquare className="h-4 w-4 transition-transform group-hover/nav:scale-110" />
                </Link>
                <Link to="/notifications" className="relative group/nav grid h-8 w-8 place-items-center rounded-full text-slate-400 transition-all hover:bg-slate-50 hover:text-slate-900" activeProps={{ className: "text-slate-900 bg-slate-50" }}>
                  <Bell className="h-4 w-4 transition-transform group-hover/nav:scale-110" />
                </Link>
                <Link to="/profile" className="group/nav grid h-8 w-8 place-items-center rounded-full text-slate-400 transition-all hover:bg-slate-50 hover:text-slate-900" activeProps={{ className: "text-slate-900 bg-slate-50" }}>
                  <User className="h-4 w-4 transition-transform group-hover/nav:scale-110" />
                </Link>
              </div>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <Button variant="ghost" size="sm" className="hidden h-9 rounded-xl px-4 md:flex text-slate-600 font-semibold" onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </Button>
          ) : (
            <Button size="sm" asChild className="hidden h-9 rounded-xl px-5 md:flex shadow-subtle font-semibold">
              <Link to="/auth" search={{ mode: "signin" } as any}>Sign in</Link>
            </Button>
          )}
          <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 rounded-lg" onClick={() => setOpen(!open)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="container mx-auto border-t border-border p-4 md:hidden">
          <nav className="flex flex-col gap-2">
            <Link to="/therapists" className="rounded-lg px-3 py-2 text-sm hover:bg-muted" onClick={() => setOpen(false)}>
              Find a therapist
            </Link>
            {user && (
              <>
                <Link to="/messages" className="rounded-lg px-3 py-2 text-sm hover:bg-muted" onClick={() => setOpen(false)}>
                  Inbox
                </Link>
                <Link to="/bookings" className="rounded-lg px-3 py-2 text-sm hover:bg-muted" onClick={() => setOpen(false)}>
                  My bookings
                </Link>
                <Link to="/profile" className="rounded-lg px-3 py-2 text-sm hover:bg-muted" onClick={() => setOpen(false)}>
                  My Profile
                </Link>
              </>
            )}
            {user ? (
              <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate({ to: "/" }); setOpen(false); }}>
                Sign out
              </Button>
            ) : (
              <Button size="sm" asChild className="rounded-full">
                <Link to="/auth" search={{ mode: "signin" } as any} onClick={() => setOpen(false)}>Sign in</Link>
              </Button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}