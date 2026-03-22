# ── Stage 1: Build frontend & MCP servers ────────────────────────────
FROM node:22-slim AS node-build

WORKDIR /build

# -- Frontend ----------------------------------------------------------
COPY frontend/package.json frontend/package-lock.json* frontend/
RUN cd frontend && npm ci

COPY frontend/ frontend/
COPY assets/*.mp4 frontend/public/videos/
RUN cd frontend && npm run build

# -- Exercise MCP server -----------------------------------------------
COPY services/excercise_mcp/ services/excercise_mcp/
RUN cd services/excercise_mcp/mcp-freeexercisedb/free-exercise-mcp \
    && npm ci && npm run build

# -- Nutrition MCP server -----------------------------------------------
COPY services/nutrition_mcp/ services/nutrition_mcp/
RUN cd services/nutrition_mcp/mcp-opennutrition \
    && npm ci && npm run build


# ── Stage 2: Python runtime ──────────────────────────────────────────
FROM python:3.12-slim

# Node.js is needed at runtime to spawn MCP servers via `node build/index.js`
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && apt-get purge -y curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Python deps
COPY services/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Python application code
COPY services/api_server.py services/featherless_demo.py ./

# Built frontend
COPY --from=node-build /build/frontend/dist /app/frontend/dist

# Built MCP servers (with their node_modules & data)
COPY --from=node-build /build/services/excercise_mcp /app/services/excercise_mcp
COPY --from=node-build /build/services/nutrition_mcp /app/services/nutrition_mcp

ENV DIST_DIR=/app/frontend/dist
ENV MCP_OPENNUTRITION_PATH=/app/services/nutrition_mcp/mcp-opennutrition/build/index.js
ENV MCP_EXERCISEDB_PATH=/app/services/excercise_mcp/mcp-freeexercisedb/free-exercise-mcp/build/index.js
ENV PORT=8080

EXPOSE ${PORT}

CMD ["sh", "-c", "uvicorn api_server:app --host 0.0.0.0 --port ${PORT}"]
