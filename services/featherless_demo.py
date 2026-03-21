import os
import sys
import json
import asyncio
import datetime
from dataclasses import dataclass
from typing import Literal, Optional, Any

import requests
from dotenv import load_dotenv
from langchain_mcp_adapters.client import MultiServerMCPClient

load_dotenv()

API_URL = "https://api.featherless.ai/v1/chat/completions"
API_KEY = os.getenv("FEATHERLESS_API_KEY")
MODEL = os.getenv("FEATHERLESS_MODEL", "moonshotai/Kimi-K2-Thinking")


# -----------------------------
# User profile
# -----------------------------
@dataclass
class VarProfile:
    date: datetime.date
    height: int
    weight: int
    activity_level: Literal["not at all", "lightly active", "moderately active", "very active"]
    dietary_preferences: Literal["vegetarian", "vegan", "non-vegetarian", "vegetarian with eggs"]
    session_time: str
    current_level: Literal["beginner", "intermediate", "advanced"]


@dataclass
class Profile:
    name: str
    age: int
    body_profile: VarProfile

    def bmi(self) -> float:
        height_m = self.body_profile.height / 100
        return self.body_profile.weight / (height_m ** 2)


user = Profile(
    name="John Doe",
    age=30,
    body_profile=VarProfile(
        date=datetime.date.today(),
        height=175,
        weight=70,
        activity_level="moderately active",
        dietary_preferences="non-vegetarian",
        session_time="evening",
        current_level="intermediate",
    ),
)


def format_user_profile(u: Profile) -> str:
    bp = u.body_profile
    return (
        f"Name: {u.name}, age: {u.age}, "
        f"height_cm: {bp.height}, weight_kg: {bp.weight}, "
        f"activity_level: {bp.activity_level}, "
        f"dietary_preferences: {bp.dietary_preferences}, "
        f"session_time: {bp.session_time}, "
        f"fitness_level: {bp.current_level}, "
        f"bmi: {u.bmi():.1f}"
    )


# -----------------------------
# Featherless request helper
# -----------------------------
def chat_completion_request(messages, tools=None):
    if not API_KEY:
        raise ValueError("Missing FEATHERLESS_API_KEY in environment or .env file")

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}",
    }

    payload = {
        "model": MODEL,
        "messages": messages,
        "max_tokens": 4096,
    }

    if tools is not None:
        payload["tools"] = tools

    response = requests.post(API_URL, headers=headers, json=payload, timeout=120)
    response.raise_for_status()
    return response.json()


# -----------------------------
# MCP setup
# -----------------------------
async def get_mcp_tools():
    client = MultiServerMCPClient(
        {
            "opennutrition": {
                "transport": "stdio",
                "command": "node",
                "args": [
                    r"C:\Users\Sarthak\personal_projects\gym_bro\mcp-opennutrition\build\index.js"
                ],
            },
            "exercise_db": {
                "transport": "stdio",
                "command": "node",
                "args": [
                    r"C:\Users\Sarthak\personal_projects\gym_bro\mcp-freeexercisedb\free-exercise-mcp\build\index.js"
                ],
            },
        }
    )
    tools = await client.get_tools()
    return client, tools


MCP_TOOL_MAP: dict[str, Any] = {}


# -----------------------------
# Local functions exposed to Featherless
# These wrap MCP tools underneath
# -----------------------------
async def search_exercises(
    query: str,
    muscle: Optional[str] = None,
    equipment: Optional[str] = None,
    difficulty: Optional[str] = None,
    limit: int = 5,
) -> dict:
    tool = MCP_TOOL_MAP["search_exercises"]

    args = {"query": query, "limit": limit}
    if muscle:
        args["muscle"] = muscle
    if equipment:
        args["equipment"] = equipment
    if difficulty:
        args["difficulty"] = difficulty

    result = await tool.ainvoke(args)
    return {"ok": True, "result": result}


async def get_exercise(exercise_id: str) -> dict:
    tool = MCP_TOOL_MAP["get_exercise"]
    result = await tool.ainvoke({"id": exercise_id})
    return {"ok": True, "result": result}


async def list_exercises(limit: int = 10) -> dict:
    tool = MCP_TOOL_MAP["list_exercises"]
    result = await tool.ainvoke({"limit": limit})
    return {"ok": True, "result": result}


