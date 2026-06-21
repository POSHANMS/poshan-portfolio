import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Cursor from "@/components/ui/Cursor";
import Loader from "@/components/ui/Loader";
import Navbar from "@/components/ui/Navbar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Poshan MS — Full Stack Engineer Portfolio",
  description: "Immersive cyberpunk portfolio of Poshan MS, Full Stack Engineer. Showcasing 3D WebGL experiences, responsive web engineering, and scalable backend solutions.",
  metadataBase: new URL("https://portfolio.poshanms.dev"),
  openGraph: {
    title: "Poshan MS — Full Stack Engineer Portfolio",
    description: "Immersive cyberpunk portfolio of Poshan MS, Full Stack Engineer. Showcasing 3D WebGL experiences, responsive web engineering, and scalable backend solutions.",
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
    <html lang="en" className="scroll-smooth">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans bg-[#050508] text-[#f0f0f0] antialiased min-h-screen selection:bg-[var(--electric-blue)]/30 selection:text-white`}
      >
        {/* Custom cursor overlay */}
        <Cursor />
        
        {/* Initial loading screen */}
        <Loader />
        
        {/* Main navigation header */}
        <Navbar />
        
        {/* Page Content */}
        {children}
      </body>
    </html>
  );
}
