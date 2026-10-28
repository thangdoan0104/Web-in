import { AREA_SERVED, SITE, absoluteUrl } from "@/lib/site";

// Doanh nghiệp địa phương: tên, địa chỉ, số điện thoại phải khớp Google Business Profile
export function localBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": absoluteUrl("/#business"),
    name: SITE.name,
    description: "Xưởng in standee, tờ rơi, biển quảng cáo và nhận thiết kế ấn phẩm tại Thái Nguyên. Đặt in online, xem mockup trước khi in.",
    url: absoluteUrl("/"),
    image: absoluteUrl("/og.png"),
    ...(SITE.phone && { telephone: SITE.phone }),
    ...(SITE.email && { email: SITE.email }),
    address: {
      "@type": "PostalAddress",
      ...(SITE.street && { streetAddress: SITE.street }),
      ...(SITE.ward && { addressLocality: SITE.ward }),
      addressRegion: SITE.city,
      addressCountry: "VN",
    },
    ...(SITE.lat && SITE.lng && { geo: { "@type": "GeoCoordinates", latitude: SITE.lat, longitude: SITE.lng } }),
    ...(SITE.hours && { openingHours: SITE.hours }),
    ...(SITE.mapsUrl && { hasMap: SITE.mapsUrl }),
    areaServed: AREA_SERVED.map((name) => ({ "@type": "Place", name })),
    priceRange: "$$",
    sameAs: [SITE.facebook, SITE.zalo, SITE.mapsUrl].filter(Boolean),
  };
}

export function faqSchema(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: absoluteUrl(it.path) })),
  };
}

export function serviceSchema(opts: { name: string; description: string; path: string; lowPrice: number; unit: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: opts.name,
    description: opts.description,
    url: absoluteUrl(opts.path),
    serviceType: opts.name,
    provider: { "@id": absoluteUrl("/#business") },
    areaServed: AREA_SERVED.map((name) => ({ "@type": "Place", name })),
    offers: {
      "@type": "Offer",
      priceCurrency: "VND",
      price: opts.lowPrice,
      priceSpecification: { "@type": "UnitPriceSpecification", price: opts.lowPrice, priceCurrency: "VND", unitText: opts.unit },
      availability: "https://schema.org/InStock",
    },
  };
}
