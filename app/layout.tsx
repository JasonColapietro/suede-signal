import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { OG_IMAGE, SITE_URL } from "@/lib/site";

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
  title: "Suede Signal: AI-readiness audit for answer engines",
  description:
    "Free AI-readiness audit. See what ChatGPT, Claude, and Perplexity can read on your site, what's missing, and exactly what to fix.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Suede Signal: AI-readiness audit for answer engines",
    description:
      "Free AI-readiness audit. See what ChatGPT, Claude, and Perplexity can read on your site, what's missing, and exactly what to fix.",
    url: SITE_URL,
    siteName: "Suede Signal",
    type: "website",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Suede Signal: AI-readiness audit for answer engines",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Suede Signal: AI-readiness audit for answer engines",
    description:
      "Free AI-readiness audit. See what ChatGPT, Claude, and Perplexity can read on your site, what's missing, and exactly what to fix.",
    images: [OG_IMAGE],
  },
};

const orgSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://suedeai.ai/#organization",
      name: "Suede Labs AI",
      url: "https://suedeai.ai",
      foundingDate: "2024",
      sameAs: [
        "https://suedeai.org/",
        "https://github.com/Suede-AI",
        "https://x.com/AISUEDE",
        "https://www.crunchbase.com/organization/suede-labs-ai",
        "https://www.linkedin.com/company/suede-labs",
        "https://www.wikidata.org/wiki/Q141169484",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: "Suede Signal",
      url: SITE_URL,
      publisher: { "@id": "https://suedeai.ai/#organization" },
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#software`,
      name: "Suede Signal",
      url: SITE_URL,
      applicationCategory: "SEOApplication",
      operatingSystem: "Web",
      isPartOf: { "@id": `${SITE_URL}/#website` },
      publisher: { "@id": "https://suedeai.ai/#organization" },
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
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
