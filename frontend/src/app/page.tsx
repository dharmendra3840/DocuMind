"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/appStore";
import { apiClient } from "@/lib/api";
import { FileText, ArrowRight, X, ArrowUpRight } from "lucide-react";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

// ─── Auth Modal ────────────────────────────────────────────────────────────────
function AuthModal({
  mode,
  onClose,
  onSwitch,
}: {
  mode: "login" | "register";
  onClose: () => void;
  onSwitch: (m: "login" | "register") => void;
}) {
  const router = useRouter();
  const setAuth = useAppStore((s) => s.setAuth);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setError(""); setName(""); setEmail(""); setPassword("");
  }, [mode]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "register" && password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setError(""); setLoading(true);
    try {
      const data = mode === "login"
        ? await apiClient.login(email, password)
        : await apiClient.register(email, password, name);
      localStorage.setItem("refresh_token", data.refresh_token);
      setAuth(data.user, data.access_token, data.refresh_token);
      router.push("/chat");
    } catch (err: unknown) {
      setError((err as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? (mode === "login" ? "Invalid credentials" : "Registration failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      onMouseDown={(e) => { if (e.target === overlayRef.current) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-sm bg-[#141927] border border-white/10 rounded-2xl shadow-2xl overflow-hidden modal-appear">
        {/* Tab strip */}
        <div className="flex border-b border-white/[0.06]">
          {(["login", "register"] as const).map((t) => (
            <button
              key={t}
              onClick={() => onSwitch(t)}
              className={`flex-1 py-3.5 text-xs font-semibold tracking-wider uppercase transition-colors relative ${
                mode === t ? "text-text-primary" : "text-text-muted hover:text-text-secondary"
              }`}
            >
              {t === "login" ? "Sign in" : "Create account"}
              {mode === t && (
                <span className="absolute bottom-0 inset-x-0 h-px bg-accent" />
              )}
            </button>
          ))}
          <button
            onClick={onClose}
            className="px-4 text-text-muted hover:text-text-primary transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-6">
            <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center shadow-lg shadow-accent/30">
              <span className="text-white text-xs font-black">D</span>
            </div>
            <span className="font-bold text-text-primary tracking-tight">DocuMind</span>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && (
              <Field label="Name">
                <input value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Your name" type="text" autoFocus
                  className="auth-input" />
              </Field>
            )}
            <Field label="Email">
              <input value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" type="email" required
                autoFocus={mode === "login"}
                className="auth-input" />
            </Field>
            <Field label="Password">
              <input value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "register" ? "Min. 8 characters" : "••••••••"}
                type="password" required className="auth-input" />
            </Field>
            {error && <p className="text-xs text-accent-red">{error}</p>}
            <button
              type="submit" disabled={loading}
              className="w-full mt-1 bg-accent hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-all shadow-lg shadow-accent/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>{mode === "login" ? "Sign in" : "Create account"} <ArrowRight className="w-3.5 h-3.5" /></>
              )}
            </button>
          </form>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/[0.08]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[#141927] px-3 text-[11px] text-text-muted uppercase tracking-wider">or</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => { window.location.href = `${API_URL}/api/v1/auth/google/authorize`; }}
            className="w-full flex items-center justify-center gap-2.5 border border-white/[0.1] hover:border-white/20 bg-white/[0.03] hover:bg-white/[0.06] text-text-secondary hover:text-text-primary py-2.5 rounded-lg text-sm font-medium transition-all"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <p className="text-xs text-text-muted text-center mt-3">
            {mode === "login" ? "No account? " : "Already have one? "}
            <button
              onClick={() => onSwitch(mode === "login" ? "register" : "login")}
              className="text-accent hover:underline"
            >
              {mode === "login" ? "Sign up free" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  );
}

