"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { Mic, MicOff, Send, Check, Edit2, X, Tag } from "lucide-react";

export default function ExpenseForm() {
    const {
        isListening,
        transcript,
        startListening,
        stopListening,
        resetTranscript,
        notSupported,
    } = useVoiceInput();

    // Mode: 'input' | 'review'
    const [mode, setMode] = useState<"input" | "review">("input");

    // Input State
    const [date, setDate] = useState("");
    const [inputText, setInputText] = useState("");

    // Review State
    const [extractedData, setExtractedData] = useState<any>(null);

    // Loading State
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        setDate(new Date().toISOString().split("T")[0]);
    }, []);

    useEffect(() => {
        if (transcript) {
            setInputText(transcript);
        }
    }, [transcript]);

    const handleExtract = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        setIsProcessing(true);
        try {
            const res = await fetch("/server/extract-expense", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "extract", rawText: inputText, date }),
            });

            const json = await res.json();
            if (json.success) {
                setExtractedData(json.data);
                setMode("review");
            } else {
                alert("Extraction failed: " + json.error);
            }
        } catch (err) {
            console.error(err);
            alert("Error contacting server");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSave = async () => {
        setIsProcessing(true);
        try {
            const res = await fetch("/server/extract-expense", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "save",
                    expenseData: { ...extractedData, date, rawText: inputText }
                }),
            });

            const json = await res.json();
            if (json.success) {
                alert("Expense Saved!");
                // Reset
                setInputText("");
                resetTranscript();
                setMode("input");
                setExtractedData(null);
            } else {
                alert("Save failed: " + json.error);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsProcessing(false);
        }
    };

    const updateField = (field: string, value: any) => {
        setExtractedData((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleMicClick = () => {
        if (isListening) {
            stopListening();
        } else {
            resetTranscript();
            startListening();
        }
    };

    if (mode === "review" && extractedData) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-2xl bg-gradient-to-br from-zinc-900/90 to-zinc-900/70 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-emerald-500/20 shadow-2xl shadow-emerald-500/10 mx-auto"
            >
                <motion.h2
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 flex items-center gap-2"
                >
                    <Check size={24} className="text-emerald-400" /> Review & Confirm
                </motion.h2>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                    {/* Amount */}
                    <div className="col-span-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1 block">Amount</label>
                        <div className="relative">
                            <span className="absolute left-3 top-3 text-zinc-400">$</span>
                            <input
                                type="number"
                                value={extractedData.amount || ""}
                                onChange={e => updateField('amount', parseFloat(e.target.value))}
                                className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl py-2 pl-8 pr-4 text-white focus:ring-2 focus:ring-emerald-500 outline-none text-lg font-mono"
                            />
                        </div>
                    </div>

                    {/* Category */}
                    <div className="col-span-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1 block">Category</label>
                        <input
                            type="text"
                            value={extractedData.expense_category || ""}
                            onChange={e => updateField('expense_category', e.target.value)}
                            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl py-2 px-4 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                            list="categories"
                        />
                        <datalist id="categories">
                            <option value="Food" />
                            <option value="Transport" />
                            <option value="Shopping" />
                            <option value="Bills" />
                            <option value="Health" />
                        </datalist>
                    </div>

                    {/* Description */}
                    <div className="col-span-1 md:col-span-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1 block">Description</label>
                        <textarea
                            value={extractedData.description || ""}
                            onChange={e => updateField('description', e.target.value)}
                            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl py-2 px-4 text-white focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                            rows={2}
                        />
                    </div>

                    {/* Details Grid */}
                    <div className="col-span-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1 block">Payment Method</label>
                        <input
                            value={extractedData.payment_method || ""}
                            onChange={e => updateField('payment_method', e.target.value)}
                            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl py-2 px-4 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                    </div>
                    <div className="col-span-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1 block">Spent By</label>
                        <input
                            value={extractedData.expense_made_by || "User"}
                            onChange={e => updateField('expense_made_by', e.target.value)}
                            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl py-2 px-4 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                    </div>

                    {/* Metadata Tags */}
                    <div className="col-span-1 md:col-span-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-2">
                            <Tag size={12} /> AI Metadata Tags
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {extractedData.metadata?.tags?.map((tag: string, i: number) => (
                                <span key={i} className="px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-xs text-zinc-300">
                                    #{tag}
                                </span>
                            ))}
                            <span className="px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-xs text-zinc-500 italic">
                                Sentiment: {extractedData.metadata?.sentiment}
                            </span>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mt-8 flex gap-4"
                >
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setMode('input')}
                        className="flex-1 py-3 rounded-xl border border-zinc-600 text-zinc-300 hover:bg-zinc-800 transition-all font-medium"
                    >
                        Back
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSave}
                        disabled={isProcessing}
                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-bold hover:shadow-lg hover:shadow-cyan-500/20 transition-all disabled:opacity-50"
                    >
                        {isProcessing ? "Saving..." : "Confirm & Save"}
                    </motion.button>
                </motion.div>
            </motion.div>
        );
    }

    return (
        <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            onSubmit={handleExtract}
            className="w-full max-w-lg bg-white/5 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden group mx-auto"
        >
            {/* Decorative Blur */}
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-blue-500/20 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-500/30 transition-all duration-1000" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-purple-500/20 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-500/30 transition-all duration-1000" />

            <h2 className="text-3xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 relative z-10">
                Log Expense
            </h2>

            <div className="space-y-6 relative z-10">
                {/* Date Input */}
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">When?</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-black/40 border border-zinc-700/50 rounded-2xl p-4 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                </div>

                {/* Text Input with Voice */}
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">What happened?</label>
                    <div className="relative group/input">
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="e.g. Paid 2000 for petrol..."
                            rows={4}
                            className="w-full bg-black/40 border border-zinc-700/50 rounded-2xl p-4 pr-14 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none placeholder-zinc-600"
                        />

                        {/* Mic Button */}
                        {!notSupported && (
                            <button
                                type="button"
                                onClick={handleMicClick}
                                className={`absolute right-3 bottom-3 p-3 rounded-xl transition-all duration-300 ${isListening
                                    ? "bg-red-500 text-white shadow-lg shadow-red-500/40 scale-110 animate-pulse"
                                    : "bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"
                                    }`}
                            >
                                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                            </button>
                        )}
                    </div>
                    {isListening && (
                        <div className="flex items-center gap-2 mt-2 text-red-400 justify-end">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                            <p className="text-xs font-medium">Listening...</p>
                        </div>
                    )}
                </div>

                {/* Submit */}
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={isProcessing || !inputText}
                    className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-bold text-lg py-4 rounded-2xl flex items-center justify-center gap-3 transition-all hover:shadow-lg hover:shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isProcessing ? (
                        <span className="flex items-center gap-2 animate-pulse">Processing...</span>
                    ) : (
                        <>
                            Analyze & Review <Send size={20} />
                        </>
                    )}
                </motion.button>
            </div>
        </motion.form>
    );
}
