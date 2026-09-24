import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono", display: "swap" });

const title = "DocuMind — Your documents. Answered.";
const description = "AI-powered document assistant. Upload PDFs, DOCX, and TXT files, ask questions in plain English, and get answers cited to the exact page.";

export const metadata: Metadata = {
  title: { default: title, template: "%s · DocuMind" },
  description,
  // Served from /public rather than app/icon.svg: Vercel's build cache kept
  // serving a stale /icon.svg after the logo changed.
  icons: { icon: [{ url: "/documind-mark.svg", type: "image/svg+xml" }] },
  openGraph: { title, description, siteName: "DocuMind", type: "website" },
  twitter: { card: "summary", title, description },
};

export const viewport: Viewport = {
  themeColor: "#0F172A",
};

// Runs before first paint: if a signed-in user opens "/", hide the landing page
// until AuthModalProvider redirects them, instead of flashing the marketing page.
const authedFlashGuard = `try{var s=JSON.parse(localStorage.getItem("documind-store")||"null");if(s&&s.state&&s.state.user&&location.pathname==="/")document.documentElement.setAttribute("data-authed","")}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: authedFlashGuard }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
