import type { Metadata } from "next";
import "./globals.css";
import "./features.css";
import "./history.css";

export const metadata: Metadata = {
  title: "GitBean  Coffee | recipes, versioned",
  description: "Discover, fork, and dial in specialty coffee recipes together.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en"><body>{children}</body></html>
  );
}
