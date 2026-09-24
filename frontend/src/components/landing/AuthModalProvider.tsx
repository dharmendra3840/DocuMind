"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/appStore";
import { AuthModal, type AuthMode } from "./AuthModal";

// Codes the backend appends as /?auth_error=<code> when Google sign-in fails.
const OAUTH_ERRORS: Record<string, string> = {
  access_denied: "Google sign-in was cancelled.",
  email_not_verified: "Your Google account's email isn't verified.",
  not_configured: "Google sign-in isn't available right now. Use email instead.",
};
const OAUTH_ERROR_FALLBACK = "Google sign-in failed. Please try again or use email.";

const OpenAuthContext = createContext<(mode: AuthMode) => void>(() => {});

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const hydrated = useAppStore((s) => s.hydrated);
  const [mode, setMode] = useState<AuthMode | null>(null);
  const [initialError, setInitialError] = useState("");

  // Signed-in visitors (including right after signing in here) go to the app.
  // Read in an effect, not during render: the store rehydrates from
  // localStorage on the client only, so rendering from it would mismatch SSR.
  useEffect(() => {
    if (!hydrated) return;
    if (user) router.replace("/chat");
    else document.documentElement.removeAttribute("data-authed");
  }, [hydrated, user, router]);

  // Deep links: /?auth=login, /?auth=register, and OAuth failures.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("auth");
    const oauthError = params.get("auth_error");
    if (oauthError) {
      setInitialError(OAUTH_ERRORS[oauthError] ?? OAUTH_ERROR_FALLBACK);
      setMode("login");
    } else if (requested === "login" || requested === "register") {
      setMode(requested);
    } else {
      return;
    }
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  const open = useCallback((m: AuthMode) => { setInitialError(""); setMode(m); }, []);
  const close = useCallback(() => setMode(null), []);

  return (
    <OpenAuthContext.Provider value={open}>
      {children}
      {mode && <AuthModal mode={mode} initialError={initialError} onClose={close} onSwitch={setMode} />}
    </OpenAuthContext.Provider>
  );
}

export function AuthTrigger({ mode, className, children }: { mode: AuthMode; className?: string; children: React.ReactNode }) {
  const open = useContext(OpenAuthContext);
  return (
    <button type="button" onClick={() => open(mode)} className={className}>
      {children}
    </button>
  );
}
