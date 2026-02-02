import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    async rewrites() {
        return [
            {
                source: "/api/chat",
                destination:
                    process.env.NODE_ENV === "development"
                        ? "http://127.0.0.1:8000/api/chat"
                        : process.env.BACKEND_URL
                        ? `${process.env.BACKEND_URL.replace(/\/+$/, '')}/api/chat`
                        : "/api/chat",
            },
        ];
    },
};

export default nextConfig;
