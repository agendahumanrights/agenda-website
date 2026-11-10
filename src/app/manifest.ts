import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Human Rights Agenda",
    short_name: "Agenda",
    description:
      "Human Rights Agenda defends, documents, and promotes human rights in Yemen through publications, events, and advocacy.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#05498c",
    icons: [
      {
        src: "/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
