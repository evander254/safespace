import { createFileRoute, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { 
  Calendar, 
  MessageSquare, 
  User, 
  Bell, 
  Video, 
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Menu
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Route = createFileRoute("/therapist")({
  component: TherapistLayout,
});

function TherapistLayout() {
  const { user, roles, loading, onboardingCompleted, isApproved, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user || !roles.includes("therapist")) {
      navigate({ to: "/auth", search: { mode: "signin" } });
    } else if (!onboardingCompleted) {
      navigate({ to: "/therapist-onboarding" });
    }
  }, [user, roles, loading, onboardingCompleted, navigate]);

  const { data: unreadNotifications } = useQuery({
    queryKey: ["unread-notifications", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });

  if (loading || !user) return null;

  const navItems = [
    { title: "Dashboard", icon: LayoutDashboard, to: "/therapist" },
    { title: "Bookings", icon: Calendar, to: "/therapist/bookings" },
    { title: "Messages", icon: MessageSquare, to: "/therapist/messages" },
    { title: "Notifications", icon: Bell, to: "/therapist/notifications", badge: unreadNotifications },
    { title: "Video Sessions", icon: Video, to: "/therapist/sessions" },
    { title: "Profile", icon: User, to: "/therapist/profile" },
  ];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar className="border-r border-border/50">
          <SidebarHeader className="p-6">
            <div className="flex items-center gap-3 font-bold text-xl tracking-tight text-primary">
              <div className="bg-primary text-primary-foreground p-1.5 rounded-xl shadow-lg">
                <ShieldCheck className="h-6 w-6" />
              </div>
              Safe Space
            </div>
          </SidebarHeader>

          <SidebarContent className="px-3">
            <SidebarMenu className="space-y-1">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title} className="relative">
                    <Link 
                      to={item.to} 
                      className="flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200"
                      activeProps={{ className: "bg-primary text-primary-foreground shadow-md font-medium" }}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-border/50">
            <div className="flex items-center gap-3 px-2 py-1 mb-4">
              <Avatar className="h-9 w-9 border border-border">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback>{user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium truncate">{user?.user_metadata?.full_name || "Therapist"}</span>
                <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
              </div>
            </div>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-3 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => {
                signOut();
                navigate({ to: "/" });
              }}
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </Button>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="h-16 border-b border-border bg-card/50 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="md:hidden" />
              <h2 className="text-lg font-semibold capitalize">
                {window.location.pathname.split("/").pop() || "Dashboard"}
              </h2>
            </div>
            {!isApproved && (
              <div className="bg-amber-500/10 text-amber-500 text-xs px-3 py-1 rounded-full border border-amber-500/20 font-medium">
                Pending Approval
              </div>
            )}
          </header>
          <div className="flex-1 overflow-y-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
