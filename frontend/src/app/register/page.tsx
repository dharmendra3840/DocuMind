"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import { useAppStore } from "@/store/appStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAppStore((s) => s.setAuth);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setError("");
    setLoading(true);
    try {
      const data = await apiClient.register(email, password, name);
      localStorage.setItem("refresh_token", data.refresh_token);
      setAuth(data.user, data.access_token, data.refresh_token);
      router.push("/chat");
    } catch (err: unknown) {
      setError((err as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary bg-noise flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-bg-secondary border border-border rounded-lg shadow-elevated p-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center">
              <span className="text-white text-sm font-bold">D</span>
            </div>
            <span className="text-lg font-bold text-text-primary">DocuMind</span>
          </div>
          <p className="text-sm text-text-muted">Create your account to get started.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Name" id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoFocus />
          <Input label="Email" id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          <Input label="Password" id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 characters" required />
          {error && <p className="text-sm text-accent-red">{error}</p>}
          <Button type="submit" loading={loading} className="w-full mt-1">Create account</Button>
        </form>

        <p className="text-sm text-text-muted mt-4 text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
