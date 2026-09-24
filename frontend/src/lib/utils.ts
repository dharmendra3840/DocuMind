import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// FastAPI returns `detail` as a string for HTTPExceptions but as a list of
// { msg, loc } objects for 422 validation errors — never render it raw.
export function getErrorMessage(err: unknown, fallback: string): string {
  const e = err as { request?: unknown; response?: { data?: { detail?: unknown } } } | null;
  const detail = e?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const msgs = detail
      .map((d) => (d && typeof d === "object" && "msg" in d ? String(d.msg).replace(/^Value error, /, "") : null))
      .filter(Boolean);
    if (msgs.length) return msgs.join(". ");
  }
  if (e?.request && !e.response) return "Can't reach the server. Check your connection and try again.";
  return fallback;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function groupByDate<T extends { created_at: string }>(items: T[]): Record<string, T[]> {
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now.setDate(now.getDate() - 1)).toDateString();

  return items.reduce((groups: Record<string, T[]>, item) => {
    const date = new Date(item.created_at).toDateString();
    let label: string;
    if (date === today) label = "Today";
    else if (date === yesterday) label = "Yesterday";
    else label = formatDate(item.created_at);
    if (!groups[label]) groups[label] = [];
    groups[label].push(item);
    return groups;
  }, {});
}
