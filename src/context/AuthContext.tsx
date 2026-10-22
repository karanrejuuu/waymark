"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { db } from "@/lib/db/dexie";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signOut: async () => {},
});

const PUBLIC_ROUTES = ["/welcome", "/login"];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createBrowserClient();

    // 1. Check existing Supabase session
    async function initAuth() {
      try {
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        setUser(data.session?.user ?? null);

        // Fallback: check if local profile exists (for offline testing mode)
        if (!data.session?.user) {
          const profileCount = await db.profiles.count();
          if (profileCount > 0) {
            const firstProfile = await db.profiles.toCollection().first();
            if (firstProfile) {
              setUser({
                id: firstProfile.id,
                email: firstProfile.email || "demo@distributor.com",
                user_metadata: { name: firstProfile.name },
                app_metadata: {},
                aud: "authenticated",
                created_at: firstProfile.created_at,
              } as User);
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

    // 2. Listen to live auth changes (login, logout, refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 3. Enforce Route Protection
  useEffect(() => {
    if (isLoading) return;

    const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

    if (!user && !isPublic) {
      // Unauthenticated user trying to access protected SaaS route -> Redirect to /welcome
      router.replace("/welcome");
    } else if (user && pathname === "/login") {
      // Authenticated user trying to access login -> Redirect to /
      router.replace("/");
    }
  }, [user, isLoading, pathname, router]);

  const signOut = async () => {
    const supabase = createBrowserClient();
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Supabase signOut error:", err);
    }
    await db.profiles.clear();
    setUser(null);
    setSession(null);
    router.replace("/welcome");
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
