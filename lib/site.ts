export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://signal.suedeai.ai";

export const SITE_NAME = "Suede Signal";

// Stable social-card URL. Route Handler at app/og, not the opengraph-image
// file convention, whose emitted URL is hashed and moves between builds.
export const OG_IMAGE = `${SITE_URL}/og`;

export const AGENT_STUDIO_URL = "https://agents.suedeai.ai";
