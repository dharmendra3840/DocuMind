import {
  ArrowRight, Check, Minus, X, Plus, FileText, Github,
  Bookmark, Crosshair, FolderTree, MessagesSquare, Gauge, ScanSearch,
  Scale, FlaskConical, GraduationCap, Headset,
} from "lucide-react";
import { AuthModalProvider, AuthTrigger } from "@/components/landing/AuthModalProvider";
import { ProductPreview } from "@/components/landing/ProductPreview";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "#why", label: "Why DocuMind" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#use-cases", label: "Use cases" },
  { href: "#faq", label: "FAQ" },
];

const DOC_TYPES = ["Contracts", "Research papers", "Policies", "Board packs", "Product manuals", "Lecture notes"];

type Verdict = { state: "yes" | "no" | "partial"; note: string };
const COMPARED = ["Ctrl+F", "General AI chat", "DocuMind"] as const;
const COMPARISON: { label: string; cells: [Verdict, Verdict, Verdict] }[] = [
  {
    label: "Finds answers phrased differently from your question",
    cells: [{ state: "no", note: "Exact words only" }, { state: "yes", note: "Understands meaning" }, { state: "yes", note: "Semantic search" }],
  },
  {
    label: "Answers only from your documents",
    cells: [{ state: "partial", note: "Finds text, doesn't answer" }, { state: "no", note: "May use outside knowledge" }, { state: "yes", note: "Grounded in retrieved passages" }],
  },
  {
    label: "Shows exactly where the answer came from",
    cells: [{ state: "yes", note: "Highlights matches" }, { state: "no", note: "Rarely cites pages" }, { state: "yes", note: "File and page on every answer" }],
  },
  {
    label: "Works across many long documents at once",
    cells: [{ state: "no", note: "One file at a time" }, { state: "partial", note: "Limited by context window" }, { state: "yes", note: "Retrieves only relevant passages" }],
  },
  {
    label: "Your documents are still there next time",
    cells: [{ state: "yes", note: "Files stay on disk" }, { state: "no", note: "Re-upload each session" }, { state: "yes", note: "Saved to your workspace" }],
  },
];

const STEPS = [
  {
    title: "Upload",
    body: "Add PDFs, Word documents, or text files to a workspace — up to 50 MB each. Indexing runs in the background.",
    visual: <UploadVisual />,
  },
  {
    title: "Index",
    body: "Text is extracted with page numbers intact, split into overlapping passages, and embedded into a searchable index.",
    visual: <IndexVisual />,
  },
  {
    title: "Ask",
    body: "Each question pulls the most relevant passages. The answer streams back with every claim cited to file and page.",
    visual: <AskVisual />,
  },
];

const USE_CASES = [
  {
    icon: Scale,
    title: "Legal & compliance",
    question: "Which of our vendor contracts auto-renew, and what’s the notice window?",
    docs: "Contracts · NDAs · policies · regulatory filings",
  },
  {
    icon: FlaskConical,
    title: "Research",
    question: "How do these five papers measure calibration, and where do they disagree?",
    docs: "Papers · preprints · lab notes",
  },
  {
    icon: GraduationCap,
    title: "Students",
    question: "Summarise the argument in chapter 3 and list the evidence it relies on.",
    docs: "Lecture slides · textbooks · reading packs",
  },
  {
    icon: Headset,
    title: "Support & operations",
    question: "What’s the reset procedure for error E42 on the 2023 model?",
    docs: "Manuals · release notes · runbooks",
  },
];

const FEATURES = [
  { icon: Bookmark, title: "Page-level citations", body: "Every answer lists its sources by filename and page. Open one to read the exact passage the answer used." },
  { icon: Crosshair, title: "Scope to specific files", body: "Point a question at one contract or a handful of papers instead of the whole workspace." },
  { icon: FolderTree, title: "Separate workspaces", body: "Keep Legal, Research, and Product documents apart. Each workspace has its own index." },
  { icon: MessagesSquare, title: "Follow-up questions", body: "Conversations keep context, so you can dig deeper without repeating yourself." },
  { icon: Gauge, title: "Streaming answers", body: "Answers appear as they are written — no staring at a spinner for the full response." },
  { icon: ScanSearch, title: "Inspect the index", body: "See how each document was split into passages, page by page, so nothing is a black box." },
];

