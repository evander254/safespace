import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "client" | "therapist" | "admin";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  loading: boolean;
  intakeCompleted: boolean;
  isApproved: boolean;
  onboardingCompleted: boolean;
  isEmailConfirmed: boolean;
  signOut: () => Promise<void>;
  refreshRoles: () => Promise<void>;
  refreshTherapistStatus: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [therapistStatus, setTherapistStatus] = useState({ is_approved: false, onboarding_completed: false });
  const [loading, setLoading] = useState(true);

  const loadRoles = async (uid: string | undefined) => {
    if (!uid) {
      setRoles([]);
      setTherapistStatus({ is_approved: false, onboarding_completed: false });
      return;
    }
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
    const rolesList = (data ?? []).map((r: { role: AppRole }) => r.role);
    setRoles(rolesList);

    if (rolesList.includes("therapist")) {
      await fetchTherapistStatus(uid);
    }
  };

  const fetchTherapistStatus = async (uid: string) => {
    const { data } = await supabase.from("therapists").select("is_approved, onboarding_completed").eq("id", uid).single();
    if (data) {
      setTherapistStatus({
        is_approved: data.is_approved,
        onboarding_completed: data.onboarding_completed
      });
    }
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      // defer to avoid deadlocks
      setTimeout(() => {
        if (s?.user?.id) loadRoles(s.user.id);
        else loadRoles(undefined);
      }, 0);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user?.id) {
        loadRoles(data.session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <Ctx.Provider
      value={{
        user,
        session,
        roles,
        loading,
        intakeCompleted: !!user?.user_metadata?.intake_completed,
        isApproved: therapistStatus.is_approved,
        onboardingCompleted: therapistStatus.onboarding_completed,
        isEmailConfirmed: !!user?.email_confirmed_at,
        signOut: async () => {
          await supabase.auth.signOut();
        },
        refreshRoles: () => user?.id ? loadRoles(user.id) : Promise.resolve(),
        refreshTherapistStatus: () => user ? fetchTherapistStatus(user.id) : Promise.resolve(),
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside AuthProvider");
  return c;
}