async def get_dataset_metadata() -> dict:
    tool = MCP_TOOL_MAP["get_dataset_metadata"]
    result = await tool.ainvoke({})
    return {"ok": True, "result": result}


async def search_food_by_name(name: str, limit: int = 5) -> dict:
    tool = MCP_TOOL_MAP["search-food-by-name"]
    result = await tool.ainvoke({"name": name, "limit": limit})
    return {"ok": True, "result": result}


async def get_food_by_id(food_id: str) -> dict:
    tool = MCP_TOOL_MAP["get-food-by-id"]
    result = await tool.ainvoke({"id": food_id})
    return {"ok": True, "result": result}


async def get_foods(limit: int = 10, page: int = 1) -> dict:
    tool = MCP_TOOL_MAP["get-foods"]
    result = await tool.ainvoke({"limit": limit, "page": page})
    return {"ok": True, "result": result}


async def get_food_by_ean13(ean13: str) -> dict:
    tool = MCP_TOOL_MAP["get-food-by-ean13"]
    result = await tool.ainvoke({"ean13": ean13})
    return {"ok": True, "result": result}


async def build_push_pull_outline(goal: str, days: int, current_level: str) -> dict:
    split = []
    if days >= 1:
        split.append({"day": 1, "focus": "push"})
    if days >= 2:
        split.append({"day": 2, "focus": "pull"})

    return {
        "ok": True,
        "result": {
            "goal": goal,
            "days": days,
            "current_level": current_level,
            "split": split,
        },
    }


AVAILABLE_FUNCTIONS = {
    "search_exercises": search_exercises,
    "get_exercise": get_exercise,
    "list_exercises": list_exercises,
    "get_dataset_metadata": get_dataset_metadata,
    "search_food_by_name": search_food_by_name,
    "get_food_by_id": get_food_by_id,
    "get_foods": get_foods,
    "get_food_by_ean13": get_food_by_ean13,
    "build_push_pull_outline": build_push_pull_outline,
}


