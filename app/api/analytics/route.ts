import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";

export async function GET(req: NextRequest) {
    try {
        const { db } = await dbConnect();

        // Fetch all expenses
        const expenses = await db.collection("expenses").find({}).toArray();

        if (!expenses || expenses.length === 0) {
            return NextResponse.json({
                success: true,
                data: {
                    expenses: [],
                    totalSpent: 0,
                    averageSpent: 0,
                    expenseCount: 0,
                    categoryData: [],
                    dailyData: [],
                    methodData: [],
                    categoryPercentage: [],
                }
            });
        }

        // Calculate basic metrics
        const totalSpent = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        const expenseCount = expenses.length;
        const averageSpent = expenseCount > 0 ? totalSpent / expenseCount : 0;

        // Category breakdown
        const categoryMap: { [key: string]: number } = {};
        expenses.forEach(e => {
            const cat = e.category || e.expense_category || "Other";
            categoryMap[cat] = (categoryMap[cat] || 0) + (e.amount || 0);
        });

        const categoryData = Object.entries(categoryMap).map(([name, value]) => ({
            name,
            value: parseFloat(value.toFixed(2))
        })).sort((a, b) => b.value - a.value);

        // Category percentage
        const categoryPercentage = categoryData.map(cat => ({
            ...cat,
            percentage: parseFloat(((cat.value / totalSpent) * 100).toFixed(1))
        }));

        // Daily spending trend (last 30 days)
        const dailyMap: { [key: string]: number } = {};
        expenses.forEach(e => {
            const date = new Date(e.date).toLocaleDateString();
            dailyMap[date] = (dailyMap[date] || 0) + (e.amount || 0);
        });

        const dailyData = Object.entries(dailyMap)
            .map(([date, amount]) => ({
                date,
                amount: parseFloat(amount.toFixed(2))
            }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(-30); // Last 30 days

        // Payment method breakdown
        const methodMap: { [key: string]: number } = {};
        expenses.forEach(e => {
            const method = e.paymentMethod || "Unknown";
            methodMap[method] = (methodMap[method] || 0) + (e.amount || 0);
        });

        const methodData = Object.entries(methodMap).map(([name, value]) => ({
            name,
            value: parseFloat(value.toFixed(2))
        })).sort((a, b) => b.value - a.value);

        // Format expenses for frontend
        const formattedExpenses = expenses.map(e => ({
            _id: e._id?.toString() || "",
            date: e.date ? new Date(e.date).toISOString() : new Date().toISOString(),
            amount: e.amount || 0,
            category: e.category || e.expense_category || "Other",
            description: e.description || e.rawText || "",
            paymentMethod: e.paymentMethod || e.payment_method || "Unknown",
            expense_made_by: e.expense_made_by || "User"
        }));

        return NextResponse.json({
            success: true,
            data: {
                expenses: formattedExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
                totalSpent: parseFloat(totalSpent.toFixed(2)),
                averageSpent: parseFloat(averageSpent.toFixed(2)),
                expenseCount,
                categoryData,
                dailyData,
                methodData,
                categoryPercentage
            }
        });
    } catch (error) {
        console.error("Analytics error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch analytics" },
            { status: 500 }
        );
    }
}
