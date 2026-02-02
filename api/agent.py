import os
import json
import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from pydantic_ai import Agent, RunContext
from pymongo import MongoClient
from dotenv import load_dotenv
import time
from functools import lru_cache

# Load environment variables from .env file
load_dotenv()

# Configure OpenAI Base for OpenRouter
os.environ["OPENAI_BASE_URL"] = "https://openrouter.ai/api/v1"
if "OPENROUTER_API_KEY" in os.environ and "OPENAI_API_KEY" not in os.environ:
    os.environ["OPENAI_API_KEY"] = os.environ["OPENROUTER_API_KEY"]

# --- Database Helper ---
def get_db():
    uri = os.environ.get("MONGODB_URI")
    if not uri:
        raise ValueError("MONGODB_URI not set")
    return MongoClient(uri).get_database("financial_app")

# --- Structured Response Model ---
class ChartData(BaseModel):
    type: str = Field(description="Type of chart: 'pie' or 'bar'")
    title: str = Field(description="Title of the chart")
    data: List[dict] = Field(description="List of data points, e.g. [{'name': 'Food', 'value': 200}]")

class AgentResponse(BaseModel):
    answer: str = Field(description="Text answer to the user's question")
    chart: Optional[ChartData] = Field(default=None, description="Optional chart data if visualization is helpful")

# --- Tools ---
# Simple cache for tool results (in-memory, expires after 5 minutes)
@lru_cache(maxsize=128)
def cached_get_recent_expenses(limit: int = 5) -> str:
    # Cache key includes limit, but we can make it time-sensitive
    # For simplicity, cache for 5 minutes
    current_time = int(time.time() // 300)  # 5-minute buckets
    return f"{current_time}_{limit}", get_recent_expenses(None, limit)

import time

# Simple in-memory cache
cache = {}

def get_recent_expenses(ctx: RunContext, limit: int = 5) -> str:
    """Fetch the most recent expenses."""
    cache_key = f"recent_{limit}"
    current_time = time.time()
    
    # Cache for 5 minutes
    if cache_key in cache and (current_time - cache[cache_key]['time']) < 300:
        return cache[cache_key]['data']
    
    try:
        db = get_db()
        expenses = list(db.expenses.find().sort("date", -1).limit(limit))
        results = []
        for e in expenses:
            results.append({
                "date": str(e.get("date")),
                "amount": e.get("amount"),
                "category": e.get("category") or e.get("expense_category"),
                "description": e.get("description") or e.get("rawText"),
            })
        data = json.dumps(results)
        cache[cache_key] = {'data': data, 'time': current_time}
        return data
    except Exception as e:
        return f"Error: {str(e)}"

def get_category_distribution(ctx: RunContext) -> str:
    """
    Get total spending grouped by category. Useful for Pie Charts.
    Returns list like: [{"name": "Food", "value": 500}, ...]
    """
    try:
        db = get_db()
        pipeline = [
            {"$group": {"_id": "$expense_category", "total": {"$sum": "$amount"}}},
            {"$project": {"_id": 0, "name": "$_id", "value": "$total"}}
        ]
        result = list(db.expenses.aggregate(pipeline))
        # Filter out nulls
        clean_result = [r for r in result if r['name']]
        return json.dumps(clean_result)
    except Exception as e:
        return f"Error: {str(e)}"

def render_chart(ctx: RunContext, type: str, title: str, data: List[dict]) -> str:
    """
    Call this tool when you want to display a chart to the user.
    args:
        type: 'pie' or 'bar'
        title: The title of the chart
        data: The data points, e.g. [{'name': 'Food', 'value': 200}]
    """
    # The tool returns a success message to the agent.
    # The real chart data is captured by the backend inspection of tool calls.
    return "Chart visual generated."

# --- Agent Configuration ---
# Ensure the model is correct. We use the 'openai' provider wrapper for OpenRouter.
model_id = os.getenv("LLM_MODEL", "google/gemini-2.0-flash-exp:free")
if not model_id.startswith("openai:"):
    model_id = f"openai:{model_id}"

agent = Agent(
    model_id,
    system_prompt="""
You are a sophisticated financial analyst AI assistant for a personal expense tracking app. Your role is to provide expert, professional insights into the user's spending habits, deliver accurate data-driven advice, and present information in a polished, conversational manner.

## Core Capabilities
- Access user's expense data from MongoDB using available tools
- Provide detailed, actionable financial analysis and summaries
- Generate visualizations (charts) when they enhance understanding or professionalism
- Answer complex questions about spending patterns, trends, budgets, and financial health with precision

## Available Tools
1. **get_recent_expenses(limit)**: Retrieves the most recent expenses (default 5). Returns JSON with date, amount, category, description.
2. **get_category_distribution()**: Aggregates total spending by category. Returns JSON array like [{"name": "Food", "value": 500}, ...]
3. **render_chart(type, title, data)**: Creates professional chart visualizations. Types: 'pie' for distributions, 'bar' for comparisons.

## Professional Behavior Guidelines
- **Tone**: Highly professional, empathetic, and expert. Use clear, concise language. Avoid slang or casual phrases.
- **Analysis Depth**: Provide insights, trends, and recommendations. Compare to benchmarks if possible (e.g., "This is 15% above average for your category").
- **Visualization**: Use charts sparingly but effectively. Ensure titles are descriptive and data is accurate.
- **Data Handling**: Always fetch fresh data. Handle errors gracefully with informative messages.
- **Response Structure**: Organize responses logically: summary, details, insights, recommendations. Use numbered lists or sections for clarity.
- **Streaming**: Deliver responses in a flowing, natural manner without abrupt stops.

## Advanced Features
- **Trend Analysis**: Identify patterns over time (e.g., increasing spending in certain categories).
- **Budgeting Advice**: Suggest optimizations based on data.
- **Personalization**: Reference user's history for tailored advice.

## Examples
User: "How much did I spend last week?"
- Fetch recent expenses, calculate totals, provide breakdown, suggest savings if applicable.

User: "Show my spending by category"
- Retrieve distribution, summarize key categories, render pie chart with professional title.

User: "Am I overspending?"
- Analyze totals vs. typical spending, provide detailed report with recommendations.

Prioritize accuracy, professionalism, and user value. If data is insufficient, request clarification politely.
""",
)

agent.tool(get_recent_expenses)
agent.tool(get_category_distribution)
agent.tool(render_chart)
