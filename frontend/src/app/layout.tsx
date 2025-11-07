import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { QueryProvider } from "@/providers/query-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { ToastProvider } from "@/hooks/use-toast";
import { SocketProvider } from "@/hooks/use-socket";
import { WebVitals } from "@/components/analytics/web-vitals";

// Optimize font loading with next/font
const inter = Inter({
  subsets: ["latin"],
  display: "swap", // Prevent layout shift while font loads
  preload: true,
  variable: "--font-inter",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  title: {
    default: "Multimedia Portal - Articles, Blog, Wiki, Gallery & Stories",
    template: "%s | Multimedia Portal"
  },
  description: "Your destination for articles, blogs, wiki knowledge, galleries, and creative stories. Explore diverse content created by talented authors.",
  keywords: ["blog", "articles", "wiki", "gallery", "stories", "multimedia", "content"],
  authors: [{ name: "Multimedia Portal" }],
  creator: "Multimedia Portal",
  publisher: "Multimedia Portal",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "Multimedia Portal",
    description: "Your destination for articles, blogs, wiki knowledge, galleries, and creative stories.",
    siteName: "Multimedia Portal",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased font-sans`}>
        <WebVitals />
        <ErrorBoundary>
          <QueryProvider>
            <AuthProvider>
              <SocketProvider>
                <ToastProvider>
                  <div className="flex min-h-screen flex-col">
                    <Header />
                    <main className="flex-1">{children}</main>
                    <Footer />
                  </div>
                </ToastProvider>
              </SocketProvider>
            </AuthProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
