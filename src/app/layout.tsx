import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/navbar";
import { NavbarWrapper } from "@/components/navbar-wrapper";
import { MainWrapper } from "@/components/main-wrapper";
import { Footer } from "@/components/footer";
import { Toaster } from "sonner";
import { SessionGuard } from "@/components/session-guard";
import { AppDownloadBanner } from "@/components/app-download-banner";
import { MobileAppPrompter } from "@/components/mobile-app-prompter";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s - OpenJunk",
    default: "OpenJunk",
  },
  description: "OpenJunk - 全球领先的垃圾刊物公开平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NavbarWrapper>
            <Navbar />
          </NavbarWrapper>
          <SessionGuard />
          <MainWrapper>{children}</MainWrapper>
          <Footer />
          <Toaster />
          <AppDownloadBanner />
          <MobileAppPrompter />
        </ThemeProvider>
      </body>
    </html>
  );
}
