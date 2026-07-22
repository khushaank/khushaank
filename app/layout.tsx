import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://khushaankgupta.qzz.io"),
  alternates: { canonical: "/" },
  title: "Khushaank Gupta — AI, Business & Finance",
  description: "Turning businesses AI-first. I handle the how.",
  openGraph: {
    title: "Khushaank Gupta — AI, Business & Finance",
    description: "Turning businesses AI-first. I handle the how.",
    type: "website",
    url: "https://khushaankgupta.qzz.io",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Khushaank Gupta — AI, Business & Finance" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Khushaank Gupta — AI, Business & Finance",
    description: "Turning businesses AI-first. I handle the how.",
    images: ["/og.png"],
  },
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