# -----------------------------
# Featherless tool definitions
# -----------------------------
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_exercises",
            "description": (
                "Search the exercise database for exercises matching a user request. "
                "Use this for workout planning, muscle targeting, equipment filtering, "
                "difficulty filtering, and finding exercises that include image links."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Keyword search phrase such as 'push workout', 'lat pulldown', 'chest', or 'fat loss workout'"
                    },
                    "muscle": {
                        "type": "string",
                        "description": "Optional target muscle such as chest, back, shoulders, biceps, triceps, quadriceps, hamstrings, glutes, or abdominals"
                    },
                    "equipment": {
                        "type": "string",
                        "enum": [
                            "body only",
                            "barbell",
                            "dumbbell",
                            "kettlebells",
                            "machine",
                            "cable",
                            "bands",
                            "medicine ball",
                            "exercise ball",
                            "foam roll",
                            "e-z curl bar",
                            "other"
                        ],
                        "description": "Optional equipment preference"
                    },
                    "difficulty": {
                        "type": "string",
                        "enum": ["beginner", "intermediate", "advanced"],
                        "description": "Optional exercise difficulty level"
                    },
                    "limit": {
                        "type": "integer",
                        "minimum": 1,
                        "maximum": 10,
                        "description": "Maximum number of exercises to return"
                    }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_exercise",
            "description": (
                "Get complete details for one exercise by exercise ID, including instructions, muscles worked, equipment, and image links."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "exercise_id": {
                        "type": "string",
                        "description": "Exact exercise ID returned by the exercise database, such as 'push_up'"
                    }
                },
                "required": ["exercise_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "list_exercises",
            "description": "List exercises from the exercise database.",
            "parameters": {
                "type": "object",
                "properties": {
                    "limit": {
                        "type": "integer",
                        "minimum": 1,
                        "maximum": 25,
                        "description": "Maximum number of exercises to return"
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_dataset_metadata",
            "description": "Get metadata about the exercise dataset.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_food_by_name",
            "description": (
                "Search the food database by food name. Use this for meal ideas, calories, protein, fat loss foods, or post-workout foods."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "Food name to search for, such as oats, paneer, greek yogurt, tofu, chicken breast, or eggs"
                    },
                    "limit": {
                        "type": "integer",
                        "minimum": 1,
                        "maximum": 10,
                        "description": "Maximum number of foods to return"
                    }
                },
                "required": ["name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_food_by_id",
            "description": "Get detailed nutrition information for one food by food ID.",
            "parameters": {
                "type": "object",
                "properties": {
                    "food_id": {
                        "type": "string",
                        "description": "Exact food ID returned by the food search tool"
                    }
                },
                "required": ["food_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_foods",
            "description": "List foods from the food database.",
            "parameters": {
                "type": "object",
                "properties": {
                    "limit": {
                        "type": "integer",
                        "minimum": 1,
                        "maximum": 50,
                        "description": "Number of foods to return"
                    },
                    "page": {
                        "type": "integer",
                        "minimum": 1,
                        "description": "Pagination page number"
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_food_by_ean13",
            "description": "Look up a food item by EAN13 barcode.",
            "parameters": {
                "type": "object",
                "properties": {
                    "ean13": {
                        "type": "string",
                        "description": "EAN13 barcode string"
                    }
                },
                "required": ["ean13"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "build_push_pull_outline",
            "description": (
                "Create a high-level push/pull routine outline before selecting exercises."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "goal": {
                        "type": "string",
                        "description": "Primary training goal, such as fat loss, muscle gain, strength, or general fitness"
                    },
                    "days": {
                        "type": "integer",
                        "enum": [1, 2],
                        "description": "Number of days in the push/pull routine"
                    },
                    "current_level": {
                        "type": "string",
                        "enum": ["beginner", "intermediate", "advanced"],
                        "description": "User fitness level"
                    }
                },
                "required": ["goal", "days", "current_level"]
            }
        }
    }
]


# -----------------------------
# Function execution
# -----------------------------
async def execute_function_call(function_call: dict) -> dict:
    function_name = function_call["name"]
    raw_args = function_call.get("arguments", "{}")

    try:
        function_args = json.loads(raw_args) if isinstance(raw_args, str) else raw_args
    except json.JSONDecodeError as e:
        return {"error": f"Invalid JSON arguments for {function_name}: {str(e)}"}

    if function_name not in AVAILABLE_FUNCTIONS:
        return {"error": f"Function {function_name} not found"}

    try:
        result = await AVAILABLE_FUNCTIONS[function_name](**function_args)
        return result
    except TypeError as e:
        return {"error": f"Argument mismatch for {function_name}: {str(e)}"}
    except Exception as e:
        return {"error": f"Function {function_name} failed: {str(e)}"}


# -----------------------------
# Main conversation flow
# -----------------------------
async def run_conversation(user_query: str):
    client, mcp_tools = await get_mcp_tools()

    try:
        global MCP_TOOL_MAP
        MCP_TOOL_MAP = {tool.name: tool for tool in mcp_tools}

        print(f"Loaded {len(mcp_tools)} MCP tools")
        print("Tool names:", [tool.name for tool in mcp_tools])

        messages = [
            {
                "role": "system",
                "content": (
                    "You are a fitness and nutrition assistant. "
                    "Use tools whenever they improve accuracy. "
                    "For workout planning, use exercise tools first, then fetch specific exercise details. "
                    "For meals and macros, use nutrition tools. "
                    "When building a plan, combine exercise and food results into one clear answer. "
                    "Include exercise image links when available."
                ),
            },
            {
                "role": "user",
                "content": f"{format_user_profile(user)}. Request: {user_query}",
            },
        ]

        first_response = chat_completion_request(messages, tools=TOOLS)
        response_message = first_response["choices"][0]["message"]
        tool_calls = response_message.get("tool_calls")

        if tool_calls:
            messages.append(response_message)

            for tool_call in tool_calls:
                function_response = await execute_function_call(tool_call["function"])

                messages.append(
                    {
                        "tool_call_id": tool_call["id"],
                        "role": "tool",
                        "name": tool_call["function"]["name"],
                        "content": json.dumps(function_response),
                    }
                )

            second_response = chat_completion_request(messages)
            final_message = second_response["choices"][0]["message"]["content"]

            print("\nAssistant:\n")
            print(final_message)
        else:
            print("\nAssistant:\n")
            print(response_message.get("content", ""))

    finally:
        if hasattr(client, "close"):
            await client.close()


if __name__ == "__main__":
    query = " ".join(sys.argv[1:]).strip() or (
        "Build me a 2-day push/pull workout and suggest meals for fat loss. Include exercise image links."
    )
    asyncio.run(run_conversation(query))