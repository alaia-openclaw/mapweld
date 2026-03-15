import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import DevServiceWorkerCleanup from "@/components/DevServiceWorkerCleanup";

export const metadata = {
  metadataBase: new URL("https://www.mapweld.app"),
  title: {
    default: "MapWeld — Track welds on PDF drawings",
    template: "%s | MapWeld",
  },
  description:
    "Load PDF drawings, mark weld points, record welder and fitter details, and export to Excel. No installation, works offline.",
  openGraph: {
    title: "MapWeld — Track welds on PDF drawings",
    description:
      "Upload a drawing, mark welds, track status and notes, and export to Excel. Free, no install, works offline.",
    url: "https://www.mapweld.app",
    siteName: "MapWeld",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MapWeld — Track welds on PDF drawings",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MapWeld — Track welds on PDF drawings",
    description:
      "Upload a drawing, mark welds, track status and notes, and export to Excel.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  alternates: {
    canonical: "https://www.mapweld.app",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1e3a5f",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light">
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-screen bg-base-200 overscroll-none">
        {process.env.NODE_ENV === "development" && <DevServiceWorkerCleanup />}
        {children}
        <Analytics />
      </body>
    </html>
  );
}
