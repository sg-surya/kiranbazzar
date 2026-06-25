"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { getAllUsers, seedAdmin, type StoredUser } from "@/lib/data";

type AuthState = {
  loggedIn: boolean;
  role: string | null;
  mobile: string | null;
  name: string | null;
  status: string | null;
};

type AuthContextType = AuthState & {
  logout: () => void;
  refresh: () => void;
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
  logout: () => {},
  refresh: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(defaultAuth);

  function refresh() {
    if (typeof window === "undefined") return;
    seedAdmin();
    const sessionRaw = localStorage.getItem("kb_session");
    if (sessionRaw) {
      try {
        const session = JSON.parse(sessionRaw);
        if (session.loggedIn) {
          let name: string | null = null;
          let status: string | null = null;
          const mobile = session.mobile || null;
          const allUsers = getAllUsers();
          const liveUser: StoredUser | undefined = allUsers.find((u) => u.mobileNumber === mobile);
          if (liveUser) {
            name = liveUser.name || liveUser.dukanName || null;
            status = liveUser.status || "approved";
          }
          setAuth({ loggedIn: true, role: session.role || null, mobile, name, status });
          return;
        }
      } catch {}
    }
    setAuth(defaultAuth);
  }

  function logout() {
    localStorage.removeItem("kb_session");
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
