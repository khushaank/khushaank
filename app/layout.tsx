import type { Metadata } from "next";
import "./globals.css";
import { Navigation } from "@/components/navigation";

export const metadata: Metadata = { title: "Khushaank", description: "Notes, photographs, code, and essays by Khushaank." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><body suppressHydrationWarning><Navigation /><main className="min-h-screen w-full bg-white pb-16 md:mx-auto md:max-w-[660px] md:border-x md:border-zinc-200 md:pb-8">{children}</main></body></html>;
}
