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
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-soft)]">
            <Heart className="h-4 w-4" />
          </span>
          <span className="text-lg tracking-tight">safe space</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link to="/therapists" className="rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" activeProps={{ className: "text-foreground bg-muted" }}>
            Find a therapist
          </Link>
          {user && (
            <>
              <Link to="/bookings" className="rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" activeProps={{ className: "text-foreground" }}>
                My bookings
              </Link>
              <div className="flex items-center gap-1 border-l border-border pl-6 ml-2">
                <Link to="/messages" className="relative grid h-10 w-10 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" activeProps={{ className: "text-foreground bg-muted" }}>
                  <MessageSquare className="h-5 w-5" />
                </Link>
                <Link to="/messages" className="relative grid h-10 w-10 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" activeProps={{ className: "text-foreground bg-muted" }}>
                  <Bell className="h-5 w-5" />
                </Link>
                <Link to="/profile" className="grid h-10 w-10 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" activeProps={{ className: "text-foreground bg-muted" }}>
                  <User className="h-5 w-5" />
                </Link>
              </div>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <Button variant="ghost" size="sm" className="hidden rounded-full md:flex" onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </Button>
          ) : (
            <Button size="sm" asChild className="hidden rounded-full md:flex shadow-glow">
              <Link to="/auth" search={{ mode: "signin" } as any}>Sign in</Link>
            </Button>
          )}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(!open)}>
            {open ? <X /> : <Menu />}
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