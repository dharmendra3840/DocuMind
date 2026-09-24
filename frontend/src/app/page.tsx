import { FileText, ArrowRight, ArrowUpRight, Upload, Layers, MessageSquareText } from "lucide-react";
import { AuthModalProvider, AuthTrigger } from "@/components/landing/AuthModalProvider";
import { Logo } from "@/components/ui/Logo";

const TICKER_ITEMS = ["PDF", "DOCX", "TXT", "Page-level citations", "Streaming answers", "Semantic search", "Multi-workspace", "Follow-up questions"];

const STEPS = [
  {
    icon: Upload,
    title: "Upload",
    body: "Drop PDFs, Word docs, or text files into a workspace — up to 50 MB each.",
  },
  {
    icon: Layers,
    title: "Index",
    body: "Text is extracted with page numbers intact, split into overlapping chunks, and embedded into a vector index.",
  },
  {
    icon: MessageSquareText,
    title: "Ask",
    body: "The most relevant passages are retrieved for each question, and the answer streams back citing file and page.",
  },
];

const FEATURES = [
  {
    n: "01", col: "text-accent",
    title: "Upload anything.",
    body: "PDFs, Word documents, plain text — up to 50 MB per file. Drag, drop, and indexing runs in the background. No format wrangling required.",
  },
  {
    n: "02", col: "text-violet-400",
    title: "Ask in plain English.",
    body: "No boolean operators. No query syntax. Just type your question the way you'd ask a colleague who's already read everything.",
  },
  {
    n: "03", col: "text-accent-green",
    title: "Sources, always.",
    body: "Every answer cites the file and page it came from. Open the exact passage the model used and check it yourself.",
  },
  {
    n: "04", col: "text-accent-amber",
    title: "Conversations, not queries.",
    body: "Ask follow-ups. Dig deeper. The AI holds context within each conversation and refines answers as you probe.",
  },
];

const NAV_LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "Features" },
];

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary";

