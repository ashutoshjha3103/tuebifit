import datetime
import json
import logging
import os
from logging.handlers import RotatingFileHandler
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from featherless_demo import (
    Profile,
    VarProfile,
    run_conversation,
    build_profile_payload,
)

LOG_DIR = os.path.join(os.path.dirname(__file__), "logs")
os.makedirs(LOG_DIR, exist_ok=True)

logger = logging.getLogger("tuebifit")
logger.setLevel(logging.DEBUG)

file_handler = RotatingFileHandler(
    os.path.join(LOG_DIR, "api_server.log"),
    maxBytes=10 * 1024 * 1024,
    backupCount=5,
    encoding="utf-8",
)
file_handler.setLevel(logging.DEBUG)
file_handler.setFormatter(logging.Formatter(
    "%(asctime)s | %(levelname)-8s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
))
logger.addHandler(file_handler)

console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)
console_handler.setFormatter(logging.Formatter(
    "%(asctime)s | %(levelname)-8s | %(message)s",
    datefmt="%H:%M:%S",
))
logger.addHandler(console_handler)

app = FastAPI(title="TueBiFit API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class GeneratePlanRequest(BaseModel):
    name: str
    age: int
    weight: float
    height: float
    fitness_level: str
    dietary_preferences: str
    activity_level: str
    allergies: Optional[str] = ""
    preferred_duration_hrs: int = 1
    preferred_duration_mins: int = 0
    query: Optional[str] = None


def _build_profile(req: GeneratePlanRequest) -> Profile:
    session_time = f"{req.preferred_duration_hrs} hr {req.preferred_duration_mins} mins"

    activity_map = {
        "sedentary": "not at all",
        "lightly active": "lightly active",
        "very active": "very active",
    }
    diet_map = {
        "vegan": "vegan",
        "vegetarian": "vegetarian",
        "no restrictions": "non-vegetarian",
    }
    level_map = {
        "beginner": "beginner",
        "amateur": "intermediate",
        "professional": "advanced",
    }

    return Profile(
        name=req.name,
        age=req.age,
        body_profile=VarProfile(
            date=datetime.date.today(),
            height=int(req.height),
            weight=int(req.weight),
            activity_level=activity_map.get(req.activity_level, "moderately active"),
            dietary_preferences=diet_map.get(req.dietary_preferences, "non-vegetarian"),
            session_time=session_time,
            current_level=level_map.get(req.fitness_level, "beginner"),
        ),
    )


def _build_query(req: GeneratePlanRequest) -> str:
    if req.query:
        return req.query

    parts = [
        f"Build me a 7-day workout plan and meal plan.",
        f"I am a {req.fitness_level} with {req.activity_level} lifestyle.",
        f"Diet: {req.dietary_preferences}.",
    ]
    if req.allergies:
        parts.append(f"Allergies: {req.allergies}. Avoid these foods.")
    parts.append(
        f"Session duration: {req.preferred_duration_hrs}h {req.preferred_duration_mins}m."
    )
    parts.append("Include exercise image links. Suggest meals for my goals.")
    return " ".join(parts)


def _log_result(req: GeneratePlanRequest, query: str, result: dict):
    """Write the full request/response to a timestamped JSON log file for review."""
    ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    log_file = os.path.join(LOG_DIR, f"plan_{ts}_{req.name}.json")

    entry = {
        "timestamp": datetime.datetime.now().isoformat(),
        "request": req.model_dump(),
        "query_sent": query,
        "response": {
            "summary": result.get("summary"),
            "profile": result.get("profile"),
            "workout_days": len(result.get("workout_plan", {}).get("days", [])),
            "nutrition_meals": len(result.get("nutrition_plan", {}).get("meals", [])),
            "recommendations": result.get("recommendations"),
            "warnings": result.get("warnings"),
        },
        "full_response": result,
    }

    with open(log_file, "w", encoding="utf-8") as f:
        json.dump(entry, f, indent=2, ensure_ascii=False)

    logger.info(f"Full response saved to {log_file}")


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/api/generate-plan")
async def generate_plan(req: GeneratePlanRequest):
    try:
        profile = _build_profile(req)
        query = _build_query(req)

        logger.info(f"=== New plan request from '{req.name}' ===")
        logger.info(f"Profile: age={req.age}, weight={req.weight}, height={req.height}, "
                     f"fitness={req.fitness_level}, diet={req.dietary_preferences}, "
                     f"activity={req.activity_level}")
        logger.info(f"Query: {query}")
        logger.debug(f"Full request payload: {req.model_dump_json()}")

        result = await run_conversation(query, profile_override=profile)

        workout_days = len(result.get("workout_plan", {}).get("days", []))
        nutrition_meals = len(result.get("nutrition_plan", {}).get("meals", []))
        warnings = result.get("warnings", [])

        logger.info(f"Plan generated: {workout_days} workout days, {nutrition_meals} meals")
        if warnings:
            logger.warning(f"Warnings: {warnings}")
        logger.info(f"Summary: {result.get('summary', 'N/A')[:120]}")

        _log_result(req, query, result)

        return result
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Plan generation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Plan generation failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    logger.info("Starting TueBiFit API server on port 8001")
    uvicorn.run(app, host="0.0.0.0", port=8001, reload=False)
