import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
    title: "Financial Tracker",
    description: "Track your expenses with AI",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className="antialiased" suppressHydrationWarning>
                <Navbar />
                {children}
            </body>
        </html>
    );
}
