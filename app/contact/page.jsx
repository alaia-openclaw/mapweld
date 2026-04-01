import ContactPageClient from "@/components/ContactPageClient";

export default function ContactPage({ searchParams }) {
  const raw = searchParams?.topic;
  const topic = typeof raw === "string" ? raw.toLowerCase().trim() : undefined;

  return <ContactPageClient topic={topic} />;
}
