import "./globals.css";
import DevServiceWorkerCleanup from "@/components/DevServiceWorkerCleanup";

export const metadata = {
  title: {
    default: "Weld Dashboard — Track welds on PDF drawings",
    template: "%s | Weld Dashboard",
  },
  description:
    "Load PDF drawings, mark weld points, record welder and fitter details, and export to Excel. No installation, works offline.",
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
      </body>
    </html>
  );
}
