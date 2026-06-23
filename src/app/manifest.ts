import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Creatiq Digital Solutions",
    short_name: "Creatiq",
    description:
      "Websites, custom systems, mobile apps, branding, graphics design, and digital marketing solutions.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#020b1f",
    theme_color: "#08bdff",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
