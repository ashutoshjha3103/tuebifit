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
from pydantic import BaseModel, ConfigDict, ValidationError

load_dotenv()

API_URL = "https://api.featherless.ai/v1/chat/completions"
API_KEY = os.getenv("FEATHERLESS_API_KEY")
MODEL = os.getenv("FEATHERLESS_MODEL", "moonshotai/Kimi-K2-Thinking")
FORMAT_MODEL = os.getenv("FEATHERLESS_FORMAT_MODEL", "Qwen/Qwen3-32B")

TOOL_SOURCE_MAP = {
    "search_exercises": "exercise_db",
    "get_exercise": "exercise_db",
    "list_exercises": "exercise_db",
    "get_dataset_metadata": "exercise_db",
    "search_food_by_name": "opennutrition",
    "get_food_by_id": "opennutrition",
    "get_foods": "opennutrition",
    "get_food_by_ean13": "opennutrition",
}


class ProfilePayload(BaseModel):
    name: str
    age: int
    height_cm: int
    weight_kg: int
    activity_level: str
    dietary_preferences: str
    session_time: str
    fitness_level: str
    bmi: float


class ToolCallPayload(BaseModel):
    name: str
    arguments: Any


class ToolBucketPayload(BaseModel):
    calls: list[ToolCallPayload]
    raw: list[Any]


class ToolDataPayload(BaseModel):
    exercise_db: ToolBucketPayload
    opennutrition: ToolBucketPayload


class WorkoutPlanPayload(BaseModel):
    days: list[Any]
    notes: list[str]


class NutritionPlanPayload(BaseModel):
    daily_targets: dict[str, Any]
    meals: list[Any]
    notes: list[str]


class DashboardPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    query: str
    profile: ProfilePayload
    summary: str
    workout_plan: WorkoutPlanPayload
    nutrition_plan: NutritionPlanPayload
    recommendations: list[str]
    warnings: list[str]
    tool_data: ToolDataPayload
    raw_assistant_text: Optional[str] = None


DEFAULT_PROFILE: dict = {
    "name": "Ash",
    "age": 27,
    "height_cm": 180,
    "weight_kg": 82,
    "activity_level": "moderately active",
    "dietary_preferences": "non-vegetarian",
    "session_time": "1 hr 30 mins",
    "fitness_level": "beginner"
}
DEFAULT_PROFILE["bmi"] = DEFAULT_PROFILE["weight_kg"] / (DEFAULT_PROFILE["height_cm"] / 100) ** 2

def build_profile_payload(u: Optional["Profile"] = None) -> dict:
    if u is None:
        return dict(DEFAULT_PROFILE)
    return {
        "name": u.name,
        "age": u.age,
        "height_cm": u.body_profile.height,
        "weight_kg": u.body_profile.weight,
        "activity_level": u.body_profile.activity_level,
        "dietary_preferences": u.body_profile.dietary_preferences,
        "session_time": u.body_profile.session_time,
        "fitness_level": u.body_profile.current_level,
        "bmi": round(u.bmi(), 1),
    }


def empty_tool_data_payload() -> dict:
    return {
        "exercise_db": {"calls": [], "raw": []},
        "opennutrition": {"calls": [], "raw": []},
    }


def validate_payload(payload: dict) -> dict:
    validated = DashboardPayload.model_validate(payload)
    return validated.model_dump(mode="json")


def validate_or_fallback(
    payload: dict,
    user_query: str,
    tool_data: dict,
    warning: str,
    raw_assistant_text: Optional[str] = None,
) -> dict:
    try:
        return validate_payload(payload)
    except ValidationError as exc:
        fallback_payload = {
            "query": user_query,
            "profile": build_profile_payload(user),
            "summary": "Model output failed schema validation; using fallback envelope.",
            "workout_plan": {"days": [], "notes": []},
            "nutrition_plan": {"daily_targets": {}, "meals": [], "notes": []},
            "recommendations": [],
            "warnings": [warning, f"Schema validation error: {exc.errors()[0]['msg']}"],
            "tool_data": tool_data,
            "raw_assistant_text": raw_assistant_text,
        }
        return validate_payload(fallback_payload)


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
def chat_completion_request(
    messages,
    tools=None,
    tool_choice=None,
    max_tokens: int = 4096,
    model: str | None = None,
    temperature: float | None = None,
):
    if not API_KEY:
        raise ValueError("Missing FEATHERLESS_API_KEY in environment or .env file")

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}",
    }

    payload = {
        "model": model or MODEL,
        "messages": messages,
        "max_tokens": max_tokens,
    }

    if tools is not None:
        payload["tools"] = tools
    if tool_choice is not None:
        payload["tool_choice"] = tool_choice
    if temperature is not None:
        payload["temperature"] = temperature

    last_error = None
    for _ in range(2):
        try:
            response = requests.post(API_URL, headers=headers, json=payload, timeout=180)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as exc:
            last_error = exc

    raise RuntimeError(f"Featherless request failed after retry: {last_error}")


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
    # MCP server expects "query" instead of "name".
    result = await tool.ainvoke({"query": name, "limit": limit})
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


