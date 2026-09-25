"use client";
import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/appStore";
import { Sidebar } from "@/components/layout/Sidebar";

// false while hydrating the server HTML, true on every render after that — so
// client-side navigations render immediately instead of blanking for a frame.
const subscribe = () => () => {};
const useIsClient = () => useSyncExternalStore(subscribe, () => true, () => false);

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isClient = useIsClient();
  const user = useAppStore((s) => s.user);
  const accessToken = useAppStore((s) => s.accessToken);
  const hydrated = useAppStore((s) => s.hydrated);
  const signedIn = !!user && !!accessToken;

  useEffect(() => {
    if (isClient && hydrated && !signedIn) router.replace("/");
  }, [isClient, hydrated, signedIn, router]);

  if (!isClient || !hydrated || !signedIn) return <div className="h-[100dvh] bg-paper" />;

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-paper">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  );
}
