"use client";
import { useEffect, useId, useRef, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { apiClient, BASE_URL } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import { GoogleIcon } from "@/components/ui/GoogleIcon";
import { Logo } from "@/components/ui/Logo";

export type AuthMode = "login" | "register";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function AuthModal({
  mode,
  initialError = "",
  onClose,
  onSwitch,
}: {
  mode: AuthMode;
  initialError?: string;
  onClose: () => void;
  onSwitch: (m: AuthMode) => void;
}) {
  const setAuth = useAppStore((s) => s.setAuth);
  const overlayRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const ids = useId();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(initialError);
  const [loading, setLoading] = useState(false);

  // Escape to close, keep Tab inside the dialog, lock page scroll, and hand
  // focus back to whatever opened the dialog when it closes.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [onClose]);

  const switchMode = (m: AuthMode) => {
    if (m === mode) return;
    setError(""); setName(""); setEmail(""); setPassword("");
    onSwitch(m);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "register" && password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setError(""); setLoading(true);
    try {
      const data = mode === "login"
        ? await apiClient.login(email, password)
        : await apiClient.register(email, password, name.trim() || undefined);
      localStorage.setItem("refresh_token", data.refresh_token);
      // AuthModalProvider redirects to /chat as soon as `user` is set, so the
      // spinner stays on until the navigation happens.
      setAuth(data.user, data.access_token, data.refresh_token);
    } catch (err: unknown) {
      setError(getErrorMessage(err, mode === "login" ? "Invalid email or password" : "Registration failed"));
      setLoading(false);
    }
  };

  const title = mode === "login" ? "Sign in" : "Create account";

  return (
    <div
      ref={overlayRef}
      onMouseDown={(e) => { if (e.target === overlayRef.current) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-sm max-h-[calc(100dvh-2rem)] overflow-y-auto bg-bg-elevated border border-white/10 rounded-2xl shadow-2xl modal-appear"
      >
        {/* Tab strip */}
        <div className="flex border-b border-white/[0.06]" role="tablist" aria-label="Account">
          {(["login", "register"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={mode === t}
              onClick={() => switchMode(t)}
              className={`flex-1 py-3.5 text-xs font-semibold tracking-wider uppercase transition-colors relative focus-visible:outline-none focus-visible:bg-white/[0.04] ${
                mode === t ? "text-text-primary" : "text-text-muted hover:text-text-secondary"
              }`}
            >
              {t === "login" ? "Sign in" : "Create account"}
              {mode === t && <span className="absolute bottom-0 inset-x-0 h-px bg-accent" />}
            </button>
          ))}
          <button
            type="button"
            onClick={onClose}
            className="px-4 text-text-muted hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:text-text-primary"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          <Logo className="mb-6" />

          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && (
              <Field id={`${ids}-name`} label="Name" hint="Optional">
                <input id={`${ids}-name`} value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Your name" type="text" autoComplete="name" autoFocus
                  className="auth-input" />
              </Field>
            )}
            <Field id={`${ids}-email`} label="Email">
              <input id={`${ids}-email`} value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" type="email" autoComplete="email" required
                autoFocus={mode === "login"}
                className="auth-input" />
            </Field>
            <Field id={`${ids}-password`} label="Password">
              <input id={`${ids}-password`} value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "register" ? "Min. 8 characters" : "••••••••"}
                type="password" required minLength={mode === "register" ? 8 : undefined}
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                className="auth-input" />
            </Field>
            {error && <p role="alert" className="text-xs text-accent-red leading-relaxed">{error}</p>}
            <button
              type="submit" disabled={loading}
              className="w-full !mt-5 bg-accent hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm transition-all shadow-lg shadow-accent/20 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-elevated"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-label="Loading" />
              ) : (
                <>{title} <ArrowRight className="w-3.5 h-3.5" /></>
              )}
            </button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/[0.08]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-bg-elevated px-3 text-[11px] text-text-muted uppercase tracking-wider">or</span>
            </div>
          </div>

          <a
            href={`${BASE_URL}/api/v1/auth/google/authorize`}
            className="w-full flex items-center justify-center gap-2.5 border border-white/[0.1] hover:border-white/20 bg-white/[0.03] hover:bg-white/[0.06] text-text-secondary hover:text-text-primary py-2.5 rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <GoogleIcon />
            Continue with Google
          </a>

          <p className="text-xs text-text-muted text-center mt-4">
            {mode === "login" ? "No account? " : "Already have one? "}
            <button
              type="button"
              onClick={() => switchMode(mode === "login" ? "register" : "login")}
              className="text-accent hover:underline focus-visible:underline focus-visible:outline-none"
            >
              {mode === "login" ? "Sign up free" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="flex items-baseline justify-between text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">
        {label}
        {hint && <span className="normal-case tracking-normal font-normal text-text-muted/70">{hint}</span>}
      </label>
      {children}
    </div>
  );
}