// ─── Landing Page ──────────────────────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter();
  const { user, hydrated } = useAppStore();
  const [auth, setAuthState] = useState<"login" | "register" | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (hydrated && user) router.push("/chat");
  }, [hydrated, user, router]);

  const open = useCallback((m: "login" | "register") => setAuthState(m), []);
  const close = useCallback(() => setAuthState(null), []);

  if (!mounted || (hydrated && user)) return null;

  return (
    <div className="min-h-screen bg-bg-primary font-sans overflow-x-hidden selection:bg-accent/20">
      {auth && <AuthModal mode={auth} onClose={close} onSwitch={setAuthState} />}

      {/* ── Navbar ─────────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-40 border-b border-white/[0.06] bg-bg-primary/75 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center shadow-md shadow-accent/30">
              <span className="text-white text-xs font-black">D</span>
            </div>
            <span className="font-bold text-sm text-text-primary tracking-tight">DocuMind</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => open("login")}
              className="text-xs font-medium text-text-muted hover:text-text-primary px-4 py-2 rounded-lg transition-colors hover:bg-white/5">
              Log in
            </button>
            <button onClick={() => open("register")}
              className="text-xs font-semibold bg-accent/10 hover:bg-accent/20 text-accent border border-accent/25 px-4 py-2 rounded-lg transition-all">
              Get started
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────  */}
      <section className="relative min-h-screen flex flex-col justify-center items-center px-5 pt-14 pb-12 overflow-hidden">
        {/* Ambient blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="blob blob-1" />
          <div className="blob blob-2" />
          <div className="blob blob-3" />
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "64px 64px" }} />
        </div>

        <div className="relative max-w-4xl mx-auto w-full flex flex-col items-center text-center">
          {/* Eyebrow chip */}
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-[11px] font-mono text-text-muted tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
            AI · Document Intelligence
          </div>

          {/* Headline */}
          <h1 className="font-black leading-[0.88] tracking-tighter text-text-primary mb-6"
            style={{ fontSize: "clamp(3.2rem, 10vw, 6.5rem)" }}>
            Stop ctrl+F-ing
            <br />
            <em className="not-italic bg-gradient-to-br from-indigo-300 via-accent to-violet-500 bg-clip-text text-transparent">
              your documents.
            </em>
          </h1>

          <p className="text-base sm:text-lg text-text-muted max-w-lg leading-relaxed mb-10">
            Upload PDFs, Word docs, and text files. Ask questions in plain English.
            Get answers — with exact citations, every time.
          </p>

          <div className="flex flex-wrap gap-3 justify-center">
            <button onClick={() => open("register")}
              className="cta-primary group inline-flex items-center gap-2 bg-accent hover:bg-indigo-500 text-white font-bold px-7 py-3.5 rounded-xl text-sm transition-all shadow-xl shadow-accent/25 hover:shadow-accent/40 hover:-translate-y-px">
              Start for free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button onClick={() => open("login")}
              className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary border border-white/10 hover:border-white/20 bg-white/[0.04] hover:bg-white/[0.07] px-7 py-3.5 rounded-xl text-sm font-semibold transition-all hover:-translate-y-px">
              Sign in
            </button>
          </div>

          {/* ── App preview ── */}
          <div className="mt-16 w-full max-w-2xl mx-auto rounded-2xl overflow-hidden border border-white/10 shadow-[0_32px_80px_rgba(0,0,0,0.6)] bg-[#141927]">
            {/* Titlebar */}
            <div className="flex items-center gap-3 px-4 py-2.5 bg-bg-primary/60 border-b border-white/[0.06]">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
                <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
                <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
              </div>
              <div className="flex gap-1.5 ml-1">
                {["annual_report.pdf", "contract_v3.docx"].map((f) => (
                  <span key={f} className="flex items-center gap-1.5 bg-bg-surface/50 text-text-muted text-[11px] font-mono px-2.5 py-1 rounded-md border border-white/[0.06]">
                    <FileText className="w-3 h-3 text-accent/70" />{f}
                  </span>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div className="p-5 space-y-5 text-left">
              <div className="flex gap-3 items-start">
                <span className="w-6 h-6 rounded-full bg-bg-surface flex items-center justify-center shrink-0 text-[11px] text-text-muted font-bold">U</span>
                <p className="text-sm text-text-secondary leading-relaxed pt-0.5">
                  What are the revenue figures for Q3 in the annual report?
                </p>
              </div>

              <div className="flex gap-3 items-start">
                <span className="w-6 h-6 rounded-full bg-accent/15 border border-accent/20 flex items-center justify-center shrink-0 text-[11px] text-accent font-black">D</span>
                <div className="space-y-2">
                  <p className="text-sm text-text-primary leading-relaxed">
                    Q3 total revenue was <span className="text-accent font-semibold">$4.82 billion</span>, up 12% year-over-year, with EBITDA margin expanding to 31.4%.
                  </p>
                  <div className="flex items-center gap-1.5 w-fit bg-bg-primary/60 border border-white/[0.07] text-text-muted rounded-lg px-2.5 py-1.5 text-[11px] font-mono">
                    <FileText className="w-3 h-3 text-accent-amber shrink-0" />
                    annual_report.pdf · Q3 Results, p.14
                    <ArrowUpRight className="w-3 h-3 ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Input */}
              <div className="flex items-center gap-3 bg-bg-primary/50 rounded-xl border border-white/[0.07] px-4 py-3">
                <span className="text-sm text-text-muted font-mono flex-1 opacity-60">Ask anything about your documents…</span>
                <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center shrink-0 shadow-md shadow-accent/20">
                  <ArrowRight className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Ticker ────────────────────────────────────────────── */}
      <div className="border-y border-white/[0.05] py-3.5 overflow-hidden">
        <div className="ticker-track flex gap-12 text-[11px] font-mono text-text-muted tracking-[0.12em] uppercase whitespace-nowrap">
          {[1, 2].map((i) => (
            <span key={i} className="flex gap-12 shrink-0">
              {["PDF", "DOCX", "TXT", "Instant indexing", "Cited answers", "Streaming AI", "Private & secure", "Multi-workspace"].map((t, j) => (
                <span key={j} className="flex items-center gap-12">
                  <span className="hover:text-text-secondary transition-colors cursor-default">{t}</span>
                  <span className="text-white/10">·</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ── Features ──────────────────────────────────────────── */}
      <section className="py-28 px-5">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-mono tracking-[0.15em] uppercase text-accent/60 mb-10">What it does</p>
          <div className="divide-y divide-white/[0.05]">
            {[
              {
                n: "01", col: "text-accent",
                title: "Upload anything.",
                body: "PDFs, Word documents, plain text — up to 50 MB per file. Drag, drop, and it's indexed in seconds. No format wrangling required.",
              },
              {
                n: "02", col: "text-violet-400",
                title: "Ask in plain English.",
                body: "No boolean operators. No query syntax. Just type your question the way you'd ask a colleague who's already read everything.",
              },
              {
                n: "03", col: "text-accent-green",
                title: "Sources, always.",
                body: "Every answer links back to the exact passage — filename, section, page number. No hallucination goes unchecked.",
              },
              {
                n: "04", col: "text-accent-amber",
                title: "Conversations, not queries.",
                body: "Ask follow-ups. Dig deeper. The AI holds context within each conversation and refines answers as you probe.",
              },
            ].map((f) => (
              <div key={f.n} className="group -mx-5 px-5 py-10 flex gap-8 sm:gap-12 items-start hover:bg-white/[0.015] transition-colors cursor-default">
                <span className={`feature-num font-black font-mono leading-none shrink-0 w-10 ${f.col} opacity-20 group-hover:opacity-50 transition-opacity`}
                  style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)" }}>
                  {f.n}
                </span>
                <div>
                  <h3 className="font-bold text-text-primary mb-2 tracking-tight"
                    style={{ fontSize: "clamp(1.2rem, 3vw, 1.6rem)" }}>
                    {f.title}
                  </h3>
                  <p className="text-text-muted leading-relaxed max-w-lg text-[15px]">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────── */}
      <section className="py-20 px-5">
        <div className="max-w-2xl mx-auto">
          <div className="relative rounded-3xl border border-white/[0.08] overflow-hidden text-center px-10 py-16 bg-[#141927]">
            <div className="pointer-events-none absolute inset-0"
              style={{ background: "radial-gradient(ellipse at 50% -20%, rgba(99,102,241,0.18) 0%, transparent 70%)" }} />
            <div className="relative">
              <h2 className="font-black tracking-tighter text-text-primary mb-3"
                style={{ fontSize: "clamp(1.8rem, 5vw, 2.8rem)" }}>
                Your documents are waiting.
              </h2>
              <p className="text-text-muted mb-8 max-w-sm mx-auto text-[15px] leading-relaxed">
                Free to use. No credit card. Start chatting with your files in under a minute.
              </p>
              <button onClick={() => open("register")}
                className="inline-flex items-center gap-2 bg-accent hover:bg-indigo-500 text-white font-bold px-9 py-3.5 rounded-xl text-sm transition-all shadow-xl shadow-accent/30 hover:-translate-y-px group">
                Get started — it's free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.05] py-5 px-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center">
              <span className="text-white text-[9px] font-black">D</span>
            </div>
            <span className="text-xs font-semibold text-text-muted">DocuMind</span>
          </div>
          <p className="text-xs text-text-muted">© 2026 · Your documents. Answered.</p>
        </div>
      </footer>

      <style jsx>{`
        /* Ambient blobs */
        .blob {
          position: absolute;
          border-radius: 9999px;
          filter: blur(100px);
          pointer-events: none;
        }
        .blob-1 {
          width: 560px; height: 560px;
          background: radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%);
          top: 15%; left: 5%;
          animation: driftA 16s ease-in-out infinite;
        }
        .blob-2 {
          width: 480px; height: 480px;
          background: radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%);
          top: 30%; right: 0%;
          animation: driftB 20s ease-in-out infinite;
        }
        .blob-3 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%);
          bottom: 5%; left: 35%;
          animation: driftA 24s ease-in-out 4s infinite;
        }
        @keyframes driftA {
          0%,100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(40px,-30px) scale(1.08); }
        }
        @keyframes driftB {
          0%,100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(-50px, 20px) scale(1.05); }
        }

        /* Ticker */
        .ticker-track { animation: ticker 22s linear infinite; }
        @keyframes ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }

        /* Modal */
        @keyframes modal-appear {
          from { opacity:0; transform: scale(0.96) translateY(10px); }
          to   { opacity:1; transform: scale(1)    translateY(0); }
        }
        .modal-appear { animation: modal-appear 0.22s cubic-bezier(0.16,1,0.3,1) both; }

        /* Auth input */
        :global(.auth-input) {
          width: 100%;
          background: #0F172A;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 13px;
          color: #F1F5F9;
          outline: none;
          transition: border-color 0.15s;
        }
        :global(.auth-input::placeholder) { color: #475569; }
        :global(.auth-input:focus) { border-color: rgba(99,102,241,0.5); }
      `}</style>
    </div>
  );
}
