---
marp: true
theme: default
paginate: true
backgroundColor: '#0a1929'
color: '#e3e8ef'
style: |
  section {
    background: #0a1929;
    color: #e3e8ef;
    font-family: system-ui, -apple-system, Segoe UI, sans-serif;
  }
  h1 { color: #00e676; font-weight: 800; border-bottom: 3px solid #009624; padding-bottom: 0.2em; }
  h2 { color: #00e676; font-size: 1.35em; }
  strong { color: #00e676; }
  ul { font-size: 0.92em; line-height: 1.45; }
  .muted { color: #94a3b8; font-size: 0.85em; }
  .big { font-size: 1.85em; font-weight: 800; color: #00e676; }
footer: 'TueBiFit · Cursor Hackathon 2026'
---

<!-- _class: lead -->
# TueBiFit
## AI workouts + nutrition + on-device rep tracking
<p class="muted">One mobile app · Real exercise & food data · Privacy-aware</p>

---

# 1 · The market problem

**Who:** Time-poor **fitness-focused consumers** (25–45) who want structure without a $80–150/hr coach.

| | |
|--:|--:|
| **Fitness app market (2025)** | **~$12B** |
| **AI personal-trainer segment (2025)** | **~$17B** |
| **App downloads (2024)** | **3.6B** |
| **Prioritize wellness** | **82%** |

**Today:** Generic plans, siloed apps (log food *here*, workouts *there*), **55%** worry about **data privacy**. Alternatives are expensive or shallow.

---

# 2 · Our solution

**One sentence:** TueBiFit is a **mobile-first** app where an **AI agent** builds **personalized** workout + meal plans using **real** exercise and nutrition databases (MCP), plus **on-device** rep counting from video.

**Why ~10× better**
- **Grounded outputs** — tools, not vibes-only chat
- **Stack in one place** — training + meals + form feedback
- **Rep analysis processed locally** — alignment with privacy concerns

---

# 3 · Business model

| | |
|--|--|
| **Who pays** | **Consumers** (B2C) → later **gyms / employers** (B2B2C) |
| **Price (hypothesis)** | **$12.99–19.99/mo** premium · **$4.99** starter |
| **Cost to serve** | Infra + LLM API **~$3–8/user/mo** at early scale → **target 70%+ gross margin** |

**Upside:** White-label for studios, API for wellness platforms.

---

# 4 · Go-to-market

**First 10 customers (specific)**
1. **50 DMs** — founders & operators in **YC / Indie Hackers / fitness Discords** with “AI + health” thesis  
2. **2 local gyms** — free pilot for **member retention** metrics  
3. **University** rec center / lifting club — **1** partnered pilot  

**Switching trigger:** “I get **one** plan that matches **my** equipment & diet, and **rep feedback** without sending video to the cloud.”

**Edge:** Demo day + **measurable waitlist** + **open** stack story for dev communities.

---

# 5 · Why us · Why now

**Team:** **2 builders** — shipped **end-to-end** (React, FastAPI, MCP, MediaPipe, Cloud Run) in **hackathon time**.

**Why now**
- **~50%** of fitness-app users engaging with **AI-powered** features (trend)  
- **Major financings** — e.g. **Zing Coach $10M**, **Ladder $15M+**, **EGYM $200M** — validates **AI + fitness** pull  

**Commitment:** **Yes** — we’d go **full-time** with **traction** (paying users or signed B2B pilots).
