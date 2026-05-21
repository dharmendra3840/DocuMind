"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/appStore";
import { Sidebar } from "@/components/layout/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, accessToken } = useAppStore();

  useEffect(() => {
    if (!user || !accessToken) {
      router.replace("/login");
    }
  }, [user, accessToken, router]);

  if (!user || !accessToken) return null;

  return (
    <div className="flex h-screen bg-bg-primary overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
