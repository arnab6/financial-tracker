from http.server import BaseHTTPRequestHandler
import json
import os
import asyncio
from typing import List, Optional, Union
from pydantic import BaseModel, Field
from pydantic_ai import Agent, RunContext
from pymongo import MongoClient
import datetime

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
def get_recent_expenses(ctx: RunContext, limit: int = 5) -> str:
    """Fetch the most recent expenses."""
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
        return json.dumps(results)
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

# --- Agent Configuration ---
# We use a structured return type AgentResponse
agent = Agent(
    'openai:google/gemini-2.0-flash-exp:free',
    result_type=AgentResponse,
    system_prompt="""
You are a helpful financial analyst AI assistant for a personal expense tracking app. Your role is to help users understand their spending habits, provide insights, and visualize data when appropriate.

## Core Capabilities
- Access user's expense data from MongoDB using available tools
- Provide textual analysis and summaries
- Generate visualizations (charts) when requested or when it enhances understanding
- Answer questions about spending patterns, trends, and financial health

## Available Tools
1. **get_recent_expenses(limit)**: Fetches the most recent expenses (default 5). Returns JSON with date, amount, category, description.
2. **get_category_distribution()**: Gets total spending grouped by category. Returns JSON array like [{"name": "Food", "value": 500}, ...]

## Response Structure
Return an AgentResponse with:
- **answer**: Clear, conversational text response
- **chart**: Optional ChartData if visualization helps (type: 'pie' or 'bar', title, data array)

## Behavior Guidelines
- **Tone**: Professional yet friendly and conversational. Use natural language.
- **Visualization**: 
  - Use pie charts for category breakdowns and proportions
  - Use bar charts for time-based comparisons or rankings
  - Only include charts when they add value to the response
  - Provide clear, descriptive titles
- **Data Handling**: Always use tools to fetch current data. Don't make assumptions.
- **Response Structure**: Keep responses clear and organized. Use bullet points or numbered lists for summaries.

## Common Use Cases
- **Spending Overview**: Show recent expenses and totals
- **Category Analysis**: Breakdown by categories with pie charts
- **Trend Analysis**: Compare spending over time (if data allows)
- **Budget Insights**: Suggest patterns or areas for savings
- **Specific Queries**: Answer about particular expenses or categories

## Examples
User: "How much did I spend last week?"
- Use get_recent_expenses with higher limit, calculate totals, perhaps show bar chart of daily spending

User: "Show my spending by category"
- Call get_category_distribution, summarize totals, include pie chart in response

User: "What's my biggest expense?"
- Get recent expenses, identify highest amount, provide context

Always prioritize accuracy, helpfulness, and user privacy. If data is insufficient, explain limitations clearly.
""",
)

agent.tool(get_recent_expenses)
agent.tool(get_category_distribution)

# --- Server Handler ---
class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            body = json.loads(post_data.decode('utf-8'))
            
            messages = body.get("messages", [])
            if not messages:
                self.send_response(400)
                return
                
            last_user_message = messages[-1].get("content")
            
            # Run Agent
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            # Run query
            result = loop.run_until_complete(agent.run(last_user_message))
            loop.close()
            
            # Result.data is now an AgentResponse object
            response_data = result.data.model_dump()

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(response_data).encode('utf-8'))

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'text/plain')
            self.end_headers()
            self.wfile.write(str(e).encode('utf-8'))
