import { NextRequest } from "next/server";
import clientPromise from "@/lib/mongodb";

interface Message {
    role: string;
    content: string;
}

interface ChatRequest {
    messages: Message[];
}

// Helper function to get recent expenses
async function getRecentExpenses(limit: number = 5) {
    try {
        const client = await clientPromise;
        const db = client.db("financial_app");
        const expenses = await db.collection("expenses")
            .find({})
            .sort({ date: -1 })
            .limit(limit)
            .toArray();
        
        return expenses.map(e => ({
            date: e.date ? new Date(e.date).toISOString() : null,
            amount: e.amount,
            category: e.expense_category || e.category,
            description: e.description || e.rawText
        }));
    } catch (error) {
        console.error("Error fetching expenses:", error);
        return [];
    }
}

// Helper function to get category distribution
async function getCategoryDistribution() {
    try {
        const client = await clientPromise;
        const db = client.db("financial_app");
        const pipeline = [
            { $group: { _id: "$expense_category", total: { $sum: "$amount" } } },
            { $project: { _id: 0, name: "$_id", value: "$total" } }
        ];
        const result = await db.collection("expenses").aggregate(pipeline).toArray();
        return result.filter(r => r.name);
    } catch (error) {
        console.error("Error fetching category distribution:", error);
        return [];
    }
}

// System prompt for the AI assistant
const SYSTEM_PROMPT = `You are a sophisticated financial analyst AI assistant for a personal expense tracking app. Your role is to provide expert, professional insights into the user's spending habits, deliver accurate data-driven advice, and present information in a polished, conversational manner.

## Core Capabilities
- Access user's expense data from MongoDB using available tools
- Provide detailed, actionable financial analysis and summaries
- Generate visualizations (charts) when they enhance understanding or professionalism
- Answer complex questions about spending patterns, trends, budgets, and financial health with precision

## Available Tools
You can request data by including special markers in your response:
- [TOOL:GET_RECENT_EXPENSES:5] - Gets last 5 expenses
- [TOOL:GET_CATEGORY_DISTRIBUTION] - Gets spending by category
- [TOOL:RENDER_CHART:type|title|data] - Renders a chart (pie or bar)

## Professional Behavior Guidelines
- **Tone**: Highly professional, empathetic, and expert. Use clear, concise language.
- **Analysis Depth**: Provide insights, trends, and recommendations.
- **Visualization**: Use charts sparingly but effectively. Ensure titles are descriptive and data is accurate.
- **Data Handling**: Always fetch fresh data. Handle errors gracefully with informative messages.
- **Response Structure**: Organize responses logically: summary, details, insights, recommendations.

## Chart Format
When you want to show a chart, end your response with:
[CHART:type|title|data]
Where:
- type: "pie" or "bar"
- title: Chart title
- data: JSON array like [{"name":"Food","value":200}]

Example: [CHART:pie|Spending by Category|[{"name":"Food","value":500},{"name":"Transport","value":200}]]

Prioritize accuracy, professionalism, and user value.`;

export async function POST(req: NextRequest) {
    try {
        const body: ChatRequest = await req.json();
        const { messages } = body;

        if (!messages || messages.length === 0) {
            return new Response("No messages provided", { status: 400 });
        }

        const lastUserMessage = messages[messages.length - 1]?.content || "";

        // Check if user is asking for data
        let contextData = "";
        const lowerMessage = lastUserMessage.toLowerCase();
        
        if (lowerMessage.includes("recent") || lowerMessage.includes("last") || lowerMessage.includes("latest")) {
            const expenses = await getRecentExpenses(10);
            contextData += `\n\nRecent Expenses Data:\n${JSON.stringify(expenses, null, 2)}`;
        }
        
        if (lowerMessage.includes("category") || lowerMessage.includes("categories") || lowerMessage.includes("spending") || lowerMessage.includes("distribution")) {
            const distribution = await getCategoryDistribution();
            contextData += `\n\nCategory Distribution:\n${JSON.stringify(distribution, null, 2)}`;
        }

        // Build messages for API
        const apiMessages = [
            { role: "system", content: SYSTEM_PROMPT + contextData },
            ...messages.map(m => ({ role: m.role, content: m.content }))
        ];

        // Call OpenRouter API
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",
                "X-Title": "Financial Tracker"
            },
            body: JSON.stringify({
                model: process.env.LLM_MODEL || "openai/gpt-4o-mini",
                messages: apiMessages,
                stream: true
            })
        });

        if (!response.ok) {
            throw new Error(`OpenRouter API error: ${response.status}`);
        }

        // Create SSE stream
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    const reader = response.body?.getReader();
                    if (!reader) throw new Error("No response body");

                    const decoder = new TextDecoder();
                    let buffer = "";
                    let fullResponse = "";

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split("\n");
                        buffer = lines.pop() || "";

                        for (const line of lines) {
                            if (line.startsWith("data: ")) {
                                const data = line.slice(6);
                                if (data === "[DONE]") continue;

                                try {
                                    const parsed = JSON.parse(data);
                                    const content = parsed.choices?.[0]?.delta?.content;
                                    if (content) {
                                        fullResponse += content;
                                        controller.enqueue(encoder.encode(`event: message\ndata: ${content}\n\n`));
                                    }
                                } catch (e) {
                                    // Skip invalid JSON
                                }
                            }
                        }
                    }

                    // Check for chart marker at the end
                    const chartMatch = fullResponse.match(/\[CHART:(pie|bar)\|(.*?)\|(.*?)\]/);
                    if (chartMatch) {
                        try {
                            const [, type, title, dataStr] = chartMatch;
                            const chartData = {
                                type,
                                title,
                                data: JSON.parse(dataStr)
                            };
                            controller.enqueue(encoder.encode(`event: chart\ndata: ${JSON.stringify(chartData)}\n\n`));
                        } catch (e) {
                            console.error("Failed to parse chart data:", e);
                        }
                    }

                    controller.close();
                } catch (error) {
                    console.error("Stream error:", error);
                    controller.enqueue(encoder.encode(`event: error\ndata: ${error instanceof Error ? error.message : "Unknown error"}\n\n`));
                    controller.close();
                }
            }
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            }
        });

    } catch (error) {
        console.error("Chat API error:", error);
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
