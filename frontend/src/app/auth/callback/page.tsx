"use client";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppStore } from "@/store/appStore";
import { apiClient } from "@/lib/api";

function Callback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAppStore((s) => s.setAuth);

  useEffect(() => {
    const token = searchParams.get("token");
    const refresh = searchParams.get("refresh");
    const userB64 = searchParams.get("user");
    const authError = searchParams.get("auth_error");

    if (authError) {
      router.replace("/");
      return;
    }

    if (token && refresh && userB64) {
      try {
        // Restore stripped base64 padding
        const padded = userB64 + "==".slice(0, (4 - (userB64.length % 4)) % 4);
        const user = JSON.parse(atob(padded.replace(/-/g, "+").replace(/_/g, "/")));
        localStorage.setItem("refresh_token", refresh);
        apiClient.setAccessToken(token);
        setAuth(user, token, refresh);
        router.replace("/chat");
      } catch {
        router.replace("/");
      }
    } else {
      router.replace("/");
    }
  }, [searchParams, router, setAuth]);

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center gap-4">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-text-muted">Signing you in…</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <Callback />
    </Suspense>
  );
}
