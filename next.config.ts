import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "suede-signal.vercel.app" }],
        destination: "https://signal.suedeai.ai/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
