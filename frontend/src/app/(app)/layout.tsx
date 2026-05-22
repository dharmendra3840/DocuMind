"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/appStore";
import { Sidebar } from "@/components/layout/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, accessToken, hydrated } = useAppStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!hydrated) return;
    
    if (!user || !accessToken) {
      router.replace("/login");
    } else {
      setIsChecking(false);
    }
  }, [hydrated, user, accessToken, router]);

  if (!hydrated || isChecking || !user || !accessToken) return null;

  return (
    <div className="flex h-screen bg-bg-primary overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
