import type { Metadata } from "next";

import { ComingSoonScene } from "@/components/site/coming-soon-scene";

export const metadata: Metadata = {
  title: "Coming Soon | CREATIQ",
  description:
    "Creatiq Digital Solutions is preparing a sharper digital experience.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ComingSoonPage() {
  return <ComingSoonScene />;
}
