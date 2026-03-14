export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/app", "/api/"],
      },
    ],
    sitemap: "https://www.mapweld.app/sitemap.xml",
  };
}
