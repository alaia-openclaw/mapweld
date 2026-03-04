import "./globals.css";

export const metadata = {
  title: "Weld Dashboard",
  description: "Weld tracking - load PDF, mark welds, export to Excel",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light">
      <body className="min-h-screen bg-base-200">{children}</body>
    </html>
  );
}
