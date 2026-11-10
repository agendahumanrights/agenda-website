import type { MetadataRoute } from "next";

import { absoluteUrl, isNonProductionIndexing } from "@/lib/seo/site-url";

export default function robots(): MetadataRoute.Robots {
  const sitemap = absoluteUrl("/sitemap.xml");

  if (isNonProductionIndexing()) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
      sitemap,
      host: absoluteUrl("/"),
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/api/admin", "/api/admin/"],
      },
    ],
    sitemap,
    host: absoluteUrl("/"),
  };
}
