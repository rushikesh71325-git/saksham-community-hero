# Saksham: Community Hero - Hyperlocal Problem Solver

## 1. Problem Statement Selected
**Community Hero - Hyperlocal Problem Solver**

Communities frequently face issues such as potholes, water leakages, damaged streetlights, and public infrastructure challenges. The existing process of reporting these issues is highly fragmented, difficult to track, completely lacks transparency, and provides no incentive for citizens to participate. Municipal authorities are often overwhelmed by duplicate complaints and lack the intelligent triage needed to prioritize critical infrastructure failures.

## 2. Solution Overview
**Saksham** (meaning "Capable/Competent") is a proactive, AI-driven civic accountability engine that completely reinvents how communities and municipal corporations interact. 

Moving beyond traditional "passive" complaint portals, Saksham functions as a live, self-organizing ecosystem. When a citizen submits a photo of a civic issue, Saksham’s autonomous AI and GIS workers instantly validate, categorize, and spatially route the issue to the exact municipal ward responsible. By combining **Google Gemini** for intelligent triage, **PostGIS** for spatial routing, and **Gamification** to reward civic participation, Saksham transforms urban maintenance from a frustrating chore into an engaging, accountable, and highly transparent community effort.

## 3. Key Features
* **🤖 Autonomous AI Triage (Google Gemini):** Instead of relying on manual sorting, Saksham uses a background AI agent powered by Gemini to analyze the citizen's natural language description. It autonomously categorizes the problem (e.g., *Road Infrastructure*, *Water & Sanitation*) and assigns a real-time *Severity Level* (CRITICAL, HIGH, MEDIUM, LOW), allowing authorities to immediately prioritize dangerous hazards.
* **🗺️ Spatial GIS Routing (PostGIS):** Saksham eliminates the confusion of "who is responsible for this street?" When a report is submitted, the GIS engine uses advanced spatial mathematics (ST_Contains) to evaluate the GPS coordinates against complex municipal ward polygons, instantly routing the issue to the correct local administrator.
* **🎮 Gamification & Citizen Engagement:** To encourage participation, Saksham incorporates a dynamic RPG-style gamification engine. Citizens earn XP and "Level Up" (e.g., from *Rookie Reporter* to *Community Hero*) for submitting valid reports, providing photo evidence, and verifying community problems.
* **⚡ Real-Time Ecosystem (WebSockets):** Using Socket.IO, the platform is completely live. The moment an AI agent finishes processing a report, or an officer updates a status, the citizen's dashboard updates instantly without requiring a page refresh, fostering a sense of immediate impact.
* **🤝 Community Consensus (Upvoting):** Citizens can view and upvote issues in their neighborhood on a live community feed. High-impact trending issues automatically gain increased visibility on the municipal dashboard.
* **📊 Analytics & Command Center:** A comprehensive, glassmorphism-styled dashboard for municipal authorities featuring interactive Recharts. It displays ward performance scores, real-time issue breakdowns, and a live citizen leaderboard to track community engagement.
* **🔗 Immutable Timeline:** Every issue maintains an un-editable, chronological ledger of events—from AI processing to officer assignment to final resolution—ensuring absolute transparency and accountability.

## 4. Technologies Used
Saksham is built using a modern, scalable, and robust tech stack:

* **Frontend:** 
  * **React & TypeScript:** For a robust, type-safe user interface.
  * **Vite:** For ultra-fast module bundling and hot-reloading.
  * **Recharts:** For rendering dynamic municipal analytics.
  * **CSS Modules (Vanilla CSS):** Custom-built, premium glassmorphism dark-mode aesthetics.
* **Backend:** 
  * **Node.js & Express:** High-performance REST API.
  * **Socket.IO:** For bi-directional, real-time event streaming.
* **Database & ORM:** 
  * **PostgreSQL:** Primary relational database.
  * **PostGIS Extension:** For advanced spatial queries and geographical geometry math.
  * **Prisma ORM:** For type-safe database migrations and queries.
* **Asynchronous Agents & Queueing:** 
  * **BullMQ:** For managing robust background job queues.
  * **Redis (Upstash):** In-memory data structure store used to back the BullMQ workers.
* **Media & Cloud:** 
  * **Cloudinary:** For secure, scalable cloud storage of citizen-uploaded proof photos.
  * **Google Cloud Platform (GCP):** For final production deployment and hosting.

## 5. Google Technologies Utilized
Saksham heavily leverages Google technologies to achieve its "Agentic Depth" and intelligent automation:

* **Google Gemini API (AI Studio):** We integrated `gemini-1.5-pro` as the core brain of our autonomous `ai.worker.ts` background agent. Instead of simply acting as a chatbot, Gemini functions as a decision-making engine. It receives the raw context of a civic issue, analyzes the potential public impact, and outputs structured JSON strictly defining the `IssueCategory` and `Severity`. This allows Saksham to proactively escalate critical issues (like open manholes) over minor issues (like graffiti), drastically reducing the administrative burden on municipal officers.
* **Google Cloud Deployment:** The architecture is designed to be fully deployable on Google Cloud, utilizing scalable cloud environments to handle high-traffic civic reporting.