AVAILABLE_FUNCTIONS = {
    "search_exercises": search_exercises,
    "get_exercise": get_exercise,
    "list_exercises": list_exercises,
    "get_dataset_metadata": get_dataset_metadata,
    "search_food_by_name": search_food_by_name,
    "get_food_by_id": get_food_by_id,
    "get_foods": get_foods,
    "get_food_by_ean13": get_food_by_ean13,
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


RESPONSE_SCHEMA = (
    "Return ONLY valid JSON. No markdown fences. Schema: "
    '{"query":str, "profile":{}, "summary":str, '
    '"workout_plan":{"days":[{"day":int, "focus":str, '
    '"exercises":[{"name","id","sets","reps","rest","equipment",'
    '"primary_muscles","secondary_muscles","image_urls",'
    '"instructions","difficulty","category"}]}], "notes":[str]}, '
    '"nutrition_plan":{"daily_targets":{"calories","protein_g","carbs_g","fat_g"}, '
    '"meals":[{"name","type","foods":[{"name","amount","calories",'
    '"protein_g","carbs_g","fat_g","food_id"}],'
    '"total_calories","total_protein_g"}], "notes":[str]}, '
    '"recommendations":[str], "warnings":[str]}. '
    "Use tool data only. Keep exercises to 4-5 per day, meals to 3-4 total."
)

TOOL_CALL_SYSTEM_PROMPT = (
    "You are a fitness and nutrition assistant. "
    "You MUST call tools NOW. Do NOT write any text response. "
    "For workout requests: call search_exercises. "
    "For nutrition requests: call search_food_by_name. "
    "ALWAYS call at least one exercise tool AND one food tool in this turn. "
    "Do NOT generate a text answer -- ONLY make tool calls."
)

FORMAT_SYSTEM_PROMPT = (
    "You have all the tool results above. Now produce the final answer. "
    "Do NOT think or reason -- output the JSON immediately with no preamble. "
    "Be concise: 4-5 exercises per day, 3 meals, 1-sentence instructions. "
    f"{RESPONSE_SCHEMA}"
)

MAX_TOOL_ROUNDS = 1
MAX_TOOL_RESULT_CHARS = 2000


def truncate_tool_content(content: str) -> str:
    if len(content) <= MAX_TOOL_RESULT_CHARS:
        return content
    return content[:MAX_TOOL_RESULT_CHARS] + '... [truncated]"}'


def _extract_exercise_summary(raw: dict) -> list[dict]:
    """Pull only the fields the formatting LLM needs from exercise tool output."""
    items = []
    if not raw.get("ok"):
        return items
    for entry in raw.get("result", []):
        text = entry.get("text", "") if isinstance(entry, dict) else ""
        if not text:
            continue
        try:
            parsed = json.loads(text)
        except (json.JSONDecodeError, TypeError):
            continue
        for ex in parsed.get("results", [parsed] if "id" in parsed else []):
            items.append({
                "id": ex.get("id"),
                "name": ex.get("name"),
                "level": ex.get("level"),
                "category": ex.get("category"),
                "equipment": ex.get("equipment"),
                "force": ex.get("force"),
                "mechanic": ex.get("mechanic"),
                "primaryMuscles": ex.get("primaryMuscles", []),
                "secondaryMuscles": ex.get("secondaryMuscles", []),
                "imageUrls": ex.get("imageUrls", []),
            })
    return items


def _extract_food_summary(raw: dict) -> list[dict]:
    """Pull only the fields the formatting LLM needs from nutrition tool output."""
    items = []
    if not raw.get("ok"):
        return items
    for entry in raw.get("result", []):
        text = entry.get("text", "") if isinstance(entry, dict) else ""
        if not text:
            continue
        try:
            foods = json.loads(text)
        except (json.JSONDecodeError, TypeError):
            continue
        if isinstance(foods, dict):
            foods = [foods]
        for f in foods[:1]:
            n = f.get("nutrition_100g", {})
            items.append({
                "food_id": f.get("id"),
                "name": f.get("name"),
                "cal": n.get("calories"),
                "protein": n.get("protein"),
                "carbs": n.get("carbohydrates"),
                "fat": n.get("total_fat"),
                "fiber": n.get("dietary_fiber"),
            })
    return items


def build_compact_summary(tool_data: dict) -> str:
    """Build a small, structured summary for the formatting LLM."""
    exercises = []
    for raw in tool_data.get("exercise_db", {}).get("raw", []):
        exercises.extend(_extract_exercise_summary(raw))

    seen_ex = set()
    unique_exercises = []
    for ex in exercises:
        if ex["id"] not in seen_ex:
            seen_ex.add(ex["id"])
            unique_exercises.append(ex)

    foods = []
    for raw in tool_data.get("opennutrition", {}).get("raw", []):
        foods.extend(_extract_food_summary(raw))

    seen_fd = set()
    unique_foods = []
    for fd in foods:
        if fd["food_id"] not in seen_fd:
            seen_fd.add(fd["food_id"])
            unique_foods.append(fd)

    return json.dumps(
        {"exercises": unique_exercises[:12], "foods": unique_foods[:8]},
        separators=(",", ":"),
    )

    MAX_SUMMARY = 4000
    if len(summary) > MAX_SUMMARY:
        summary = json.dumps(
            {"exercises": unique_exercises[:4], "foods": unique_foods[:4]},
            separators=(",", ":"),
        )
    return summary


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
            {"role": "system", "content": TOOL_CALL_SYSTEM_PROMPT},
            {
                "role": "user",
                "content": f"{format_user_profile(user)}. Request: {user_query}",
            },
        ]

        collected_tool_data = empty_tool_data_payload()

        # --- Phase 1: multi-round tool calling ---
        for round_num in range(MAX_TOOL_ROUNDS):
            resp = chat_completion_request(
                messages,
                tools=TOOLS,
                tool_choice="auto",
            )
            msg = resp["choices"][0]["message"]
            tool_calls = msg.get("tool_calls")

            if not tool_calls:
                break

            messages.append(msg)

            for tc in tool_calls:
                fn_name = tc["function"]["name"]
                fn_args = tc["function"].get("arguments", "{}")
                print(f"  [round {round_num+1}] calling {fn_name}({fn_args})")

                fn_result = await execute_function_call(tc["function"])

                source = TOOL_SOURCE_MAP.get(fn_name, "local_planner")
                collected_tool_data[source]["calls"].append(
                    {"name": fn_name, "arguments": fn_args}
                )
                collected_tool_data[source]["raw"].append(fn_result)

                full_content = json.dumps(fn_result)
                messages.append(
                    {
                        "tool_call_id": tc["id"],
                        "role": "tool",
                        "name": fn_name,
                        "content": truncate_tool_content(full_content),
                    }
                )

        has_exercise_data = len(collected_tool_data["exercise_db"]["raw"]) > 0
        has_nutrition_data = len(collected_tool_data["opennutrition"]["raw"]) > 0
        print(f"Tool data collected: exercises={has_exercise_data}, nutrition={has_nutrition_data}")

        # --- Phase 2: fresh compact context for the formatting call ---
        compact = build_compact_summary(collected_tool_data)
        print(f"Compact summary size: {len(compact)} chars")

        format_messages = [
            {"role": "system", "content": FORMAT_SYSTEM_PROMPT},
            {
                "role": "user",
                "content": (
                    f"User profile: {format_user_profile(user)}\n"
                    f"User request: {user_query}\n\n"
                    f"Available data from tools:\n{compact}"
                ),
            },
        ]

        print(f"Formatting with model: {FORMAT_MODEL}")
        format_resp = chat_completion_request(
            format_messages,
            max_tokens=4096,
            model=FORMAT_MODEL,
            temperature=0,
        )
        raw_text = format_resp["choices"][0]["message"]["content"]

        import re
        cleaned = raw_text.strip()
        # Strip <think>...</think> blocks (Qwen3, reasoning models)
        cleaned = re.sub(r"<think>.*?</think>", "", cleaned, flags=re.DOTALL).strip()
        # Strip markdown code fences
        if cleaned.startswith("```"):
            first_nl = cleaned.index("\n")
            cleaned = cleaned[first_nl + 1 :]
        if cleaned.endswith("```"):
            cleaned = cleaned[: -3]
        cleaned = cleaned.strip()

        print("\nAssistant:\n")
        try:
            parsed = json.loads(cleaned)
            parsed["tool_data"] = collected_tool_data
            validated = validate_or_fallback(
                parsed,
                user_query=user_query,
                tool_data=collected_tool_data,
                warning="Model output failed schema validation.",
                raw_assistant_text=cleaned,
            )
            print(json.dumps(validated, indent=2))
        except json.JSONDecodeError:
            fallback_payload = {
                "query": user_query,
                "profile": build_profile_payload(user),
                "summary": "LLM returned non-JSON output; using fallback envelope.",
                "workout_plan": {"days": [], "notes": []},
                "nutrition_plan": {"daily_targets": {}, "meals": [], "notes": []},
                "recommendations": [],
                "warnings": ["Model output was not valid JSON."],
                "tool_data": collected_tool_data,
                "raw_assistant_text": raw_text,
            }
            validated = validate_payload(fallback_payload)
            print(json.dumps(validated, indent=2))

    finally:
        if hasattr(client, "close"):
            await client.close()


if __name__ == "__main__":
    query = " ".join(sys.argv[1:]).strip() or (
        "Build me a 2-day push/pull workout and suggest meals for fat loss. Include exercise image links."
    )
    asyncio.run(run_conversation(query))