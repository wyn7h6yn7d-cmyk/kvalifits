import type { MetadataRoute } from "next";

import { SITE_NAME } from "@/lib/seo/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: SITE_NAME,
    start_url: "/",
    display: "standalone",
    background_color: "#0f0f16",
    theme_color: "#0f0f16",
    icons: [
      { src: "/favicon-48.png", sizes: "48x48", type: "image/png" },
      { src: "/favicon-96.png", sizes: "96x96", type: "image/png" },
      { src: "/favicon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/favicon-v4.png", sizes: "128x128", type: "image/png" },
      { src: "/favicon-v4.ico", sizes: "any", type: "image/x-icon" },
      { src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
