"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import type { CurrentAuth } from "@/lib/auth/currentAuth";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const CurrentAuthContext = createContext<CurrentAuth>({
  authenticated: false,
  userId: null,
  role: null,
});

export function useCurrentAuth(): CurrentAuth {
  return useContext(CurrentAuthContext);
}

export function CurrentAuthProvider({
  initialAuth,
  children,
}: {
  initialAuth: CurrentAuth;
  children: ReactNode;
}) {
  const router = useRouter();
  const [auth, setAuth] = useState(initialAuth);

  useEffect(() => {
    setAuth(initialAuth);
  }, [initialAuth.authenticated, initialAuth.role, initialAuth.userId]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") return;
      if (event === "SIGNED_OUT") {
        setAuth({ authenticated: false, userId: null, role: null });
        router.refresh();
        return;
      }
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        router.refresh();
      }
    });
    return () => data.subscription.unsubscribe();
  }, [router]);

  return <CurrentAuthContext.Provider value={auth}>{children}</CurrentAuthContext.Provider>;
}
