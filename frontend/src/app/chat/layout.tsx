import type { Metadata } from "next";
import AppLayout from "@/components/layout/AppLayout";

export const metadata: Metadata = { title: "Chat" };

// Shared by /chat and /chat/[id], so the sidebar stays mounted between conversations.
export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}
