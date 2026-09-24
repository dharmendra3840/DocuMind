import { ArrowUp, FileText } from "lucide-react";

const DOC = "MSA_Northwind_2024.pdf";

function Cite({ n }: { n: number }) {
  return <sup className="ml-0.5 font-plex-mono text-[10px] font-medium text-redline">{n}</sup>;
}

function MarginNote({ n }: { n: number }) {
  return (
    <span className="absolute -left-4 sm:-left-5 top-[3px] font-plex-mono text-[10px] font-medium text-redline" aria-hidden="true">
      {n}
    </span>
  );
}

/** Static mock of the product: the source page on the left, the cited answer on the right. */
export function ProductPreview() {
  return (
    <figure
      role="img"
      aria-label={`Example: asked about the notice period in ${DOC}, DocuMind answers "60 days' prior written notice" and cites page 14, where the clause is highlighted.`}
      className="overflow-hidden rounded-xl border border-rule bg-white shadow-[0_1px_0_rgba(22,24,29,0.04),0_40px_80px_-40px_rgba(22,24,29,0.35)]"
    >
      {/* App bar */}
      <div className="flex h-11 items-center justify-between gap-4 border-b border-rule bg-paper/70 px-4">
        <div className="flex min-w-0 items-center gap-2 text-[12px] text-ink-muted">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] bg-ink font-serif text-[12px] font-semibold text-paper">D</span>
          <span className="font-medium text-ink">Legal</span>
          <span>/</span>
          <span className="truncate">Vendor contracts</span>
        </div>
        <span className="hidden shrink-0 font-plex-mono text-[11px] text-ink-muted sm:inline">3 documents · indexed</span>
      </div>

      <div className="grid md:grid-cols-[1.08fr_1fr]">
        {/* Source page */}
        <div className="border-b border-rule bg-paper-deep/60 p-4 sm:p-6 md:border-b-0 md:border-r">
          <div className="mb-3 flex items-center justify-between gap-3 font-plex-mono text-[11px] text-ink-muted">
            <span className="flex min-w-0 items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
              <span className="truncate">{DOC}</span>
            </span>
            <span className="shrink-0">p. 14 / 38</span>
          </div>
          <div className="relative max-h-[250px] overflow-hidden rounded-md border border-rule bg-white px-6 py-5 font-serif text-[13px] leading-[1.7] text-ink-soft shadow-sm sm:px-8 sm:py-6 sm:text-[14px] md:max-h-none">
            <p className="mb-3 font-plex text-[10.5px] font-medium uppercase tracking-[0.16em] text-ink">11. Term and Termination</p>
            <p className="mb-3">
              <b className="font-semibold text-ink">11.1 Term.</b> This Agreement commences on the Effective Date and continues for an initial term of thirty-six (36) months unless terminated earlier under this Section 11.
            </p>
            <p className="relative mb-3">
              <MarginNote n={1} />
              <b className="font-semibold text-ink">11.2 Termination for Convenience.</b>{" "}
              <mark className="rounded-[2px] bg-marker px-0.5 text-inherit [box-decoration-break:clone] [-webkit-box-decoration-break:clone]">
                Either party may terminate this Agreement for convenience upon sixty (60) days&apos; prior written notice to the other party.
              </mark>
            </p>
            <p className="relative mb-3">
              <MarginNote n={2} />
              <b className="font-semibold text-ink">11.3 Termination for Cause.</b>{" "}
              <mark className="rounded-[2px] bg-marker/45 px-0.5 text-inherit [box-decoration-break:clone] [-webkit-box-decoration-break:clone]">
                Either party may terminate immediately on written notice if the other party materially breaches this Agreement and fails to cure the breach within thirty (30) days
              </mark>{" "}
              of receiving notice.
            </p>
            <p>
              <b className="font-semibold text-ink">11.4 Effect of Termination.</b> Upon termination, Customer shall pay all undisputed fees accrued through the termination date, and each party shall return or destroy the other party&apos;s Confidential Information.
            </p>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-white to-transparent" />
          </div>
        </div>

        {/* Conversation */}
        <div className="flex flex-col gap-4 p-4 sm:p-6">
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="text-ink-muted">Scope</span>
            <span className="inline-flex min-w-0 items-center gap-1 rounded-full border border-rule bg-paper px-2 py-0.5 font-plex-mono text-ink-soft">
              <FileText className="h-3 w-3 shrink-0" strokeWidth={1.75} />
              <span className="truncate">{DOC}</span>
            </span>
          </div>

          <p className="max-w-[88%] self-end rounded-lg rounded-br-sm bg-paper-deep px-3.5 py-2.5 text-[13px] leading-relaxed text-ink">
            How much notice do we need to give to exit the Northwind contract?
          </p>

          <p className="text-[13.5px] leading-relaxed text-ink-soft">
            You can exit for convenience with <strong className="font-semibold text-ink">60 days&apos; prior written notice</strong>
            <Cite n={1} />. If Northwind materially breaches the agreement, you can terminate immediately — but only after giving them
            30 days to cure the breach
            <Cite n={2} />.
          </p>

          <ol className="space-y-1.5 border-t border-rule pt-3">
            {[1, 2].map((n) => (
              <li key={n} className="flex items-center gap-2 font-plex-mono text-[11.5px] text-ink-muted">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] bg-redline/10 text-[10px] font-medium text-redline">{n}</span>
                <span className="truncate">{DOC}</span>
                <span className="ml-auto shrink-0">p. 14</span>
              </li>
            ))}
          </ol>

          <div className="mt-auto flex items-center gap-2 rounded-lg border border-rule bg-white px-3 py-2">
            <span className="flex-1 truncate text-[13px] text-ink-muted/80">Ask a follow-up…</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-ink">
              <ArrowUp className="h-3.5 w-3.5 text-paper" />
            </span>
          </div>
        </div>
      </div>
    </figure>
  );
}
