import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import type { NextConfig } from "next";
const config: NextConfig = {
  output: "standalone",
  images: { unoptimized: true },
  poweredByHeader: false,
  serverExternalPackages: ["bcryptjs"],
};
export default config;

if (process.env.NODE_ENV === "development")
  void initOpenNextCloudflareForDev({ persist: { path: ".wrangler/state" } });
