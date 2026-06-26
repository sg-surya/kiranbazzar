"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

type AuthState = {
  loggedIn: boolean;
  role: string | null;
  mobile: string | null;
  name: string | null;
  status: string | null;
};

type AuthContextType = AuthState & {
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const defaultAuth: AuthState = {
  loggedIn: false,
  role: null,
  mobile: null,
  name: null,
  status: null,
};

const AuthContext = createContext<AuthContextType>({
  ...defaultAuth,
  logout: async () => {},
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(defaultAuth);
  const [ready, setReady] = useState(false);
  const fetching = useRef(false);

  async function refresh() {
    if (fetching.current) return;
    fetching.current = true;
    try {
      const supabase = createClient();

      const { data: sessionData } = await supabase.auth.getSession();
      const sessionUser = sessionData?.session?.user ?? null;

      if (!sessionUser) {
        setAuth(defaultAuth);
        setReady(true);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", sessionUser.id)
        .maybeSingle();

      if (profile) {
        setAuth({
          loggedIn: true,
          role: profile.role || null,
          mobile: profile.mobile_number || null,
          name: profile.name || profile.dukan_name || null,
          status: profile.status || "approved",
        });
      } else {
        setAuth({
          loggedIn: true,
          role: sessionUser.user_metadata?.role || null,
          mobile: sessionUser.user_metadata?.mobile_number || null,
          name: sessionUser.user_metadata?.name || null,
          status: "pending",
        });
      }
    } catch {
      setAuth(defaultAuth);
    } finally {
      fetching.current = false;
      setReady(true);
    }
  }

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setAuth(defaultAuth);
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <AuthContext.Provider value={{ ...auth, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
