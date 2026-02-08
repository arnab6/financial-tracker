import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { action, rawText, date, expenseData } = body;

        // Action 1: SAVE (Commit to DB)
        if (action === "save") {
            if (!expenseData) {
                return NextResponse.json({ error: "No expense data provided" }, { status: 400 });
            }

            const { db } = await dbConnect();

            const expenseDoc = {
                ...expenseData,
                date: expenseData.date ? new Date(expenseData.date) : new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const result = await db.collection("expenses").insertOne(expenseDoc);
            return NextResponse.json({ success: true, data: { _id: result.insertedId, ...expenseDoc } });
        }

        // Action 2: EXTRACT (Call LLM only)
        if (action === "extract") {
            if (!rawText) {
                return NextResponse.json({ error: "Missing text" }, { status: 400 });
            }

            const apiKey = process.env.OPENROUTER_API_KEY;
            let extractedData: any = {};

            if (apiKey) {
                const prompt = `
            Analyze the expense text and extract structured data.
            Infer missing details logically (e.g. "Petrol" -> Category: Transport).
            
            Text: "${rawText}"
            Date Context: ${date || new Date().toISOString()}

            Output JSON Schema:
            {
              "raw_text": string (original text),
              "amount": number | null,
              "expense_category": string (e.g. Food, Transport, Shopping, Bills, Health, Entertainment, Other),
              "payment_method": string | null (e.g. Cash, UPI, Credit Card),
              "expense_made_by": string (Default to "User" if not specified, or infer valid name),
              "description": string (Short summary),
              "metadata": {
                 "tags": string[],  // Generate 3-5 relevant tags e.g. ["fuel", "vehicle", "monthly"]
                 "sentiment": string, // "neutral", "happy", "regret" (inferred)
                 "urgency": string // "high", "medium", "low"
              }
            }
            `;

                try {
                    const llmRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${apiKey}`,
                            "Content-Type": "application/json",
                            "HTTP-Referer": "https://financial-tracker.app",
                        },
                        body: JSON.stringify({
                            model: process.env.LLM_MODEL || "google/gemini-2.0-flash-exp:free",
                            messages: [{ role: "user", content: prompt }]
                        })
                    });

                    if (llmRes.ok) {
                        const json = await llmRes.json();
                        const content = json.choices?.[0]?.message?.content;
                        if (content) {
                            const cleanContent = content.replace(/```json/g, "").replace(/```/g, "").trim();
                            extractedData = JSON.parse(cleanContent);
                        }
                    }
                } catch (e) {
                    console.error("LLM Failed", e);
                }
            }

            // Return JSON to frontend for review (do NOT save yet)
            return NextResponse.json({ success: true, data: extractedData });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
