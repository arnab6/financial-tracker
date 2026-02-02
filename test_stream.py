import asyncio
import os
import json
from api.agent import agent
from dotenv import load_dotenv

load_dotenv()

async def test_stream():
    print("Testing stream...")
    # Update prompt to NOT force JSON for this test, or we will just see JSON chars
    # We'll just try to run it and see what we get.
    
    # Note: We need to override the system prompt to stop forcing JSON 
    # if we want to see natural language streaming, removing the "CRITICAL: Return JSON" part temporarily
    # inside agent.py would be best, but here we can't easily patch it without mocking.
    # However, even if it streams JSON, we should see it char by char.
    
    full_response = ""
    async with agent.run_stream("What is my spending breakdown?") as result:
        async for message in result.stream():
            print(f"CHUNK: {message}")
            full_response += str(message)
            
        print("\nFull Response:", full_response)

if __name__ == "__main__":
    asyncio.run(test_stream())
