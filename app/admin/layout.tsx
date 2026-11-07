import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import "@/styles/globals.css";
import "@/styles/admin-mobile.css";
import { Toaster } from "@/components/base/toast/toast";

// The admin is its own root layout: BoardUI's Tailwind v4 styles load only here and never reach the public site.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], axes: ["opsz"] });
export const metadata: Metadata = {
  title: "GoHyderabad Admin",
  robots: { index: false, follow: false },
  icons: {
    icon: [{ url: "/brand/admin-favicon-32.png", sizes: "32x32", type: "image/png" }],
    apple: "/brand/admin-apple-icon.png",
  },
};

const NO_FLASH = "try{if(localStorage.getItem('boardui:theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}";

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: NO_FLASH }} /></head>
      <body className="min-h-full bg-background-full text-text-primary">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
