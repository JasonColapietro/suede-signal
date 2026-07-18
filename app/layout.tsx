import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Suede Signal — Become the Brand AI Recommends",
  description:
    "Free AI-visibility audit. See what ChatGPT, Claude, and Perplexity can read on your site, what they'll cite, and exactly what to fix.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Suede Signal — Become the Brand AI Recommends",
    description:
      "Free AI-visibility audit. See what ChatGPT, Claude, and Perplexity can read on your site, what they'll cite, and exactly what to fix.",
    url: SITE_URL,
    siteName: "Suede Signal",
    type: "website",
  },
};

const orgSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://suedeai.ai/#organization",
      name: "Suede Labs",
      url: "https://suedeai.ai",
      sameAs: ["https://agents.suedeai.ai", "https://github.com/JasonColapietro"],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: "Suede Signal",
      url: SITE_URL,
      publisher: { "@id": "https://suedeai.ai/#organization" },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
        {children}
      </body>
    </html>
  );
}
