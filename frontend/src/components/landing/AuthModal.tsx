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

  const title = mode === "login" ? "Welcome back" : "Create your account";
  const submitLabel = mode === "login" ? "Sign in" : "Create account";

  return (
    <div
      ref={overlayRef}
      onMouseDown={(e) => { if (e.target === overlayRef.current) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-[3px]"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${ids}-title`}
        className="modal-appear relative max-h-[calc(100dvh-2rem)] w-full max-w-[400px] overflow-y-auto rounded-2xl border border-rule bg-white shadow-[0_30px_80px_-20px_rgba(22,24,29,0.35)]"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-md p-2 text-ink-muted transition-colors hover:bg-paper hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-7 sm:p-8">
          <Logo />
          <h2 id={`${ids}-title`} className="mt-6 font-serif text-[28px] leading-tight tracking-[-0.01em] text-ink">{title}</h2>
          <p className="mt-1.5 text-[14px] text-ink-muted">
            {mode === "login" ? "Sign in to pick up where you left off." : "Free to use. Start asking your documents in a minute."}
          </p>

          <a
            href={`${BASE_URL}/api/v1/auth/google/authorize`}
            className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-lg border border-rule bg-white py-2.5 text-[14px] font-medium text-ink transition-colors hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
          >
            <GoogleIcon />
            Continue with Google
          </a>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-rule" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-[12px] text-ink-muted">or with email</span>
            </div>
          </div>

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
                placeholder={mode === "register" ? "At least 8 characters" : "Your password"}
                type="password" required minLength={mode === "register" ? 8 : undefined}
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                className="auth-input" />
            </Field>
            {error && (
              <p role="alert" className="rounded-md border border-redline/20 bg-redline/[0.06] px-3 py-2 text-[13px] leading-relaxed text-redline">
                {error}
              </p>
            )}
            <button
              type="submit" disabled={loading}
              className="!mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-ink py-2.5 text-[14px] font-medium text-paper transition-colors hover:bg-ink-soft disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-paper/30 border-t-paper" aria-label="Loading" />
              ) : (
                <>{submitLabel} <ArrowRight className="h-3.5 w-3.5" /></>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-[13px] text-ink-muted">
            {mode === "login" ? "New to DocuMind? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => switchMode(mode === "login" ? "register" : "login")}
              className="font-medium text-ink underline decoration-rule decoration-2 underline-offset-4 hover:decoration-ink focus-visible:decoration-ink focus-visible:outline-none"
            >
              {mode === "login" ? "Create an account" : "Sign in"}
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
      <label htmlFor={id} className="mb-1.5 flex items-baseline justify-between text-[13px] font-medium text-ink">
        {label}
        {hint && <span className="text-[12px] font-normal text-ink-muted">{hint}</span>}
      </label>
      {children}
    </div>
  );
}