const FAQS = [
  {
    q: "What file types can I upload?",
    a: "PDF, Word (.docx), and plain-text files, up to 50 MB each. Scanned PDFs need a text layer — DocuMind reads text, not images.",
  },
  {
    q: "Can it make things up?",
    a: "DocuMind retrieves the most relevant passages from your documents and instructs the model to answer only from them, citing file and page. If the answer isn’t in your documents, it says so — and every citation can be opened, so you can always check.",
  },
  {
    q: "Where are my documents stored?",
    a: "In your workspace: the original file in storage and its passages in a vector index. Only the passages relevant to a question are sent to the language model to write the answer.",
  },
  {
    q: "Can I ask about just one document?",
    a: "Yes. Use the scope bar above a conversation to limit questions to specific files, or leave it empty to search the whole workspace.",
  },
  {
    q: "How much does it cost?",
    a: "DocuMind is free to use. No credit card required.",
  },
];

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper";
const primaryButton = `inline-flex items-center gap-2 rounded-lg bg-ink text-paper font-medium transition-colors hover:bg-ink-soft ${focusRing}`;

export default function LandingPage() {
  return (
    <div className={`landing-root relative min-h-screen overflow-x-hidden bg-paper font-plex text-ink antialiased selection:bg-marker`}>
      <AuthModalProvider>
        {/* ── Navbar ─────────────────────────────────────────── */}
        <header className="fixed inset-x-0 top-0 z-40 border-b border-rule/80 bg-paper/85 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-5">
            <a href="#top" className={`rounded-md ${focusRing}`} aria-label="DocuMind home">
              <Logo />
            </a>
            <nav className="hidden items-center gap-1 md:flex" aria-label="Page sections">
              {NAV_LINKS.map((l) => (
                <a key={l.href} href={l.href} className={`rounded-md px-3 py-2 text-[13.5px] text-ink-muted transition-colors hover:text-ink ${focusRing}`}>
                  {l.label}
                </a>
              ))}
            </nav>
            <div className="flex items-center gap-1 sm:gap-2">
              <AuthTrigger mode="login" className={`rounded-md px-3 py-2 text-[13.5px] font-medium text-ink-soft transition-colors hover:text-ink ${focusRing}`}>
                Sign in
              </AuthTrigger>
              <AuthTrigger mode="register" className={`${primaryButton} px-4 py-2 text-[13.5px]`}>
                Get started
              </AuthTrigger>
            </div>
          </div>
        </header>

        <main id="top">
          {/* ── Hero ──────────────────────────────────────────── */}
          <section className="px-5 pb-16 pt-32 sm:pb-24 sm:pt-40">
            <div className="mx-auto max-w-6xl">
              <div className="grid items-end gap-8 lg:grid-cols-12 lg:gap-12">
                <h1 className="font-serif font-normal leading-[1.02] tracking-[-0.025em] text-ink text-balance lg:col-span-7"
                  style={{ fontSize: "clamp(2.6rem, 6.4vw, 5.25rem)" }}>
                  Answers from your documents, <em className="marker-underline">cited to the page.</em>
                </h1>
                <div className="lg:col-span-5 lg:pb-3">
                  <p className="text-[17px] leading-relaxed text-ink-soft sm:text-lg">
                    Upload contracts, research papers, and manuals. Ask questions in plain English. DocuMind finds the relevant
                    passages and writes an answer where every claim links back to its source.
                  </p>
                  <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
                    <AuthTrigger mode="register" className={`${primaryButton} group px-5 py-3 text-[15px]`}>
                      Start for free
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </AuthTrigger>
                    <a href="#how-it-works" className={`rounded text-[15px] font-medium text-ink underline decoration-rule decoration-2 underline-offset-[6px] transition-colors hover:decoration-ink ${focusRing}`}>
                      See how it works
                    </a>
                  </div>
                  <p className="mt-6 text-[13px] text-ink-muted">PDF, DOCX and TXT · up to 50 MB per file · no credit card</p>
                </div>
              </div>

              <div className="mt-14 sm:mt-20">
                <ProductPreview />
              </div>
            </div>
          </section>

          {/* ── Document types ────────────────────────────────── */}
          <section className="border-y border-rule bg-paper-deep/60 px-5 py-8" aria-label="Supported document types">
            <div className="mx-auto flex max-w-6xl flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-8">
              <p className="shrink-0 text-[13px] text-ink-muted">Built for the documents you already work with</p>
              <ul className="flex flex-wrap gap-x-7 gap-y-1 font-serif text-lg italic text-ink-soft sm:text-xl">
                {DOC_TYPES.map((t) => <li key={t}>{t}</li>)}
              </ul>
            </div>
          </section>

          {/* ── Why ───────────────────────────────────────────── */}
          <section id="why" className="scroll-mt-16 px-5 py-20 sm:py-28">
            <div className="mx-auto max-w-6xl">
              <SectionHeading
                mark="01"
                title="Ctrl+F finds words. DocuMind finds answers."
                intro="Keyword search misses anything phrased differently. General AI chat forgets your files and rarely shows its sources. DocuMind is built around the documents themselves."
              />
              {/* Phones: one card per capability, DocuMind last and highlighted. */}
              <ul className="space-y-3 md:hidden">
                {COMPARISON.map((row) => (
                  <li key={row.label} className="rounded-xl border border-rule bg-paper p-4">
                    <p className="text-[15px] font-medium leading-snug text-ink">{row.label}</p>
                    <dl className="mt-3 space-y-2">
                      {COMPARED.map((name, j) => (
                        <div key={name} className={`grid grid-cols-[7.5rem_1fr] items-start gap-3 ${j === 2 ? "-mx-2 rounded-lg bg-white px-2 py-1.5 ring-1 ring-rule" : ""}`}>
                          <dt className={`text-[12.5px] ${j === 2 ? "font-semibold text-ink" : "text-ink-muted"}`}>{name}</dt>
                          <dd><VerdictCell {...row.cells[j]} /></dd>
                        </div>
                      ))}
                    </dl>
                  </li>
                ))}
              </ul>

              <div className="relative -mx-5 hidden overflow-x-auto px-5 md:block">
                <table className="w-full min-w-[680px] border-separate border-spacing-0 text-left">
                  <caption className="sr-only">How DocuMind compares with keyword search and general AI chat</caption>
                  <thead>
                    <tr className="text-[13px] font-medium text-ink-muted">
                      <th scope="col" className="w-[34%] pb-4 font-normal"><span className="sr-only">Capability</span></th>
                      <th scope="col" className="w-[22%] px-4 pb-4 font-medium">Ctrl+F</th>
                      <th scope="col" className="w-[22%] px-4 pb-4 font-medium">General AI chat</th>
                      <th scope="col" className="w-[22%] rounded-t-xl border-x border-t border-rule bg-white px-4 pb-4 pt-4 font-semibold text-ink">
                        <Logo size="sm" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON.map((row, i) => {
                      const last = i === COMPARISON.length - 1;
                      return (
                        <tr key={row.label}>
                          <th scope="row" className="border-t border-rule py-4 pr-6 align-top text-[15px] font-normal leading-snug text-ink">
                            {row.label}
                          </th>
                          {row.cells.map((c, j) => (
                            <td key={j} className={`border-t border-rule px-4 py-4 align-top ${j === 2 ? `border-x bg-white ${last ? "rounded-b-xl border-b" : ""}` : ""}`}>
                              <VerdictCell {...c} />
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* ── How it works ──────────────────────────────────── */}
          <section id="how-it-works" className="scroll-mt-16 border-t border-rule bg-paper-deep/40 px-5 py-20 sm:py-28">
            <div className="mx-auto max-w-6xl">
              <SectionHeading mark="02" title="From upload to cited answer in three steps." />
              <ol className="grid gap-12 md:grid-cols-3 md:gap-8">
                {STEPS.map((s, i) => (
                  <li key={s.title} className="border-t border-ink pt-6">
                    <div className="mb-3 flex items-baseline gap-3">
                      <span className="font-plex-mono text-[12px] text-redline">0{i + 1}</span>
                      <h3 className="font-serif text-[26px] leading-none text-ink">{s.title}</h3>
                    </div>
                    <p className="mb-6 text-[15px] leading-relaxed text-ink-muted">{s.body}</p>
                    <div aria-hidden="true">{s.visual}</div>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* ── Use cases ─────────────────────────────────────── */}
          <section id="use-cases" className="scroll-mt-16 border-t border-rule px-5 py-20 sm:py-28">
            <div className="mx-auto max-w-6xl">
              <SectionHeading
                mark="03"
                title="Made for work where the source matters."
                intro="Anywhere an answer is only as good as the page it came from."
              />
              <div className="grid gap-4 md:grid-cols-2">
                {USE_CASES.map(({ icon: Icon, title, question, docs }) => (
                  <article key={title} className="flex flex-col rounded-xl border border-rule bg-white p-6 sm:p-8">
                    <div className="flex items-center gap-2.5 text-ink">
                      <Icon className="h-[18px] w-[18px]" strokeWidth={1.5} aria-hidden="true" />
                      <h3 className="text-[15px] font-semibold">{title}</h3>
                    </div>
                    <blockquote className="mt-6 font-serif text-[22px] leading-snug text-ink sm:text-2xl">“{question}”</blockquote>
                    <p className="mt-auto pt-6 text-[13px] text-ink-muted">{docs}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* ── Features ──────────────────────────────────────── */}
          <section id="features" className="scroll-mt-16 border-t border-rule px-5 py-20 sm:py-28">
            <div className="mx-auto max-w-6xl">
              <SectionHeading mark="04" title="The details that make answers trustworthy." />
              <div className="grid gap-px overflow-hidden rounded-xl border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-3">
                {FEATURES.map(({ icon: Icon, title, body }) => (
                  <div key={title} className="bg-paper p-6 sm:p-8">
                    <Icon className="h-5 w-5 text-ink" strokeWidth={1.5} aria-hidden="true" />
                    <h3 className="mt-5 text-[15px] font-semibold text-ink">{title}</h3>
                    <p className="mt-2 text-[14.5px] leading-relaxed text-ink-muted">{body}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── FAQ ───────────────────────────────────────────── */}
          <section id="faq" className="scroll-mt-16 border-t border-rule px-5 py-20 sm:py-28">
            <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <SectionHeading mark="05" title="Questions, answered." className="mb-0 sm:mb-0" />
              </div>
              <div className="border-t border-rule lg:col-span-8">
                {FAQS.map((f) => (
                  <details key={f.q} className="group border-b border-rule">
                    <summary className={`flex cursor-pointer list-none items-center justify-between gap-6 rounded py-5 text-[16px] font-medium text-ink [&::-webkit-details-marker]:hidden ${focusRing}`}>
                      {f.q}
                      <Plus className="h-4 w-4 shrink-0 text-ink-muted transition-transform group-open:rotate-45" aria-hidden="true" />
                    </summary>
                    <p className="max-w-2xl pb-6 text-[15px] leading-relaxed text-ink-muted">{f.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>

          {/* ── Final CTA ─────────────────────────────────────── */}
          <section className="px-5 pb-20 sm:pb-28">
            <div className="mx-auto grid max-w-6xl gap-8 rounded-2xl bg-ink px-6 py-14 sm:px-14 sm:py-20 lg:grid-cols-12 lg:items-end">
              <h2 className="font-serif font-normal leading-[1.05] tracking-[-0.02em] text-paper text-balance lg:col-span-8"
                style={{ fontSize: "clamp(2.2rem, 5vw, 3.75rem)" }}>
                Your documents are waiting. <em className="text-paper/55">Ask them something.</em>
              </h2>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 lg:col-span-4 lg:justify-end">
                <AuthTrigger mode="register"
                  className="group inline-flex items-center gap-2 rounded-lg bg-paper px-5 py-3 text-[15px] font-medium text-ink transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper focus-visible:ring-offset-2 focus-visible:ring-offset-ink">
                  Create a free account
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </AuthTrigger>
                <AuthTrigger mode="login"
                  className="rounded text-[15px] font-medium text-paper/75 transition-colors hover:text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper focus-visible:ring-offset-2 focus-visible:ring-offset-ink">
                  Sign in
                </AuthTrigger>
              </div>
            </div>
          </section>
        </main>

        {/* ── Footer ────────────────────────────────────────── */}
        <footer className="border-t border-rule px-5 py-10">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Logo size="sm" />
              <p className="mt-2 text-[13px] text-ink-muted">Your documents. Answered.</p>
            </div>
            <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Footer">
              {NAV_LINKS.map((l) => (
                <a key={l.href} href={l.href} className={`rounded text-[13px] text-ink-muted transition-colors hover:text-ink ${focusRing}`}>{l.label}</a>
              ))}
              <a href="https://github.com/dharmendra3840/DocuMind" target="_blank" rel="noopener noreferrer"
                className={`inline-flex items-center gap-1.5 rounded text-[13px] text-ink-muted transition-colors hover:text-ink ${focusRing}`}>
                <Github className="h-3.5 w-3.5" aria-hidden="true" /> GitHub
              </a>
            </nav>
            <p className="text-[13px] text-ink-muted">© {new Date().getFullYear()} DocuMind</p>
          </div>
        </footer>
      </AuthModalProvider>
    </div>
  );
}

function SectionHeading({ mark, title, intro, className = "" }: { mark: string; title: string; intro?: string; className?: string }) {
  return (
    <div className={cn("mb-12 max-w-2xl sm:mb-16", className)}>
      <p className="mb-4 font-plex-mono text-[12px] text-redline">§ {mark}</p>
      <h2 className="font-serif font-normal leading-[1.08] tracking-[-0.02em] text-ink text-balance" style={{ fontSize: "clamp(2rem, 4.2vw, 3rem)" }}>
        {title}
      </h2>
      {intro && <p className="mt-4 text-[17px] leading-relaxed text-ink-muted">{intro}</p>}
    </div>
  );
}

function VerdictCell({ state, note }: Verdict) {
  const icon = {
    yes: <Check className="h-4 w-4 text-emerald-700" strokeWidth={2.25} />,
    no: <X className="h-4 w-4 text-ink-muted/60" strokeWidth={2} />,
    partial: <Minus className="h-4 w-4 text-amber-600" strokeWidth={2.25} />,
  }[state];
  const label = { yes: "Yes", no: "No", partial: "Partly" }[state];
  return (
    <span className="flex items-start gap-2 text-[13.5px] leading-snug text-ink-soft">
      <span className="mt-px shrink-0" aria-hidden="true">{icon}</span>
      <span><span className="sr-only">{label}: </span>{note}</span>
    </span>
  );
}

// ── Step illustrations ────────────────────────────────────────────────────────

function UploadVisual() {
  return (
    <div className="rounded-lg border border-rule bg-white p-4 text-[12.5px]">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 shrink-0 text-ink-muted" strokeWidth={1.5} />
        <span className="truncate font-medium text-ink">Q3_board_pack.pdf</span>
        <span className="ml-auto shrink-0 font-plex-mono text-[11px] text-ink-muted">12.4 MB</span>
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-paper-deep">
        <div className="h-full w-full bg-ink" />
      </div>
      <div className="mt-2.5 flex items-center gap-1.5 text-[11.5px] text-emerald-700">
        <Check className="h-3.5 w-3.5" strokeWidth={2.25} /> Ready · 64 pages
      </div>
    </div>
  );
}

function IndexVisual() {
  const rows = [
    { page: "p. 6", w: "w-full" },
    { page: "p. 7", w: "w-10/12", hit: true },
    { page: "p. 7", w: "w-11/12" },
    { page: "p. 8", w: "w-9/12" },
  ];
  return (
    <div className="space-y-2 rounded-lg border border-rule bg-white p-4">
      {rows.map((r, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="w-8 shrink-0 font-plex-mono text-[10.5px] text-ink-muted">{r.page}</span>
          <span className={`h-2.5 rounded-sm ${r.w} ${r.hit ? "bg-marker" : "bg-ink/[0.08]"}`} />
        </div>
      ))}
      <p className="pt-1 font-plex-mono text-[10.5px] text-ink-muted">412 passages indexed</p>
    </div>
  );
}

function AskVisual() {
  return (
    <div className="rounded-lg border border-rule bg-white p-4 text-[12.5px] leading-relaxed text-ink-soft">
      <p>
        Net revenue grew <strong className="font-semibold text-ink">18% year over year</strong>
        <sup className="ml-0.5 font-plex-mono text-[9.5px] font-medium text-redline">1</sup>, led by the enterprise segment.
      </p>
      <span className="mt-3 inline-flex items-center gap-1.5 rounded border border-rule px-1.5 py-0.5 font-plex-mono text-[10.5px] text-ink-muted">
        <span className="text-redline">1</span> Q3_board_pack.pdf · p. 7
      </span>
    </div>
  );
}
