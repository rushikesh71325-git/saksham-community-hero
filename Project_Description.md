# Saksham: The Civic Accountability Engine

**Problem Statement Selected:** Community Hero - Hyperlocal Problem Solver

## Solution Overview
Saksham is an intelligent, hyperlocal civic accountability engine designed to bridge the gap between citizens and municipal authorities. Instead of traditional, easily-ignored complaint portals, Saksham acts as a proactive ecosystem where citizens report issues and autonomous AI agents take over. Using advanced Gamification, Real-time WebSockets, and asynchronous BullMQ workers, the platform automatically validates reports, categorizes them, routes them to the exact municipal ward using PostGIS spatial routing, and transparently tracks their resolution on an immutable ledger. It transforms civic engagement from a frustrating chore into an engaging, community-driven experience.

## Key Features
- **Geo-Verified Reporting & Spatial Routing:** Citizens snap photos of issues, and our PostGIS integration mathematically calculates exactly which municipal ward the issue belongs to based on GPS coordinates.
- **Autonomous AI Triage:** Submitted issues are intercepted by background BullMQ workers that utilize Google Gemini to instantly classify the issue category (e.g., Road Infrastructure, Water & Sanitation) and assign a severity level.
- **Real-Time WebSockets:** The moment an issue is submitted or resolved, the frontend UI updates instantly without refreshing. Citizens receive real-time toast notifications for gamification XP.
- **Gamification Engine:** Citizens earn XP and level up (e.g., Level 1 to "Community Hero") for reporting issues, providing photo proof, and verifying community problems, incentivizing civic participation.
- **Community Consensus (Upvoting):** Users can validate issues reported by others. Trending issues automatically gain visibility on the Analytics Dashboard for municipal officers.
- **Immutable Timeline:** Every issue maintains an un-editable chronological ledger of events (from AI processing to officer assignment to final resolution), ensuring absolute transparency.
- **Analytics Dashboard:** A comprehensive view for authorities featuring interactive charts showing ward performance scores, issue category breakdowns, and a real-time citizen leaderboard.

## Technologies Used
- **Frontend:** React, TypeScript, Vite, React Router, Recharts, Lucide Icons (Glassmorphism Dark Mode UI)
- **Backend:** Node.js, Express, TypeScript, Socket.IO
- **Database & ORM:** PostgreSQL with PostGIS (for spatial geometries), Prisma ORM
- **Background Processing:** BullMQ, Redis (Upstash) for asynchronous task queues
- **Media Hosting:** Cloudinary
- **Security:** JWT Authentication, Helmet, CORS

## Google Technologies Utilized
- **Google Gemini (AI Studio):** We heavily integrated Gemini into our `ai.worker.ts` background agent. Instead of relying on manual triage, Gemini autonomously parses the natural language description of civic issues, analyzes the context, and outputs structured JSON determining both the precise `IssueCategory` and the `Severity` level. This allows authorities to instantly filter and prioritize critical infrastructure failures without human bottlenecking.
- **Google Cloud Platform (GCP):** The application is designed to be deployed and scaled on Google Cloud infrastructure.
