"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    ShoppingCart,
    Calendar,
    PlusCircle,
    BarChart3,
    ArrowRight,
} from "lucide-react";
import ChatWidget from "@/components/ChatWidget";

interface QuickStats {
    totalSpent: number;
    expenseCount: number;
    averageSpent: number;
    topCategory: string;
}

export default function Home() {
    const [stats, setStats] = useState<QuickStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchQuickStats = async () => {
            try {
                const response = await fetch("/api/analytics");
                const result = await response.json();
                if (result.success) {
                    const topCat = result.data.categoryData.reduce((max: any, curr: any) =>
                        curr.value > max.value ? curr : max
                    );
                    setStats({
                        totalSpent: result.data.totalSpent,
                        expenseCount: result.data.expenseCount,
                        averageSpent: result.data.averageSpent,
                        topCategory: topCat.name,
                    });
                }
            } catch (error) {
                console.error("Failed to fetch stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchQuickStats();
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: "spring" as const, stiffness: 300, damping: 24 },
        },
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12"
                >
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Welcome Back!
                        </span>
                    </h1>
                    <p className="text-xl text-gray-400">
                        Track, analyze, and optimize your financial journey
                    </p>
                </motion.div>

                {/* Quick Stats Grid */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
                >
                    <motion.div
                        variants={itemVariants}
                        className="bg-gradient-to-br from-blue-600/20 to-blue-600/5 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-6 hover:scale-105 transition-transform"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-blue-500/20 p-3 rounded-xl">
                                <DollarSign className="text-blue-400" size={24} />
                            </div>
                            <TrendingUp className="text-blue-400" size={20} />
                        </div>
                        <p className="text-gray-400 text-sm mb-1">Total Spent</p>
                        <p className="text-3xl font-bold text-white">
                            ${loading ? "..." : stats?.totalSpent.toFixed(2)}
                        </p>
                    </motion.div>

                    <motion.div
                        variants={itemVariants}
                        className="bg-gradient-to-br from-purple-600/20 to-purple-600/5 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 hover:scale-105 transition-transform"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-purple-500/20 p-3 rounded-xl">
                                <ShoppingCart className="text-purple-400" size={24} />
                            </div>
                            <Calendar className="text-purple-400" size={20} />
                        </div>
                        <p className="text-gray-400 text-sm mb-1">Total Expenses</p>
                        <p className="text-3xl font-bold text-white">
                            {loading ? "..." : stats?.expenseCount}
                        </p>
                    </motion.div>

                    <motion.div
                        variants={itemVariants}
                        className="bg-gradient-to-br from-green-600/20 to-green-600/5 backdrop-blur-xl border border-green-500/20 rounded-2xl p-6 hover:scale-105 transition-transform"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-green-500/20 p-3 rounded-xl">
                                <TrendingDown className="text-green-400" size={24} />
                            </div>
                            <BarChart3 className="text-green-400" size={20} />
                        </div>
                        <p className="text-gray-400 text-sm mb-1">Average Expense</p>
                        <p className="text-3xl font-bold text-white">
                            ${loading ? "..." : stats?.averageSpent.toFixed(2)}
                        </p>
                    </motion.div>

                    <motion.div
                        variants={itemVariants}
                        className="bg-gradient-to-br from-pink-600/20 to-pink-600/5 backdrop-blur-xl border border-pink-500/20 rounded-2xl p-6 hover:scale-105 transition-transform"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-pink-500/20 p-3 rounded-xl">
                                <ShoppingCart className="text-pink-400" size={24} />
                            </div>
                        </div>
                        <p className="text-gray-400 text-sm mb-1">Top Category</p>
                        <p className="text-2xl font-bold text-white">
                            {loading ? "..." : stats?.topCategory}
                        </p>
                    </motion.div>
                </motion.div>

                {/* Quick Actions */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12"
                >
                    <motion.div variants={itemVariants}>
                        <Link
                            href="/expenses/add"
                            className="group block bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-blue-500/50 transition-all hover:scale-105"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="bg-gradient-to-tr from-blue-500 to-purple-500 p-4 rounded-2xl group-hover:scale-110 transition-transform">
                                    <PlusCircle size={32} className="text-white" />
                                </div>
                                <ArrowRight className="text-gray-400 group-hover:text-white group-hover:translate-x-2 transition-all" size={24} />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Add New Expense</h3>
                            <p className="text-gray-400">
                                Quickly log your expenses with voice or text input
                            </p>
                        </Link>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <Link
                            href="/analytics"
                            className="group block bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-purple-500/50 transition-all hover:scale-105"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="bg-gradient-to-tr from-purple-500 to-pink-500 p-4 rounded-2xl group-hover:scale-110 transition-transform">
                                    <BarChart3 size={32} className="text-white" />
                                </div>
                                <ArrowRight className="text-gray-400 group-hover:text-white group-hover:translate-x-2 transition-all" size={24} />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">View Analytics</h3>
                            <p className="text-gray-400">
                                Deep dive into your spending patterns and trends
                            </p>
                        </Link>
                    </motion.div>
                </motion.div>

                {/* Recent Activity Preview - Optional */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-white">Need Help?</h2>
                        <div className="bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2 rounded-full text-sm font-medium text-white">
                            AI Assistant
                        </div>
                    </div>
                    <p className="text-gray-400 mb-4">
                        Ask our AI assistant anything about your expenses, get insights, or generate reports.
                        Try asking "Show me my spending this month" or "What's my biggest expense category?"
                    </p>
                </motion.div>
            </div>
            <ChatWidget />
        </div>
    );
}

