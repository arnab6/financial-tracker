from pydantic_ai import Agent
import inspect

print("INIT:", inspect.signature(Agent.__init__))
print("RUN:", inspect.signature(Agent.run))
