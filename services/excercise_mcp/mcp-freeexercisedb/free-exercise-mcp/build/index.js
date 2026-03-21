#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
const DATASET_URL = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";
const IMAGE_BASE_URL = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";
const SOURCE_REPO_URL = "https://github.com/yuhonas/free-exercise-db";
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour
const muscles = [
    "abdominals",
    "abductors",
    "adductors",
    "biceps",
    "calves",
    "chest",
    "forearms",
    "glutes",
    "hamstrings",
    "lats",
    "lower back",
    "middle back",
    "neck",
    "quadriceps",
    "shoulders",
    "traps",
    "triceps",
];
const categories = [
    "powerlifting",
    "strength",
    "stretching",
    "cardio",
    "olympic weightlifting",
    "strongman",
    "plyometrics",
];
const levels = ["beginner", "intermediate", "expert"];
const equipmentOptions = [
    "medicine ball",
    "dumbbell",
    "body only",
    "bands",
    "kettlebells",
    "foam roll",
    "cable",
    "machine",
    "barbell",
    "exercise ball",
    "e-z curl bar",
    "other",
];
let cache = null;
function normalize(value) {
    return value.trim().toLowerCase();
}
function exerciseJsonUrl(id) {
    return `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${encodeURIComponent(id)}/${encodeURIComponent(id)}.json`;
}
function withImageLinks(exercise) {
    return {
        ...exercise,
        imageUrls: exercise.images.map((img) => `${IMAGE_BASE_URL}${img}`),
        sourceUrls: {
            json: exerciseJsonUrl(exercise.id),
            repo: `${SOURCE_REPO_URL}/blob/main/exercises/${encodeURIComponent(exercise.id)}/${encodeURIComponent(exercise.id)}.json`,
        },
    };
}
async function loadExercises() {
    const now = Date.now();
    if (cache && now - cache.loadedAt < CACHE_TTL_MS) {
        return cache.exercises;
    }
    const response = await fetch(DATASET_URL, {
        headers: {
            "User-Agent": "free-exercise-db-mcp/1.0.0",
            Accept: "application/json",
        },
    });
    if (!response.ok) {
        throw new Error(`Failed to fetch dataset: ${response.status} ${response.statusText}`);
    }
    const data = (await response.json());
    cache = {
        loadedAt: now,
        exercises: data,
    };
    return data;
}
function summarizeExercise(exercise) {
    return {
        id: exercise.id,
        name: exercise.name,
        level: exercise.level,
        category: exercise.category,
        equipment: exercise.equipment,
        force: exercise.force,
        mechanic: exercise.mechanic,
        primaryMuscles: exercise.primaryMuscles,
        secondaryMuscles: exercise.secondaryMuscles,
        imageUrls: exercise.imageUrls,
    };
}
function textResult(payload) {
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(payload, null, 2),
            },
        ],
    };
}
function findExercise(exercises, idOrName) {
    const key = normalize(idOrName);
    return exercises.find((exercise) => {
        return normalize(exercise.id) === key || normalize(exercise.name) === key;
    });
}
function matchesMuscle(exercise, muscle) {
    const target = normalize(muscle);
    return (exercise.primaryMuscles.some((m) => normalize(m) === target) ||
        exercise.secondaryMuscles.some((m) => normalize(m) === target));
}
function fullTextHaystack(exercise) {
    return [
        exercise.id,
        exercise.name,
        exercise.force ?? "",
        exercise.level,
        exercise.mechanic ?? "",
        exercise.equipment ?? "",
        exercise.category,
        ...exercise.primaryMuscles,
        ...exercise.secondaryMuscles,
        ...exercise.instructions,
    ]
        .join("\n")
        .toLowerCase();
}
const server = new McpServer({
    name: "free-exercise-db",
    version: "1.0.0",
});
server.registerTool("get_exercise", {
    description: "Get the full details for a single exercise from yuhonas/free-exercise-db, including direct image URLs.",
    inputSchema: {
        idOrName: z
            .string()
            .min(1)
            .describe("Exercise id or exact exercise name, for example 'Air_Bike' or 'Air Bike'"),
    },
}, async ({ idOrName }) => {
    const exercises = await loadExercises();
    const match = findExercise(exercises, idOrName);
    if (!match) {
        return textResult({
            error: `Exercise not found: ${idOrName}`,
            suggestion: "Use search_exercises to find likely matches first.",
        });
    }
    return textResult(withImageLinks(match));
});
server.registerTool("search_exercises", {
    description: "Search exercises by free text across name, id, muscles, equipment, category, and instructions. Returns image URLs too.",
    inputSchema: {
        query: z.string().min(1).describe("Search text, like 'hamstring stretch' or 'dumbbell curl'"),
        limit: z.number().int().min(1).max(50).default(10).describe("Max number of results to return"),
    },
}, async ({ query, limit }) => {
    const exercises = await loadExercises();
    const terms = normalize(query).split(/\s+/).filter(Boolean);
    const ranked = exercises
        .map((exercise) => {
        const haystack = fullTextHaystack(exercise);
        const score = terms.reduce((acc, term) => acc + (haystack.includes(term) ? 1 : 0), 0);
        const exactNameBonus = normalize(exercise.name) === normalize(query) ? 10 : 0;
        const exactIdBonus = normalize(exercise.id) === normalize(query) ? 10 : 0;
        return { exercise, score: score + exactNameBonus + exactIdBonus };
    })
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score || a.exercise.name.localeCompare(b.exercise.name))
        .slice(0, limit)
        .map(({ exercise }) => summarizeExercise(withImageLinks(exercise)));
    return textResult({
        query,
        count: ranked.length,
        results: ranked,
    });
});
server.registerTool("list_exercises", {
    description: "List exercises with optional structured filters. Useful for browsing by muscle group, level, equipment, or category.",
    inputSchema: {
        limit: z.number().int().min(1).max(100).default(25),
        offset: z.number().int().min(0).default(0),
        level: z.enum(levels).optional(),
        category: z.enum(categories).optional(),
        equipment: z.enum(equipmentOptions).optional(),
        muscle: z.enum(muscles).optional(),
    },
}, async ({ limit, offset, level, category, equipment, muscle }) => {
    const exercises = await loadExercises();
    const filtered = exercises.filter((exercise) => {
        if (level && exercise.level !== level)
            return false;
        if (category && exercise.category !== category)
            return false;
        if (equipment && exercise.equipment !== equipment)
            return false;
        if (muscle && !matchesMuscle(exercise, muscle))
            return false;
        return true;
    });
    const page = filtered
        .slice(offset, offset + limit)
        .map((exercise) => summarizeExercise(withImageLinks(exercise)));
    return textResult({
        total: filtered.length,
        offset,
        limit,
        filters: { level, category, equipment, muscle },
        results: page,
    });
});
server.registerTool("get_dataset_metadata", {
    description: "Get dataset metadata plus all allowed filter values for categories, levels, equipment, and muscles.",
    inputSchema: {},
}, async () => {
    const exercises = await loadExercises();
    return textResult({
        source: {
            repo: SOURCE_REPO_URL,
            datasetUrl: DATASET_URL,
            imageBaseUrl: IMAGE_BASE_URL,
        },
        totalExercises: exercises.length,
        allowedValues: {
            levels,
            categories,
            equipment: equipmentOptions,
            muscles,
        },
    });
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
main().catch((error) => {
    console.error("Fatal MCP server error:", error);
    process.exit(1);
});
