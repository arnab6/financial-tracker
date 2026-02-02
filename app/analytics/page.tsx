"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import ReactECharts from "echarts-for-react";
import { Filter, TrendingUp, DollarSign, ShoppingCart, Calendar, Download, RefreshCw } from "lucide-react";

interface Expense {
    _id: string;
    date: string;
    amount: number;
    category: string;
    description: string;
    paymentMethod?: string;
    expense_made_by?: string;
}

interface DashboardData {
    expenses: Expense[];
    totalSpent: number;
    averageSpent: number;
    expenseCount: number;
    categoryData: Array<{ name: string; value: number }>;
    dailyData: Array<{ date: string; amount: number }>;
    methodData: Array<{ name: string; value: number }>;
    categoryPercentage: Array<{ name: string; value: number; percentage: number }>;
}

export default function AnalyticsPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Filters
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [minAmount, setMinAmount] = useState("");
    const [maxAmount, setMaxAmount] = useState("");
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("all");
    const [searchText, setSearchText] = useState("");

    const categories = ["Food", "Transport", "Shopping", "Bills", "Health", "Entertainment", "Other"];
    const paymentMethods = ["Cash", "UPI", "Credit Card", "Debit Card", "Net Banking"];

    // Fetch dashboard data
    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/analytics");
            const result = await response.json();
            if (result.success) {
                setData(result.data);
                setFilteredExpenses(result.data.expenses);
            }
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Apply filters
    useEffect(() => {
        if (!data) return;

        let filtered = [...data.expenses];

        if (dateFrom) filtered = filtered.filter(e => new Date(e.date) >= new Date(dateFrom));
        if (dateTo) filtered = filtered.filter(e => new Date(e.date) <= new Date(dateTo));
        if (selectedCategory !== "all") filtered = filtered.filter(e => e.category === selectedCategory);
        if (minAmount) filtered = filtered.filter(e => e.amount >= parseFloat(minAmount));
        if (maxAmount) filtered = filtered.filter(e => e.amount <= parseFloat(maxAmount));
        if (selectedPaymentMethod !== "all") filtered = filtered.filter(e => e.paymentMethod === selectedPaymentMethod);
        if (searchText) {
            filtered = filtered.filter(e =>
                e.description.toLowerCase().includes(searchText.toLowerCase()) ||
                e.category.toLowerCase().includes(searchText.toLowerCase())
            );
        }

        setFilteredExpenses(filtered);
        setCurrentPage(1);
    }, [data, dateFrom, dateTo, selectedCategory, minAmount, maxAmount, selectedPaymentMethod, searchText]);

    const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
    const paginatedExpenses = filteredExpenses.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const resetFilters = () => {
        setDateFrom("");
        setDateTo("");
        setSelectedCategory("all");
        setMinAmount("");
        setMaxAmount("");
        setSelectedPaymentMethod("all");
        setSearchText("");
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-white text-lg flex items-center gap-3"
                >
                    <RefreshCw className="animate-spin" size={24} />
                    Loading analytics...
                </motion.div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black">
                <div className="text-red-400 text-lg">Failed to load analytics data</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                                Analytics Dashboard
                            </h1>
                            <p className="text-gray-400 text-lg">Deep insights into your spending patterns</p>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={fetchData}
                            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 rounded-xl text-white font-medium hover:shadow-lg hover:shadow-blue-500/50 transition-all"
                        >
                            <RefreshCw size={18} />
                            Refresh
                        </motion.button>
                    </div>
                </motion.div>

                {/* Key Metrics */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
                >
                    <MetricCard
                        title="Total Spent"
                        value={`$${data.totalSpent.toFixed(2)}`}
                        icon={<DollarSign className="w-6 h-6" />}
                        gradient="from-blue-600/20 to-blue-600/5"
                        iconColor="blue"
                    />
                    <MetricCard
                        title="Average Expense"
                        value={`$${data.averageSpent.toFixed(2)}`}
                        icon={<TrendingUp className="w-6 h-6" />}
                        gradient="from-green-600/20 to-green-600/5"
                        iconColor="green"
                    />
                    <MetricCard
                        title="Total Transactions"
                        value={data.expenseCount.toString()}
                        icon={<ShoppingCart className="w-6 h-6" />}
                        gradient="from-purple-600/20 to-purple-600/5"
                        iconColor="purple"
                    />
                    <MetricCard
                        title="This Month"
                        value={new Date().toLocaleDateString('en-US', { month: 'long' })}
                        icon={<Calendar className="w-6 h-6" />}
                        gradient="from-pink-600/20 to-pink-600/5"
                        iconColor="pink"
                    />
                </motion.div>

                {/* Charts Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
                >
                    <ChartCard title="📊 Spending Distribution">
                        <ReactECharts option={getPieChartOption(data.categoryPercentage)} style={{ height: '400px' }} />
                    </ChartCard>

                    <ChartCard title="📈 Category Breakdown">
                        <ReactECharts option={getBarChartOption(data.categoryData)} style={{ height: '400px' }} />
                    </ChartCard>

                    <ChartCard title="📉 Daily Trend (30 Days)">
                        <ReactECharts option={getLineChartOption(data.dailyData)} style={{ height: '400px' }} />
                    </ChartCard>

                    <ChartCard title="💳 Payment Methods">
                        <ReactECharts option={getPaymentMethodChart(data.methodData)} style={{ height: '400px' }} />
                    </ChartCard>
                </motion.div>

                {/* Filters Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8"
                >
                    <div className="flex items-center gap-2 mb-6">
                        <Filter className="w-5 h-5 text-blue-400" />
                        <h2 className="text-xl font-semibold text-white">Advanced Filters</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <FilterInput label="From Date" type="date" value={dateFrom} onChange={setDateFrom} />
                        <FilterInput label="To Date" type="date" value={dateTo} onChange={setDateTo} />
                        <FilterSelect label="Category" value={selectedCategory} onChange={setSelectedCategory} options={["all", ...categories]} />
                        <FilterSelect label="Payment Method" value={selectedPaymentMethod} onChange={setSelectedPaymentMethod} options={["all", ...paymentMethods]} />
                        <FilterInput label="Min Amount" type="number" placeholder="0" value={minAmount} onChange={setMinAmount} />
                        <FilterInput label="Max Amount" type="number" placeholder="999999" value={maxAmount} onChange={setMaxAmount} />
                        <div className="lg:col-span-2">
                            <FilterInput label="Search" type="text" placeholder="Search expenses..." value={searchText} onChange={setSearchText} />
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={resetFilters}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-all"
                        >
                            Reset Filters
                        </motion.button>
                        <div className="text-gray-400 text-sm self-center ml-auto">
                            Showing {paginatedExpenses.length} of {filteredExpenses.length} expenses
                        </div>
                    </div>
                </motion.div>

                {/* Expenses Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden"
                >
                    <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-white">Transaction History</h2>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg text-sm text-white transition-all"
                        >
                            <Download size={16} />
                            Export
                        </motion.button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-white/5">
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-200">Date</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-200">Description</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-200">Category</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-200">Amount</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-200">Payment</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedExpenses.length > 0 ? (
                                    paginatedExpenses.map((expense, idx) => (
                                        <motion.tr
                                            key={expense._id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="border-b border-white/5 hover:bg-white/5 transition-colors"
                                        >
                                            <td className="px-6 py-4 text-sm text-gray-300">{new Date(expense.date).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-sm text-gray-300">{expense.description}</td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-medium">
                                                    {expense.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-semibold text-green-400">${expense.amount.toFixed(2)}</td>
                                            <td className="px-6 py-4 text-sm text-gray-400">{expense.paymentMethod || 'N/A'}</td>
                                        </motion.tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                            No expenses found matching the filters
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
                            <div className="text-sm text-gray-400">Page {currentPage} of {totalPages}</div>
                            <div className="flex gap-2">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-all"
                                >
                                    Previous
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-all"
                                >
                                    Next
                                </motion.button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}

// Components
function MetricCard({ title, value, icon, gradient, iconColor }: {
    title: string;
    value: string;
    icon: React.ReactNode;
    gradient: string;
    iconColor: string;
}) {
    const colorMap: Record<string, string> = {
        blue: "from-blue-500 to-blue-600",
        green: "from-green-500 to-green-600",
        purple: "from-purple-500 to-purple-600",
        pink: "from-pink-500 to-pink-600",
    };

    return (
        <motion.div
            whileHover={{ scale: 1.02, y: -5 }}
            className={`bg-gradient-to-br ${gradient} backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:shadow-xl transition-all`}
        >
            <div className="flex items-center justify-between mb-4">
                <div className={`bg-gradient-to-tr ${colorMap[iconColor]} p-3 rounded-xl`}>
                    <div className="text-white">{icon}</div>
                </div>
            </div>
            <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
            <h3 className="text-3xl font-bold text-white">{value}</h3>
        </motion.div>
    );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <motion.div
            whileHover={{ scale: 1.01 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:shadow-2xl transition-all"
        >
            <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
            {children}
        </motion.div>
    );
}

function FilterInput({ label, type, value, onChange, placeholder }: any) {
    return (
        <div>
            <label className="text-xs font-bold uppercase text-gray-400 mb-2 block">{label}</label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-black/40 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
            />
        </div>
    );
}

function FilterSelect({ label, value, onChange, options }: any) {
    return (
        <div>
            <label className="text-xs font-bold uppercase text-gray-400 mb-2 block">{label}</label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-black/40 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
            >
                {options.map((opt: string) => (
                    <option key={opt} value={opt}>
                        {opt === "all" ? "All " + label + "s" : opt}
                    </option>
                ))}
            </select>
        </div>
    );
}

// ECharts Configuration Functions (same as before)
function getPieChartOption(data: any[]) {
    return {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'item',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            borderColor: '#404040',
            textStyle: { color: '#fff' },
            formatter: '{b}: ${c} ({d}%)'
        },
        legend: {
            orient: 'vertical',
            right: '5%',
            top: 'center',
            textStyle: { color: '#999' }
        },
        series: [{
            name: 'Spending',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
                borderColor: '#111',
                borderWidth: 2
            },
            label: {
                show: true,
                formatter: '{b}\n${c}',
                color: '#fff'
            },
            emphasis: {
                label: {
                    show: true,
                    fontSize: 14,
                    fontWeight: 'bold'
                }
            },
            data: data
        }]
    };
}

function getBarChartOption(data: any[]) {
    return {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            borderColor: '#404040',
            textStyle: { color: '#fff' }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            top: '5%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: data.map((d: any) => d.name),
            axisLine: { lineStyle: { color: '#404040' } },
            axisLabel: { color: '#999' }
        },
        yAxis: {
            type: 'value',
            axisLine: { lineStyle: { color: '#404040' } },
            splitLine: { lineStyle: { color: '#282828' } },
            axisLabel: { color: '#999' }
        },
        series: [{
            data: data.map((d: any) => d.value),
            type: 'bar',
            itemStyle: {
                color: {
                    type: 'linear',
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [
                        { offset: 0, color: 'rgb(0, 136, 254)' },
                        { offset: 1, color: 'rgb(147, 51, 234)' }
                    ]
                }
            },
            emphasis: { itemStyle: { color: 'rgb(0, 102, 255)' } }
        }]
    };
}

function getLineChartOption(data: any[]) {
    return {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            borderColor: '#404040',
            textStyle: { color: '#fff' }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            top: '5%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: data.map((d: any) => d.date),
            axisLine: { lineStyle: { color: '#404040' } },
            axisLabel: { color: '#999' }
        },
        yAxis: {
            type: 'value',
            axisLine: { lineStyle: { color: '#404040' } },
            splitLine: { lineStyle: { color: '#282828' } },
            axisLabel: { color: '#999' }
        },
        series: [{
            data: data.map((d: any) => d.amount),
            type: 'line',
            smooth: true,
            itemStyle: { color: '#00C49F' },
            areaStyle: {
                color: {
                    type: 'linear',
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [
                        { offset: 0, color: 'rgba(0, 196, 159, 0.4)' },
                        { offset: 1, color: 'rgba(0, 196, 159, 0.0)' }
                    ]
                }
            },
            emphasis: { itemStyle: { color: '#00FF88' } }
        }]
    };
}

function getPaymentMethodChart(data: any[]) {
    return {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            borderColor: '#404040',
            textStyle: { color: '#fff' }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            top: '5%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: data.map((d: any) => d.name),
            axisLine: { lineStyle: { color: '#404040' } },
            axisLabel: { color: '#999' }
        },
        yAxis: {
            type: 'value',
            axisLine: { lineStyle: { color: '#404040' } },
            splitLine: { lineStyle: { color: '#282828' } },
            axisLabel: { color: '#999' }
        },
        series: [{
            data: data.map((d: any) => d.value),
            type: 'bar',
            itemStyle: {
                color: {
                    type: 'linear',
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [
                        { offset: 0, color: 'rgb(255, 187, 40)' },
                        { offset: 1, color: 'rgb(236, 72, 153)' }
                    ]
                }
            },
            emphasis: { itemStyle: { color: 'rgb(255, 221, 0)' } }
        }]
    };
}
