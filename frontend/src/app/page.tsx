"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/appStore";

export default function RootPage() {
  const router = useRouter();
  const { user, hydrated } = useAppStore();

  useEffect(() => {
    if (!hydrated) return;
    
    if (user) {
      router.push("/chat");
    } else {
      router.push("/login");
    }
  }, [hydrated, user, router]);

  return null;
}
