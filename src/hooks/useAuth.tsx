import { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

type AppRole = "super_admin" | "admin_staff" | "broker";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roles: AppRole[];
  profile: { id: string; full_name: string; email: string | null; phone: string | null; avatar_url: string | null } | null;
  subscription: {
    id: string;
    plan_id: string;
    status: string;
    trial_ends_at: string | null;
    current_period_end: string | null;
    plan?: { name: string; modules: string[]; max_properties: number; max_brokers: number };
  } | null;
  signOut: () => Promise<void>;
  isSuperAdmin: boolean;
  isAdminStaff: boolean;
  isBroker: boolean;
  isBlocked: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [profile, setProfile] = useState<AuthContextType["profile"]>(null);
  const [subscription, setSubscription] = useState<AuthContextType["subscription"]>(null);

  const fetchUserData = async (userId: string) => {
    const [rolesRes, profileRes, subRes] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase.from("profiles").select("*").eq("user_id", userId).single(),
      supabase.from("subscriptions").select("*, plans(name, modules, max_properties, max_brokers)").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);

    if (rolesRes.data) {
      setRoles(rolesRes.data.map((r: any) => r.role as AppRole));
    }
    if (profileRes.data) {
      setProfile(profileRes.data as any);
    }
    if (subRes.data) {
      const sub = subRes.data as any;
      setSubscription({
        ...sub,
        plan: sub.plans ? {
          name: sub.plans.name,
          modules: Array.isArray(sub.plans.modules) ? sub.plans.modules : [],
          max_properties: sub.plans.max_properties,
          max_brokers: sub.plans.max_brokers,
        } : undefined,
      });
    }
  };

  useEffect(() => {
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(() => fetchUserData(session.user.id), 0);
        } else {
          setRoles([]);
          setProfile(null);
          setSubscription(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      }
      setLoading(false);
    });

    return () => authSub.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const isSuperAdmin = roles.includes("super_admin");
  const isAdminStaff = roles.includes("admin_staff");
  const isBroker = roles.includes("broker");
  const isBlocked = subscription?.status === "blocked";

  return (
    <AuthContext.Provider value={{ user, session, loading, roles, profile, subscription, signOut, isSuperAdmin, isAdminStaff, isBroker, isBlocked }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
