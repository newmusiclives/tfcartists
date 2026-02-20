import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/riley", "/harper", "/elliot", "/cassidy", "/parker", "/station-admin", "/api"],
      },
    ],
    sitemap: "https://truefans-radio.netlify.app/sitemap.xml",
  };
}
