export default function SiteStructuredData() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "MapWeld",
        url: "https://www.mapweld.app",
        email: "hello@mapweld.app",
        logo: "https://www.mapweld.app/img/Logo_only.png",
      },
      {
        "@type": "WebSite",
        name: "MapWeld",
        url: "https://www.mapweld.app",
      },
      {
        "@type": "SoftwareApplication",
        name: "MapWeld",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: "https://www.mapweld.app",
        image: "https://www.mapweld.app/og-image.png",
        description:
          "MapWeld helps fabrication teams track welds directly on PDF drawings, work offline, and export structured registers.",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
