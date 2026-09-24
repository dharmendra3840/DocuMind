import { redirect } from "next/navigation";

// Sign-up lives in the landing page modal; keep the old URL working.
export default function RegisterPage() {
  redirect("/?auth=register");
}
