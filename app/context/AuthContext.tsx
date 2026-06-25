"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

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

  async function refresh() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setAuth(defaultAuth);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
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
          role: user.user_metadata?.role || null,
          mobile: user.user_metadata?.mobile_number || null,
          name: user.user_metadata?.name || null,
          status: "pending",
        });
      }
    } catch {
      setAuth(defaultAuth);
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
