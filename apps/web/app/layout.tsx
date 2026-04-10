import type { Metadata } from "next";
import { Space_Grotesk, Onest } from "next/font/google";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/lib/auth-context";
import { AppBar } from "@/components/app-bar";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
});

const onest = Onest({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Loreum",
  description: "Structured worldbuilding for AI-assisted writing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={cn(
          "min-h-screen font-sans antialiased",
          onest.variable,
          spaceGrotesk.variable,
        )}
      >
        <AuthProvider>
          <AppBar />
          <main className="min-h-screen">{children}</main>
          <SiteFooter />
        </AuthProvider>
      </body>
    </html>
  );
}
