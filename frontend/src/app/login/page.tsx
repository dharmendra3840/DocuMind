import { redirect } from "next/navigation";

// Sign-in lives in the landing page modal; keep the old URL working.
export default function LoginPage() {
  redirect("/?auth=login");
}
