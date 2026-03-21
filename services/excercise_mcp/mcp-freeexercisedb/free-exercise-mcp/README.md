# Free Exercise DB MCP Server

A small TypeScript MCP server that exposes the exercise data from [`yuhonas/free-exercise-db`](https://github.com/yuhonas/free-exercise-db), including direct image links for each exercise.

## What it does

This server fetches the combined dataset from:

- `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json`

And converts each relative image path into a direct raw GitHub image URL using:

- `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/`

## Tools

### `get_exercise`
Get the full details for one exercise by id or exact name.

Example input:

```json
{
  "idOrName": "Air Bike"
}
```

### `search_exercises`
Free-text search across names, ids, muscles, equipment, category, and instructions.

Example input:

```json
{
  "query": "hamstring stretch",
  "limit": 5
}
```

### `list_exercises`
Filter and page through exercises.

Example input:

```json
{
  "muscle": "biceps",
  "equipment": "dumbbell",
  "level": "beginner",
  "limit": 10,
  "offset": 0
}
```

### `get_dataset_metadata`
Returns the dataset source info, total exercise count, and all allowed filter values.

## Setup

```bash
npm install
npm run build
```

## Run locally

```bash
npm start
```

Or during development:

```bash
npm run dev
```

## Claude Desktop config example

Add something like this to your MCP config:

```json
{
  "mcpServers": {
    "free-exercise-db": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/free-exercise-mcp/build/index.js"]
    }
  }
}
```

If you prefer running from source with `tsx`:

```json
{
  "mcpServers": {
    "free-exercise-db": {
      "command": "npx",
      "args": ["tsx", "/ABSOLUTE/PATH/TO/free-exercise-mcp/src/index.ts"]
    }
  }
}
```

## Notes

- The server caches the dataset in memory for 1 hour.
- Every returned exercise includes `imageUrls`, which are full direct links.
- The upstream dataset is public domain / Unlicense in the source repository.
