"use client";

import { motion } from "framer-motion";
import ExpenseForm from "@/components/ExpenseForm";
import { Sparkles, TrendingUp } from "lucide-react";

export default function AddExpensePage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-gradient-to-tr from-blue-500 to-purple-500 p-3 rounded-2xl">
                            <Sparkles size={28} className="text-white" />
                        </div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            Add New Expense
                        </h1>
                    </div>
                    <p className="text-gray-400 text-lg">
                        Use voice or text to quickly log your expenses. Our AI will extract all the details for you.
                    </p>
                </motion.div>

                {/* Expense Form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <ExpenseForm />
                </motion.div>

                {/* Quick Tips */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mt-8 bg-gradient-to-br from-blue-600/10 to-purple-600/10 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-6"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="text-blue-400" size={20} />
                        <h3 className="text-lg font-semibold text-white">Quick Tips</h3>
                    </div>
                    <ul className="space-y-2 text-gray-400">
                        <li className="flex items-start gap-2">
                            <span className="text-blue-400 mt-1">•</span>
                            <span>Try saying: "Spent $25 on coffee at Starbucks using my credit card"</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-purple-400 mt-1">•</span>
                            <span>Or type: "Grocery shopping $120 cash"</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-pink-400 mt-1">•</span>
                            <span>The AI will automatically categorize and structure your expense</span>
                        </li>
                    </ul>
                </motion.div>
            </div>
        </div>
    );
}
