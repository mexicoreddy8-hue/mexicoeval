"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getSupabase, SUPABASE_READY } from "./supabase";
import type { Profile, Role } from "./types";

const PREVIEW_BYPASS = process.env.NEXT_PUBLIC_PREVIEW_BYPASS === "1";

interface AuthCtx {
  profile: Profile | null;
  loading: boolean;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string; role?: Role }>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  profile: null,
  loading: true,
  ready: SUPABASE_READY,
  signIn: async () => ({ error: "not ready" }),
  signOut: async () => {},
  refresh: async () => {},
});

// Demo profile used when preview bypass is on (no supabase)
const DEMO_ADMIN: Profile = {
  id: "demo-admin", full_name: "Admin Demo", email: "admin@evaluahealth.mx",
  role: "admin", site: null, photo_url: null, phone: null, created_at: "",
};

// Fixed demo accounts (offline preview mode). Only these credentials sign in.
const DEMO_USERS: Record<string, { password: string; profile: Profile }> = {
  "admin@evaluahealth.mx": {
    password: "Admin@123",
    profile: {
      id: "demo-admin", full_name: "Carlos Mendoza", email: "admin@evaluahealth.mx",
      role: "admin", site: null, photo_url: null, phone: null, created_at: "",
    },
  },
  "evaluator@evaluahealth.mx": {
    password: "Eval@123",
    profile: {
      id: "demo-evaluator", full_name: "Dr. Maria Rodriguez", email: "evaluator@evaluahealth.mx",
      role: "evaluator", site: "Guadalajara", photo_url: null, phone: null, created_at: "",
    },
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) { setLoading(false); return; }
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setProfile(null); setLoading(false); return; }
    const { data } = await sb.from("profiles").select("*").eq("id", user.id).single();
    if (data) setProfile(data as Profile);
    else setProfile({
      id: user.id, full_name: "", email: user.email || "",
      role: (user.email || "").toLowerCase().includes("admin") ? "admin" : "evaluator",
      site: null, photo_url: null, phone: null, created_at: "",
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    if (PREVIEW_BYPASS) { setProfile(DEMO_ADMIN); setLoading(false); return; }
    loadProfile();
    const sb = getSupabase();
    if (!sb) return;
    const { data: sub } = sb.auth.onAuthStateChange(() => loadProfile());
    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (PREVIEW_BYPASS) {
      const account = DEMO_USERS[email.trim().toLowerCase()];
      if (!account) return { error: "No account found for this email." };
      if (account.password !== password) return { error: "Incorrect password." };
      setProfile(account.profile);
      return { role: account.profile.role };
    }
    const sb = getSupabase();
    if (!sb) return { error: "Supabase not configured" };
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return { error: "Sign-in failed" };
    const { data } = await sb.from("profiles").select("*").eq("id", user.id).single();
    const role: Role = (data?.role as Role) ||
      ((user.email || "").toLowerCase().includes("admin") ? "admin" : "evaluator");
    if (data) setProfile(data as Profile);
    return { role };
  }, []);

  const signOut = useCallback(async () => {
    const sb = getSupabase();
    if (sb) await sb.auth.signOut();
    setProfile(null);
  }, []);

  return (
    <Ctx.Provider value={{ profile, loading, ready: SUPABASE_READY, signIn, signOut, refresh: loadProfile }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);

/** Guard for portal pages. Redirects to login if no session, or wrong role. */
export function useGuard(required: Role) {
  const { profile, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (loading) return;
    if (!profile) { router.replace("/"); return; }
    if (profile.role !== required) {
      router.replace(profile.role === "admin" ? "/admin/dashboard" : "/evaluator/dashboard");
    }
  }, [profile, loading, required, router]);
  return { profile, loading };
}
