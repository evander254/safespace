import { createFileRoute, Outlet, Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { 
  ShieldCheck, 
  LayoutDashboard, 
  Users, 
  Stethoscope, 
  Calendar, 
  DollarSign, 
  Settings, 
  LogOut,
  ChevronRight,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { roles, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [authorized, setAuthorized] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    const superAdminSession = localStorage.getItem("safespace_admin_session");
    const isSuperAdmin = superAdminSession && JSON.parse(superAdminSession).expiry > Date.now();

    if (!roles.includes("admin") && !isSuperAdmin) {
      navigate({ to: "/admin/safespace/loginHere" });
    } else {
      setAuthorized(true);
    }
  }, [roles, authLoading, navigate]);

  if (authLoading || (!authorized)) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <ShieldCheck className="h-12 w-12 animate-pulse text-primary" />
      </div>
    );
  }

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, to: "/admin" },
    { label: "Applications", icon: Stethoscope, to: "/admin/applications" },
    { label: "Therapists", icon: Users, to: "/admin/therapists" },
    { label: "Financials", icon: DollarSign, to: "/admin" },
    { label: "Bookings", icon: Calendar, to: "/admin/bookings" }, 
    { label: "Users", icon: Users, to: "/admin/users" },
    { label: "Settings", icon: Settings, to: "/admin" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("safespace_admin_session");
    navigate({ to: "/admin/safespace/loginHere" });
  };

  return (
    <div className="flex min-h-screen bg-[#fcfcfd]">
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-[#0a0a0a] text-white transition-all duration-300 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col p-6">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">SafeSpace</h1>
              <p className="text-[10px] uppercase tracking-widest text-white/40">Admin Panel</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all hover:bg-white/5",
                    isActive ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-white/60 hover:text-white"
                  )}
                >
                  <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-white/40 group-hover:text-white")} />
                  {item.label}
                  {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto border-t border-white/10 pt-6">
            <button 
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white/60 transition-all hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 transition-all duration-300 lg:pl-72",
        !sidebarOpen && "lg:pl-0"
      )}>
        {/* Mobile Header */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-black/5 bg-white/80 px-4 backdrop-blur-md lg:hidden">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <span className="font-bold">SafeSpace</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X /> : <Menu />}
          </Button>
        </header>

        <div className="min-h-screen">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
