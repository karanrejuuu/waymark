"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { db, LocalProfile } from "@/lib/db/dexie";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  onboardingCompleted: boolean;
  setOnboardingCompleted: (val: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  signInOffline: (email: string, name: string, businessName: string, role?: string, completedOnboarding?: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  onboardingCompleted: false,
  setOnboardingCompleted: async () => {},
  signOut: async () => {},
  signInOffline: async () => {},
});

const PUBLIC_ROUTES = ["/login", "/signup", "/welcome"];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompletedState] = useState(false);

  useEffect(() => {
    const supabase = createBrowserClient();

    async function initAuth() {
      try {
        // Check localStorage onboarding flag first
        const localOnboarding = localStorage.getItem("waymark_onboarding_completed") === "true";
        setOnboardingCompletedState(localOnboarding);

        // 1. Check Supabase session
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          setSession(data.session);
          setUser(data.session.user);
          // Check profile onboarding status
          const existingProfile = await db.profiles.get(data.session.user.id);
          const hasOnboarded =
            localOnboarding ||
            (existingProfile as any)?.onboarding_completed === true;
          setOnboardingCompletedState(Boolean(hasOnboarded));
        } else {
          // 2. Check offline session in localStorage only if user explicitly logged in
          const savedUser = localStorage.getItem("waymark_user_session");
          if (savedUser) {
            try {
              const parsed = JSON.parse(savedUser);
              setUser(parsed);
              const existingProfile = parsed?.id ? await db.profiles.get(parsed.id) : null;
              const hasOnboarded =
                localOnboarding ||
                (existingProfile as any)?.onboarding_completed === true;
              setOnboardingCompletedState(Boolean(hasOnboarded));
            } catch {
              localStorage.removeItem("waymark_user_session");
              setUser(null);
            }
          } else {
            // Unauthenticated: do NOT auto-login from arbitrary Dexie profiles
            setUser(null);
            setOnboardingCompletedState(false);
          }
        }
      } catch (err) {
        console.warn("Auth initialization warning:", err);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();

    // Listen to live auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        setUser(newSession.user);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Enforce Route Protection
  useEffect(() => {
    if (isLoading) return;

    const isPublic = PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/"));

    if (!user) {
      // Unauthenticated visitor: protect private routes (/ and /onboarding require login/signup first)
      if (!isPublic) {
        router.replace("/login");
      }
    } else {
      // Authenticated visitor:
      // When visiting dashboard "/", ensure setup is completed
      if (pathname === "/") {
        if (!onboardingCompleted) {
          router.replace("/onboarding");
        }
      }
    }
  }, [user, isLoading, onboardingCompleted, pathname, router]);

  const setOnboardingCompleted = async (val: boolean) => {
    setOnboardingCompletedState(val);
    if (val) {
      localStorage.setItem("waymark_onboarding_completed", "true");
      if (user) {
        const existingProfile = await db.profiles.get(user.id);
        if (existingProfile) {
          await db.profiles.update(user.id, { onboarding_completed: true } as any);
        }
      }
    } else {
      localStorage.removeItem("waymark_onboarding_completed");
    }
  };

  const signInOffline = async (
    email: string,
    name: string,
    businessName: string,
    role: string = "owner",
    completedOnboarding: boolean = false
  ) => {
    const id = `user-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const userRole: "owner" | "staff" | "delivery" =
      role === "driver" || role === "delivery" ? "delivery" : role === "backoffice" || role === "staff" ? "staff" : "owner";

    const profileRecord: LocalProfile = {
      id,
      name,
      email,
      phone: null,
      role: userRole,
      push_subscription: null,
      business_name: businessName,
      onboarding_completed: completedOnboarding,
      created_at: nowIso,
    };
    await db.profiles.put(profileRecord);
    const mockUser = {
      id,
      email,
      user_metadata: { name, business_name: businessName, role },
      app_metadata: {},
      aud: "authenticated",
      created_at: nowIso,
    } as User;
    setUser(mockUser);
    localStorage.setItem("waymark_user_session", JSON.stringify(mockUser));
    if (completedOnboarding) {
      localStorage.setItem("waymark_onboarding_completed", "true");
      setOnboardingCompletedState(true);
    } else {
      localStorage.removeItem("waymark_onboarding_completed");
      setOnboardingCompletedState(false);
    }
  };

  const signOut = async () => {
    const supabase = createBrowserClient();
    try {
      await supabase.auth.signOut();
    } catch (err) {}
    localStorage.removeItem("waymark_user_session");
    localStorage.removeItem("waymark_onboarding_completed");
    setUser(null);
    setSession(null);
    setOnboardingCompletedState(false);
    router.replace("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        onboardingCompleted,
        setOnboardingCompleted,
        signOut,
        signInOffline,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
