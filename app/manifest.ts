import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lifestyle Organiser",
    // Short label for constrained spaces (home-screen icon, app switcher). Matches
    // the `apple-mobile-web-app-title` meta tag in app/layout.tsx. "Lifestyle
    // Organiser" is too long for a single line under an iOS home-screen icon —
    // it wraps to two lines ("Lifestyle" / "Organiser"), which at small sizes
    // reads like one concatenated word with no space at all.
    short_name: "Organiser",
    description: "Shared reminders, calendar, and recipes for two.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#FAFAFA",
    theme_color: "#4A6C8C",
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
    ],
  };
}
