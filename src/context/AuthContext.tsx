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
  signInOffline: (email: string, name: string, businessName: string, role?: string) => Promise<void>;
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
        } else {
          // 2. Check offline session in localStorage or Dexie profiles
          const savedUser = localStorage.getItem("waymark_user_session");
          if (savedUser) {
            try {
              const parsed = JSON.parse(savedUser);
              setUser(parsed);
            } catch {}
          } else {
            const firstProfile = await db.profiles.toCollection().first();
            if (firstProfile) {
              const u = {
                id: firstProfile.id,
                email: firstProfile.email || "demo@distributor.com",
                user_metadata: {
                  name: firstProfile.name,
                  business_name: (firstProfile as any).business_name,
                  role: (firstProfile as any).role || "admin",
                },
                app_metadata: {},
                aud: "authenticated",
                created_at: firstProfile.created_at,
              } as User;
              setUser(u);
              if ((firstProfile as any).onboarding_completed) {
                setOnboardingCompletedState(true);
              }
            }
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

    if (!user && !isPublic) {
      // Unauthenticated user -> Redirect to /login
      router.replace("/login");
    } else if (user) {
      if (!onboardingCompleted && pathname !== "/onboarding" && pathname !== "/welcome") {
        // Logged in but onboarding not done -> Redirect to /onboarding
        router.replace("/onboarding");
      } else if (onboardingCompleted && (pathname === "/login" || pathname === "/signup")) {
        // Logged in & onboarded -> Redirect to home cockpit
        router.replace("/");
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

  const signInOffline = async (email: string, name: string, businessName: string, role: string = "owner") => {
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
      onboarding_completed: false,
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