export default function LandingPage() {
  return (
    <AuthModalProvider>
      <div className="landing-root min-h-screen bg-bg-primary overflow-x-hidden selection:bg-accent/20">
        {/* ── Navbar ─────────────────────────────────────────── */}
        <header className="fixed top-0 inset-x-0 z-40 border-b border-white/[0.06] bg-bg-primary/75 backdrop-blur-xl">
          <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between gap-4">
            <a href="#top" className={`rounded-md ${focusRing}`} aria-label="DocuMind home">
              <Logo />
            </a>
            <nav className="hidden sm:flex items-center gap-1" aria-label="Page sections">
              {NAV_LINKS.map((l) => (
                <a key={l.href} href={l.href}
                  className={`text-xs font-medium text-text-muted hover:text-text-primary px-3 py-2 rounded-lg transition-colors ${focusRing}`}>
                  {l.label}
                </a>
              ))}
            </nav>
            <div className="flex items-center gap-2">
              <AuthTrigger mode="login"
                className={`text-xs font-medium text-text-muted hover:text-text-primary px-3 sm:px-4 py-2 rounded-lg transition-colors hover:bg-white/5 ${focusRing}`}>
                Log in
              </AuthTrigger>
              <AuthTrigger mode="register"
                className={`text-xs font-semibold bg-accent/10 hover:bg-accent/20 text-accent border border-accent/25 px-3 sm:px-4 py-2 rounded-lg transition-all ${focusRing}`}>
                Get started
              </AuthTrigger>
            </div>
          </div>
        </header>

        <main id="top">
          {/* ── Hero ──────────────────────────────────────────── */}
          <section className="relative min-h-[100svh] flex flex-col justify-center items-center px-5 pt-28 pb-16 sm:pt-32 overflow-hidden">
            <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
              <div className="blob blob-1" />
              <div className="blob blob-2" />
              <div className="blob blob-3" />
              <div className="absolute inset-0 opacity-[0.03]"
                style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "64px 64px" }} />
            </div>

            <div className="relative max-w-4xl mx-auto w-full flex flex-col items-center text-center">
              <p className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-[11px] font-mono text-text-muted tracking-widest uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" aria-hidden="true" />
                AI · Document Intelligence
              </p>

              {/* Each line is kept whole (nowrap) and the size scales with the
                  viewport, so "ctrl+F-ing" never breaks at the hyphen. */}
              <h1 className="font-black leading-[0.95] tracking-tighter text-text-primary mb-6"
                style={{ fontSize: "clamp(2rem, 11vw, 6.5rem)" }}>
                <span className="block whitespace-nowrap">Stop ctrl+F-ing</span>
                <span className="block whitespace-nowrap pb-[0.08em] bg-gradient-to-br from-indigo-300 via-accent to-violet-500 bg-clip-text text-transparent">
                  your documents.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-text-muted max-w-lg leading-relaxed mb-10 text-balance">
                Upload PDFs, Word docs, and text files. Ask questions in plain English.
                Get answers — with exact citations, every time.
              </p>

              <div className="flex flex-wrap gap-3 justify-center">
                <AuthTrigger mode="register"
                  className={`group inline-flex items-center gap-2 bg-accent hover:bg-indigo-500 text-white font-bold px-7 py-3.5 rounded-xl text-sm transition-all shadow-xl shadow-accent/25 hover:shadow-accent/40 hover:-translate-y-px ${focusRing}`}>
                  Start for free
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </AuthTrigger>
                <a href="#how-it-works"
                  className={`inline-flex items-center gap-2 text-text-secondary hover:text-text-primary border border-white/10 hover:border-white/20 bg-white/[0.04] hover:bg-white/[0.07] px-7 py-3.5 rounded-xl text-sm font-semibold transition-all hover:-translate-y-px ${focusRing}`}>
                  See how it works
                </a>
              </div>

              {/* ── App preview ── */}
              <div role="img" aria-label="Example: DocuMind answers a question about an annual report and cites page 14"
                className="mt-16 w-full max-w-2xl mx-auto rounded-2xl overflow-hidden border border-white/10 shadow-[0_32px_80px_rgba(0,0,0,0.6)] bg-bg-elevated">
                <div className="flex items-center gap-3 px-4 py-2.5 bg-bg-primary/60 border-b border-white/[0.06]">
                  <div className="flex gap-1.5 shrink-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
                    <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
                    <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
                  </div>
                  <div className="flex gap-1.5 ml-1 min-w-0">
                    {["annual_report.pdf", "contract_v3.docx"].map((f, i) => (
                      <span key={f} className={`${i > 0 ? "hidden sm:flex" : "flex"} items-center gap-1.5 min-w-0 bg-bg-surface/50 text-text-muted text-[11px] font-mono px-2.5 py-1 rounded-md border border-white/[0.06]`}>
                        <FileText className="w-3 h-3 shrink-0 text-accent/70" />
                        <span className="truncate">{f}</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 sm:p-5 space-y-5 text-left">
                  <div className="flex gap-3 items-start">
                    <span className="w-6 h-6 rounded-full bg-bg-surface flex items-center justify-center shrink-0 text-[11px] text-text-muted font-bold">U</span>
                    <p className="text-sm text-text-secondary leading-relaxed pt-0.5">
                      What are the revenue figures for Q3 in the annual report?
                    </p>
                  </div>

                  <div className="flex gap-3 items-start">
                    <span className="w-6 h-6 rounded-full bg-accent/15 border border-accent/20 flex items-center justify-center shrink-0 text-[11px] text-accent font-black">D</span>
                    <div className="space-y-2 min-w-0">
                      <p className="text-sm text-text-primary leading-relaxed">
                        Q3 total revenue was <span className="text-accent font-semibold">$4.82 billion</span>, up 12% year-over-year, with EBITDA margin expanding to 31.4%.
                      </p>
                      <div className="flex items-center gap-1.5 w-fit max-w-full bg-bg-primary/60 border border-white/[0.07] text-text-muted rounded-lg px-2.5 py-1.5 text-[11px] font-mono">
                        <FileText className="w-3 h-3 text-accent-amber shrink-0" />
                        <span className="truncate">annual_report.pdf · p.14</span>
                        <ArrowUpRight className="w-3 h-3 ml-0.5 shrink-0" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-bg-primary/50 rounded-xl border border-white/[0.07] px-4 py-3">
                    <span className="text-sm text-text-muted font-mono flex-1 min-w-0 truncate opacity-60">Ask anything about your documents…</span>
                    <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center shrink-0 shadow-md shadow-accent/20">
                      <ArrowRight className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Ticker (decorative) ───────────────────────────── */}
          <div className="border-y border-white/[0.05] py-3.5 overflow-hidden" aria-hidden="true">
            <div className="ticker-track flex w-max text-[11px] font-mono text-text-muted tracking-[0.12em] uppercase whitespace-nowrap">
              {[0, 1].map((half) => (
                <div key={half} className="flex shrink-0 items-center gap-12 pr-12">
                  {TICKER_ITEMS.map((t) => (
                    <span key={t} className="flex items-center gap-12">
                      <span>{t}</span>
                      <span className="text-white/15">·</span>
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* ── How it works ──────────────────────────────────── */}
          <section id="how-it-works" className="scroll-mt-20 py-20 sm:py-28 px-5">
            <div className="max-w-4xl mx-auto">
              <p className="text-[11px] font-mono tracking-[0.15em] uppercase text-accent/80 mb-4">How it works</p>
              <h2 className="font-extrabold tracking-tight text-text-primary mb-10 sm:mb-12 text-balance"
                style={{ fontSize: "clamp(1.75rem, 4.5vw, 2.5rem)" }}>
                From file to cited answer in three steps.
              </h2>
              <ol className="grid gap-4 sm:grid-cols-3">
                {STEPS.map(({ icon: Icon, title, body }, i) => (
                  <li key={title} className="relative rounded-2xl border border-white/[0.07] bg-bg-elevated p-6">
                    <div className="flex items-center justify-between mb-5">
                      <span className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-accent" aria-hidden="true" />
                      </span>
                      <span className="text-[11px] font-mono text-text-muted tracking-widest uppercase">Step {i + 1}</span>
                    </div>
                    <h3 className="font-bold text-text-primary text-lg tracking-tight mb-2">{title}</h3>
                    <p className="text-sm text-text-muted leading-relaxed">{body}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* ── Features ──────────────────────────────────────── */}
          <section id="features" className="scroll-mt-20 pb-20 sm:pb-28 px-5">
            <div className="max-w-4xl mx-auto">
              <p className="text-[11px] font-mono tracking-[0.15em] uppercase text-accent/80 mb-6 sm:mb-8">What it does</p>
              <div className="divide-y divide-white/[0.05] border-y border-white/[0.05]">
                {FEATURES.map((f) => (
                  <div key={f.n} className="group -mx-5 px-5 py-8 sm:py-10 flex gap-6 sm:gap-12 items-start hover:bg-white/[0.015] transition-colors">
                    <span className={`font-black font-mono leading-none shrink-0 w-10 sm:w-14 ${f.col} opacity-50 group-hover:opacity-90 transition-opacity`}
                      style={{ fontSize: "clamp(1.6rem, 4vw, 2.8rem)" }} aria-hidden="true">
                      {f.n}
                    </span>
                    <div>
                      <h3 className="font-bold text-text-primary mb-2 tracking-tight"
                        style={{ fontSize: "clamp(1.15rem, 3vw, 1.6rem)" }}>
                        {f.title}
                      </h3>
                      <p className="text-text-muted leading-relaxed max-w-lg text-[15px]">{f.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Final CTA ─────────────────────────────────────── */}
          <section className="pb-20 sm:pb-28 px-5">
            <div className="max-w-2xl mx-auto">
              <div className="relative rounded-3xl border border-white/[0.08] overflow-hidden text-center px-6 py-12 sm:px-10 sm:py-16 bg-bg-elevated">
                <div className="pointer-events-none absolute inset-0" aria-hidden="true"
                  style={{ background: "radial-gradient(ellipse at 50% -20%, rgba(99,102,241,0.18) 0%, transparent 70%)" }} />
                <div className="relative">
                  <h2 className="font-extrabold tracking-tight text-text-primary mb-3 text-balance"
                    style={{ fontSize: "clamp(1.8rem, 5vw, 2.8rem)" }}>
                    Your documents are waiting.
                  </h2>
                  <p className="text-text-muted mb-8 max-w-sm mx-auto text-[15px] leading-relaxed text-balance">
                    Free to use. No credit card. Start chatting with your files in under a minute.
                  </p>
                  <AuthTrigger mode="register"
                    className={`group inline-flex items-center gap-2 bg-accent hover:bg-indigo-500 text-white font-bold px-9 py-3.5 rounded-xl text-sm transition-all shadow-xl shadow-accent/30 hover:-translate-y-px ${focusRing}`}>
                    Get started — it&apos;s free
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </AuthTrigger>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* ── Footer ────────────────────────────────────────── */}
        <footer className="border-t border-white/[0.05] py-6 px-5">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <Logo size="sm" />
            <nav className="flex items-center gap-5" aria-label="Footer">
              {NAV_LINKS.map((l) => (
                <a key={l.href} href={l.href} className={`text-xs text-text-muted hover:text-text-primary transition-colors rounded ${focusRing}`}>
                  {l.label}
                </a>
              ))}
            </nav>
            <p className="text-xs text-text-muted">© {new Date().getFullYear()} · Your documents. Answered.</p>
          </div>
        </footer>
      </div>
    </AuthModalProvider>
  );
}
