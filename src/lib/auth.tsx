"use client";
import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
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
  role: "admin", site: null, active: true, photo_url: null, phone: null, created_at: "",
};

// Fixed demo accounts (offline preview mode). Only these credentials sign in.
const DEMO_USERS: Record<string, { password: string; profile: Profile }> = {
  "admin@evaluahealth.mx": {
    password: "Admin@123",
    profile: {
      id: "demo-admin", full_name: "Carlos Mendoza", email: "admin@evaluahealth.mx",
      role: "admin", site: null, active: true, photo_url: null, phone: null, created_at: "",
    },
  },
  "evaluator@evaluahealth.mx": {
    password: "Eval@123",
    profile: {
      id: "demo-evaluator", full_name: "Dr. Maria Rodriguez", email: "evaluator@evaluahealth.mx",
      role: "evaluator", site: "Demo Site", active: true, photo_url: null, phone: null, created_at: "",
    },
  },
};

const profileCache = new Map<string, Profile>();

function fallbackProfile(user: User): Profile {
  return {
    id: user.id, full_name: "", email: user.email || "",
    role: (user.email || "").toLowerCase().includes("admin") ? "admin" : "evaluator",
    site: null, active: true, photo_url: null, phone: null, created_at: "",
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const activeLoad = useRef(0);

  const loadProfileForUser = useCallback(async (user: User) => {
    const cached = profileCache.get(user.id);
    if (cached) return cached;
    const sb = getSupabase();
    if (!sb) return fallbackProfile(user);
    const { data } = await sb.from("profiles").select("*").eq("id", user.id).maybeSingle();
    const next = data ? data as Profile : fallbackProfile(user);
    profileCache.set(user.id, next);
    return next;
  }, []);

  const loadProfile = useCallback(async () => {
    const requestId = ++activeLoad.current;
    const sb = getSupabase();
    if (!sb) { setLoading(false); return; }
    const { data: { session } } = await sb.auth.getSession();
    if (requestId !== activeLoad.current) return;
    if (!session?.user) { setProfile(null); setLoading(false); return; }
    const next = await loadProfileForUser(session.user);
    if (requestId !== activeLoad.current) return;
    setProfile(next.active === false ? null : next);
    setLoading(false);
  }, [loadProfileForUser]);

  useEffect(() => {
    if (PREVIEW_BYPASS) { setProfile(DEMO_ADMIN); setLoading(false); return; }
    loadProfile();
    const sb = getSupabase();
    if (!sb) return;
    const { data: sub } = sb.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      if (session?.user) {
        loadProfileForUser(session.user).then((next) => {
          setProfile(next.active === false ? null : next);
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile, loadProfileForUser]);

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
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    const user = data.user || data.session?.user;
    if (!user) return { error: "Sign-in failed" };
    const next = await loadProfileForUser(user);
    if (next.active === false) {
      await sb.auth.signOut();
      profileCache.delete(user.id);
      setProfile(null);
      setLoading(false);
      return { error: "This account is disabled. Contact an administrator." };
    }
    setProfile(next);
    setLoading(false);
    return { role: next.role };
  }, [loadProfileForUser]);

  const signOut = useCallback(async () => {
    const sb = getSupabase();
    if (sb) await sb.auth.signOut();
    profileCache.clear();
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
