"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/appStore";
import { FileText, Zap, Shield, Search, ChevronRight, Upload, MessageSquare, CheckCircle } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const { user, hydrated } = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (hydrated && user) {
      router.push("/chat");
    }
  }, [hydrated, user, router]);

  if (!mounted || (hydrated && user)) return null;

  return (
    <div className="min-h-screen bg-bg-primary font-sans overflow-x-hidden">

      {/* ── Navbar ── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-bg-primary/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shadow-lg shadow-accent/30">
              <span className="text-white text-sm font-bold">D</span>
            </div>
            <span className="text-lg font-bold text-text-primary tracking-tight">DocuMind</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-text-muted hover:text-text-primary transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-text-muted hover:text-text-primary transition-colors">How it works</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-text-secondary hover:text-text-primary transition-colors px-4 py-2">
              Log in
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium bg-accent hover:bg-accent/90 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-accent/20"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-40 pb-32 px-6 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-accent/8 blur-[120px]" />
          <div className="absolute top-20 right-1/4 w-[300px] h-[300px] rounded-full bg-indigo-500/5 blur-[80px]" />
        </div>

        <div className="relative max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: copy */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent/30 bg-accent/10 text-accent text-xs font-medium mb-6">
              <Zap className="w-3 h-3" />
              AI-Powered Document Intelligence
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold text-text-primary leading-[1.1] tracking-tight mb-6">
              Chat With Your{" "}
              <span className="relative">
                <span className="bg-gradient-to-r from-accent via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Documents
                </span>
              </span>
              .{" "}
              <br className="hidden lg:block" />
              Get Answers{" "}
              <span className="bg-gradient-to-r from-accent-amber to-accent-green bg-clip-text text-transparent">
                Instantly
              </span>
              .
            </h1>

            <p className="text-lg text-text-muted leading-relaxed mb-10 max-w-lg">
              Upload PDFs, DOCX, and TXT files. Ask questions in plain English.
              DocuMind reads, understands, and answers — with source citations every time.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-white font-semibold px-6 py-3 rounded-lg transition-all shadow-xl shadow-accent/25 hover:shadow-accent/40 hover:-translate-y-0.5"
              >
                Start for free
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 border border-border hover:border-accent/40 text-text-secondary hover:text-text-primary font-semibold px-6 py-3 rounded-lg transition-all hover:-translate-y-0.5"
              >
                Sign in
              </Link>
            </div>

            <p className="text-xs text-text-muted mt-5">No credit card required · Free to use</p>
          </div>

          {/* Right: floating document cards visual */}
          <div className="relative h-[420px] hidden lg:block">
            {/* Central glow */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 rounded-full bg-accent/15 blur-[60px]" />
            </div>

            {/* Main document card */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 bg-bg-secondary border border-white/10 rounded-2xl p-5 shadow-2xl z-20 animate-float">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-accent/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-text-primary">research_paper.pdf</p>
                  <p className="text-xs text-text-muted">42 pages</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-2 bg-bg-surface rounded-full w-full" />
                <div className="h-2 bg-bg-surface rounded-full w-4/5" />
                <div className="h-2 bg-bg-surface rounded-full w-3/5" />
              </div>
              <div className="mt-4 pt-4 border-t border-white/5">
                <span className="text-xs text-accent-green font-medium flex items-center gap-1.5">
                  <CheckCircle className="w-3 h-3" /> Ready to query
                </span>
              </div>
            </div>

            {/* Chat bubble — top right */}
            <div className="absolute top-10 right-8 w-48 bg-bg-secondary border border-white/10 rounded-2xl p-4 shadow-xl z-10 animate-float-delayed">
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                  <MessageSquare className="w-3 h-3 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-text-primary font-medium">What are the key findings?</p>
                  <p className="text-xs text-text-muted mt-1 leading-relaxed">The study found that...</p>
                </div>
              </div>
            </div>

            {/* Upload card — bottom left */}
            <div className="absolute bottom-12 left-4 w-44 bg-bg-secondary border border-white/10 rounded-2xl p-4 shadow-xl z-10 animate-float-slow">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-accent-amber/20 flex items-center justify-center">
                  <Upload className="w-4 h-4 text-accent-amber" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-text-primary">Upload complete</p>
                  <p className="text-xs text-text-muted">contract.docx</p>
                </div>
              </div>
              <div className="mt-3 h-1.5 bg-bg-surface rounded-full overflow-hidden">
                <div className="h-full w-full bg-accent-green rounded-full" />
              </div>
            </div>

            {/* Search card — top left */}
            <div className="absolute top-16 left-2 w-40 bg-bg-secondary border border-white/10 rounded-xl p-3 shadow-xl animate-float-delayed-2">
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-accent-amber shrink-0" />
                <p className="text-xs text-text-muted">Searching 3 sources…</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-text-primary mb-3">Everything you need</h2>
            <p className="text-text-muted max-w-md mx-auto">A complete toolkit for extracting value from your document library.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Upload className="w-5 h-5 text-accent" />,
                bg: "bg-accent/10",
                title: "Multi-format Upload",
                desc: "PDF, DOCX, and TXT files processed automatically. Drag, drop, done.",
              },
              {
                icon: <MessageSquare className="w-5 h-5 text-accent-green" />,
                bg: "bg-accent-green/10",
                title: "Conversational AI",
                desc: "Ask follow-up questions naturally. The AI remembers context within each conversation.",
              },
              {
                icon: <Search className="w-5 h-5 text-accent-amber" />,
                bg: "bg-accent-amber/10",
                title: "Source Citations",
                desc: "Every answer links to the exact passage it came from. No hallucinations go unchecked.",
              },
              {
                icon: <Zap className="w-5 h-5 text-purple-400" />,
                bg: "bg-purple-400/10",
                title: "Instant Answers",
                desc: "Streaming responses so you see results as they're generated — no waiting.",
              },
              {
                icon: <Shield className="w-5 h-5 text-accent-red" />,
                bg: "bg-accent-red/10",
                title: "Private & Secure",
                desc: "Your documents are scoped to your account. Nobody else can access your data.",
              },
              {
                icon: <FileText className="w-5 h-5 text-accent" />,
                bg: "bg-accent/10",
                title: "Workspace Organisation",
                desc: "Group documents into workspaces for different projects or clients.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="bg-bg-secondary border border-white/5 rounded-2xl p-6 hover:border-accent/20 transition-colors group"
              >
                <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center mb-4`}>
                  {f.icon}
                </div>
                <h3 className="font-semibold text-text-primary mb-2">{f.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-24 px-6 relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-accent/5 blur-[100px]" />
        </div>

        <div className="relative max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-text-primary mb-3">Up and running in minutes</h2>
            <p className="text-text-muted">Three steps is all it takes.</p>
          </div>

          <div className="relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-10 left-[calc(16.67%+20px)] right-[calc(16.67%+20px)] h-px bg-gradient-to-r from-accent/30 via-accent/60 to-accent/30" />

            <div className="grid md:grid-cols-3 gap-8 relative">
              {[
                {
                  step: "01",
                  title: "Create a workspace",
                  desc: "Sign up free and create a workspace to organise your documents.",
                  color: "text-accent",
                  border: "border-accent/30",
                  bg: "bg-accent/10",
                },
                {
                  step: "02",
                  title: "Upload your documents",
                  desc: "Drag and drop PDFs, Word docs, or text files. We handle the rest.",
                  color: "text-accent-amber",
                  border: "border-accent-amber/30",
                  bg: "bg-accent-amber/10",
                },
                {
                  step: "03",
                  title: "Ask anything",
                  desc: "Start a conversation. Get cited, accurate answers in seconds.",
                  color: "text-accent-green",
                  border: "border-accent-green/30",
                  bg: "bg-accent-green/10",
                },
              ].map((s) => (
                <div key={s.step} className="flex flex-col items-center text-center">
                  <div className={`w-12 h-12 rounded-full ${s.bg} border ${s.border} flex items-center justify-center mb-5 relative z-10`}>
                    <span className={`text-sm font-bold ${s.color}`}>{s.step}</span>
                  </div>
                  <h3 className="font-semibold text-text-primary mb-2">{s.title}</h3>
                  <p className="text-sm text-text-muted leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-bg-secondary border border-white/5 rounded-3xl px-10 py-14 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-accent/10 rounded-full blur-[80px]" />
            </div>
            <div className="relative">
              <h2 className="text-3xl font-bold text-text-primary mb-3">
                Ready to unlock your documents?
              </h2>
              <p className="text-text-muted mb-8">
                Join DocuMind and turn static files into interactive knowledge — for free.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-white font-semibold px-8 py-3 rounded-lg transition-all shadow-xl shadow-accent/25 hover:shadow-accent/40 hover:-translate-y-0.5"
                >
                  Get started free
                  <ChevronRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 border border-border hover:border-accent/40 text-text-secondary hover:text-text-primary font-semibold px-8 py-3 rounded-lg transition-all hover:-translate-y-0.5"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center">
              <span className="text-white text-xs font-bold">D</span>
            </div>
            <span className="text-sm font-semibold text-text-primary">DocuMind</span>
          </div>
          <p className="text-xs text-text-muted">© 2026 DocuMind. Your documents. Answered.</p>
        </div>
      </footer>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translate(-50%, -50%) translateY(0px); }
          50% { transform: translate(-50%, -50%) translateY(-12px); }
        }
        @keyframes float-plain {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes float-plain-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-7px); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-plain 4s ease-in-out 1s infinite;
        }
        .animate-float-delayed-2 {
          animation: float-plain 5s ease-in-out 0.5s infinite;
        }
        .animate-float-slow {
          animation: float-plain-slow 6s ease-in-out 2s infinite;
        }
      `}</style>
    </div>
  );
}
