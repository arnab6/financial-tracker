"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
    LayoutDashboard,
    PlusCircle,
    BarChart3,
    MessageCircle,
    Wallet,
    Menu,
    X,
} from "lucide-react";
import { useState } from "react";

const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Add Expense", href: "/expenses/add", icon: PlusCircle },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
];

export default function Navbar() {
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Don't show navbar on login page
    if (pathname === "/login") return null;

    return (
        <>
            {/* Desktop Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="bg-gradient-to-tr from-blue-500 to-purple-500 p-2 rounded-xl group-hover:scale-110 transition-transform">
                                <Wallet size={24} className="text-white" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent hidden sm:block">
                                Financial Tracker
                            </span>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center gap-1">
                            {navItems.map((item) => {
                                const isActive = pathname === item.href;
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className="relative px-4 py-2 rounded-xl transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Icon size={18} className={isActive ? "text-blue-400" : "text-gray-400"} />
                                            <span className={isActive ? "text-white font-medium" : "text-gray-400 hover:text-white"}>
                                                {item.name}
                                            </span>
                                        </div>
                                        {isActive && (
                                            <motion.div
                                                layoutId="navbar-indicator"
                                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"
                                                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                            />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                        >
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden border-t border-white/10"
                    >
                        <div className="px-4 py-4 space-y-2">
                            {navItems.map((item) => {
                                const isActive = pathname === item.href;
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                                            isActive
                                                ? "bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30"
                                                : "hover:bg-white/5"
                                        }`}
                                    >
                                        <Icon size={20} className={isActive ? "text-blue-400" : "text-gray-400"} />
                                        <span className={isActive ? "text-white font-medium" : "text-gray-400"}>
                                            {item.name}
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </nav>
            {/* Spacer to prevent content from going under fixed navbar */}
            <div className="h-16" />
        </>
    );
}
