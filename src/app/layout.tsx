import type { Metadata } from "next";
import "./globals.css";
import Cursor from "@/components/ui/Cursor";
import Navbar from "@/components/ui/Navbar";

export const metadata: Metadata = {
  title: "Poshan MS - Full Stack Engineer Portfolio",
  description:
    "Immersive cyberpunk portfolio of Poshan MS, Full Stack Engineer. Showcasing 3D WebGL experiences, responsive web engineering, and scalable backend solutions.",
  metadataBase: new URL("https://portfolio.poshanms.dev"),
  openGraph: {
    title: "Poshan MS - Full Stack Engineer Portfolio",
    description:
      "Immersive cyberpunk portfolio of Poshan MS, Full Stack Engineer. Showcasing 3D WebGL experiences, responsive web engineering, and scalable backend solutions.",
    type: "website",
    locale: "en_US",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body className="font-sans bg-[#050508] text-[#f0f0f0] antialiased min-h-screen selection:bg-[var(--electric-blue)]/30 selection:text-white" suppressHydrationWarning>
        <Cursor />
        <Navbar />
        {children}
      </body>
    </html>
  );
}