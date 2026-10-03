import type { Metadata } from "next";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://signal.suedeai.ai";

export const SITE_NAME = "Suede Signal";

// Stable social-card URL. Route Handler at app/og, not the opengraph-image
// file convention, whose emitted URL is hashed and moves between builds.
export const OG_IMAGE = `${SITE_URL}/og`;

export const AGENT_STUDIO_URL = "https://agents.suedeai.ai";

// Nested metadata is replaced, not deep-merged, by a child route. Keep the
// shared image when supplying a page's own social title, description and URL.
export function pageSocialMetadata(
  path: string,
  title: string,
  description: string,
): Pick<Metadata, "openGraph" | "twitter"> {
  return {
    openGraph: {
      title,
      description,
      url: new URL(path, SITE_URL).href,
      siteName: SITE_NAME,
      type: "website",
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE],
    },
  };
}
