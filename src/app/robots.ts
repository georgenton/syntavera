import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin/", "/portal/", "/api/", "/login", "/invite/"] }],
    sitemap: `${BRAND.url}/sitemap.xml`,
    host: BRAND.url,
  };
}
