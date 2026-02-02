from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from api.agent import agent
import logging
import json
import asyncio
from sse_starlette.sse import EventSourceResponse

# Initialize FastAPI
app = FastAPI()

# Configure Logging
logging.basicConfig(level=logging.INFO)

class Message(BaseModel):
    role: str
    content: str
class ChatRequest(BaseModel):
    messages: List[Dict[str, Any]]

@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest):
    try:
        messages = req.messages
        if not messages:
             raise HTTPException(status_code=400, detail="No messages provided")
        
        last_user_message = messages[-1].get("content", "")
        if not last_user_message:
             raise HTTPException(status_code=400, detail="Last message empty")

        async def event_generator():
            # Use run_stream to get chunks
            previous_chunk = ""
            async with agent.run_stream(last_user_message, message_history=messages) as result:
                async for chunk in result.stream():
                    # Send only the new part of the chunk
                    new_part = chunk[len(previous_chunk):]
                    if new_part:
                        yield {"event": "message", "data": new_part}
                    previous_chunk = chunk

                # Attempt to retrieve the final RunResult object which contains history
                # async with block variable 'result' is a StreamedRunResult.
                # It doesn't automatically expose the final RunResult unless we call something.
                # However, pydantic-ai documentation says we can get the messages from it.
                # Let's try to inspect result.all_messages() if it exists.
                
                # We will try to get the final messages.
                # If we fail, we just log it.
                try:
                    # In v0.0.x/v0.1.x, usage might be different.
                    # Let's try to get all messages.
                    msgs = []
                    if hasattr(result, 'all_messages'):
                        msgs = result.all_messages()
                    elif hasattr(result, 'messages'):
                        msgs = result.messages
                    elif hasattr(result, '_all_messages'):
                        msgs = result._all_messages

                    # Look for tool calls to 'render_chart'
                    for m in msgs:
                        # Inspect tool calls
                        # Structure of message depends on lib version. 
                        # Usually m.parts or similar.
                        # Let's dump it if unsure.
                        # We look for "tool-call" parts.
                        parts = getattr(m, 'parts', [])
                        if not parts and isinstance(m, dict): # if dict
                             parts = m.get('parts', [])
                        
                        for part in parts:
                            # If part is tool call
                            # We check if part has 'tool_name' == 'render_chart'
                            # Or strict type checking.
                            # We will assume it's an object with attributes.
                            tname = getattr(part, 'tool_name', None)
                            if tname == 'render_chart':
                                args = getattr(part, 'args', {})
                                # Send the chart event!
                                # args should be a dict or object.
                                if hasattr(args, 'args_dict'):
                                     args = args.args_dict
                                
                                yield {"event": "chart", "data": json.dumps(args)}
                except Exception as inner_e:
                    print(f"Error inspecting tools: {inner_e}")

        return EventSourceResponse(event_generator())

    except Exception as e:
        logging.error(f"Error processing chat: {e}")
        return EventSourceResponse(iter([{"event": "error", "data": str(e)}]))

@app.get("/")
def health_check():
    return {"status": "ok", "service": "Financial Assistant Agent"}
