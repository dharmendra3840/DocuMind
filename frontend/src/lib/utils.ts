import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
