"use client";

import { useState, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import { Filter, TrendingUp, DollarSign, ShoppingCart, Calendar } from "lucide-react";

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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

export default function Dashboard() {
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
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await fetch("/server/analytics");
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

        fetchData();
    }, []);

    // Apply filters
    useEffect(() => {
        if (!data) return;

        let filtered = [...data.expenses];

        // Date range filter
        if (dateFrom) {
            filtered = filtered.filter(e => new Date(e.date) >= new Date(dateFrom));
        }
        if (dateTo) {
            filtered = filtered.filter(e => new Date(e.date) <= new Date(dateTo));
        }

        // Category filter
        if (selectedCategory !== "all") {
            filtered = filtered.filter(e => e.category === selectedCategory);
        }

        // Amount range filter
        if (minAmount) {
            filtered = filtered.filter(e => e.amount >= parseFloat(minAmount));
        }
        if (maxAmount) {
            filtered = filtered.filter(e => e.amount <= parseFloat(maxAmount));
        }

        // Payment method filter
        if (selectedPaymentMethod !== "all") {
            filtered = filtered.filter(e => e.paymentMethod === selectedPaymentMethod);
        }

        // Search filter
        if (searchText) {
            filtered = filtered.filter(e =>
                e.description.toLowerCase().includes(searchText.toLowerCase()) ||
                e.category.toLowerCase().includes(searchText.toLowerCase())
            );
        }

        setFilteredExpenses(filtered);
        setCurrentPage(1);
    }, [data, dateFrom, dateTo, selectedCategory, minAmount, maxAmount, selectedPaymentMethod, searchText]);

    // Pagination
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
            <div className="flex items-center justify-center min-h-screen bg-black">
                <div className="text-white text-lg">Loading dashboard...</div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-black">
                <div className="text-red-400 text-lg">Failed to load dashboard data</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-2">
                        Financial Dashboard
                    </h1>
                    <p className="text-gray-400">Track and analyze your spending patterns</p>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <MetricCard
                        title="Total Spent"
                        value={`$${data.totalSpent.toFixed(2)}`}
                        icon={<DollarSign className="w-6 h-6" />}
                        color="from-blue-500 to-blue-600"
                    />
                    <MetricCard
                        title="Average Expense"
                        value={`$${data.averageSpent.toFixed(2)}`}
                        icon={<TrendingUp className="w-6 h-6" />}
                        color="from-green-500 to-green-600"
                    />
                    <MetricCard
                        title="Total Transactions"
                        value={data.expenseCount.toString()}
                        icon={<ShoppingCart className="w-6 h-6" />}
                        color="from-purple-500 to-purple-600"
                    />
                    <MetricCard
                        title="Date Range"
                        value={`${new Date().toLocaleDateString()}`}
                        icon={<Calendar className="w-6 h-6" />}
                        color="from-orange-500 to-orange-600"
                    />
                </div>

                {/* Filters Section */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter className="w-5 h-5 text-blue-400" />
                        <h2 className="text-lg font-semibold text-white">Filters</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        {/* Date From */}
                        <div>
                            <label className="text-xs font-semibold text-gray-400 uppercase mb-2 block">From Date</label>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            />
                        </div>

                        {/* Date To */}
                        <div>
                            <label className="text-xs font-semibold text-gray-400 uppercase mb-2 block">To Date</label>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            />
                        </div>

                        {/* Category */}
                        <div>
                            <label className="text-xs font-semibold text-gray-400 uppercase mb-2 block">Category</label>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            >
                                <option value="all">All Categories</option>
                                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>

                        {/* Payment Method */}
                        <div>
                            <label className="text-xs font-semibold text-gray-400 uppercase mb-2 block">Payment Method</label>
                            <select
                                value={selectedPaymentMethod}
                                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            >
                                <option value="all">All Methods</option>
                                {paymentMethods.map(method => <option key={method} value={method}>{method}</option>)}
                            </select>
                        </div>

                        {/* Min Amount */}
                        <div>
                            <label className="text-xs font-semibold text-gray-400 uppercase mb-2 block">Min Amount</label>
                            <input
                                type="number"
                                placeholder="0"
                                value={minAmount}
                                onChange={(e) => setMinAmount(e.target.value)}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            />
                        </div>

                        {/* Max Amount */}
                        <div>
                            <label className="text-xs font-semibold text-gray-400 uppercase mb-2 block">Max Amount</label>
                            <input
                                type="number"
                                placeholder="999999"
                                value={maxAmount}
                                onChange={(e) => setMaxAmount(e.target.value)}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            />
                        </div>

                        {/* Search */}
                        <div className="lg:col-span-2">
                            <label className="text-xs font-semibold text-gray-400 uppercase mb-2 block">Search Description</label>
                            <input
                                type="text"
                                placeholder="Search expenses..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={resetFilters}
                            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            Reset Filters
                        </button>
                        <div className="text-gray-400 text-sm self-center ml-auto">
                            Showing {paginatedExpenses.length} of {filteredExpenses.length} expenses
                        </div>
                    </div>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Pie Chart - Category Distribution */}
                    <ChartCard title="Spending Distribution by Category">
                        <ReactECharts option={getPieChartOption(data.categoryPercentage)} style={{ height: '400px' }} />
                    </ChartCard>

                    {/* Bar Chart - Category Spending */}
                    <ChartCard title="Amount by Category">
                        <ReactECharts option={getBarChartOption(data.categoryData)} style={{ height: '400px' }} />
                    </ChartCard>

                    {/* Line Chart - Daily Spending Trend */}
                    <ChartCard title="Daily Spending Trend (30 Days)">
                        <ReactECharts option={getLineChartOption(data.dailyData)} style={{ height: '400px' }} />
                    </ChartCard>

                    {/* Payment Method Chart */}
                    <ChartCard title="Spending by Payment Method">
                        <ReactECharts option={getPaymentMethodChart(data.methodData)} style={{ height: '400px' }} />
                    </ChartCard>
                </div>

                {/* Expenses Table */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-zinc-800">
                        <h2 className="text-lg font-semibold text-white">Recent Expenses</h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-zinc-800">
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-200">Date</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-200">Description</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-200">Category</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-200">Amount</th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-200">Payment Method</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedExpenses.length > 0 ? (
                                    paginatedExpenses.map((expense, idx) => (
                                        <tr key={expense._id} className={idx % 2 === 0 ? 'bg-zinc-900/50' : 'bg-zinc-900'}>
                                            <td className="px-6 py-3 text-sm text-gray-300">{new Date(expense.date).toLocaleDateString()}</td>
                                            <td className="px-6 py-3 text-sm text-gray-300">{expense.description}</td>
                                            <td className="px-6 py-3 text-sm">
                                                <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-medium">
                                                    {expense.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-sm font-semibold text-green-400">${expense.amount.toFixed(2)}</td>
                                            <td className="px-6 py-3 text-sm text-gray-400">{expense.paymentMethod || 'N/A'}</td>
                                        </tr>
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

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-zinc-800 flex items-center justify-between">
                            <div className="text-sm text-gray-400">
                                Page {currentPage} of {totalPages}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white rounded text-sm"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white rounded text-sm"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Metric Card Component
function MetricCard({ title, value, icon, color }: {
    title: string;
    value: string;
    icon: React.ReactNode;
    color: string;
}) {
    return (
        <div className={`bg-gradient-to-br ${color} p-6 rounded-2xl border border-opacity-20 border-white`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-white/70 text-sm font-medium">{title}</p>
                    <h3 className="text-2xl font-bold text-white mt-2">{value}</h3>
                </div>
                <div className="text-white/50">{icon}</div>
            </div>
        </div>
    );
}

// Chart Card Component
function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-shadow">
            <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
            {children}
        </div>
    );
}

// ECharts Configuration Functions
function getPieChartOption(data: any[]) {
    return {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'item',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
                color: 'rgb(0, 136, 254)'
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
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
                color: 'rgba(0, 196, 159, 0.2)'
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
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
                color: 'rgb(255, 187, 40)'
            },
            emphasis: { itemStyle: { color: 'rgb(255, 221, 0)' } }
        }]
    };
}
