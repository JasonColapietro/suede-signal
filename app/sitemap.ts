import type { MetadataRoute } from "next";
import { articles } from "@/lib/articles";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/docs",
    "/docs/scoring",
    "/docs/fixes",
    "/docs/mention-watch",
    "/docs/api",
    "/docs/faq",
    "/articles",
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date("2026-07-18"),
  }));

  const articleRoutes = articles.map((a) => ({
    url: `${SITE_URL}/articles/${a.slug}`,
    lastModified: new Date(a.date),
  }));

  return [...staticRoutes, ...articleRoutes];
}
