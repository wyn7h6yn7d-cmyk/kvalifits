"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import type { CurrentAuth } from "@/lib/auth/currentAuth";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const CurrentAuthContext = createContext<CurrentAuth>({
  authenticated: false,
  userId: null,
  role: null,
  isBlocked: false,
});

export function useCurrentAuth(): CurrentAuth {
  return useContext(CurrentAuthContext);
}

function authChanged(a: CurrentAuth, b: CurrentAuth): boolean {
  return (
    a.authenticated !== b.authenticated ||
    a.role !== b.role ||
    a.userId !== b.userId ||
    a.isBlocked !== b.isBlocked
  );
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
  const [prevInitial, setPrevInitial] = useState(initialAuth);

  if (authChanged(prevInitial, initialAuth)) {
    setPrevInitial(initialAuth);
    setAuth(initialAuth);
  }

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") return;
      if (event === "SIGNED_OUT") {
        setAuth({ authenticated: false, userId: null, role: null, isBlocked: false });
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
