# Saksham: The Civic Accountability Engine 🏛️

![Saksham Banner](https://img.shields.io/badge/Status-Hackathon_Ready-success?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Tech_Stack-React_|_Node.js_|_PostGIS_|_Gemini-blue?style=for-the-badge)

Saksham is an intelligent, hyperlocal civic accountability engine designed to bridge the gap between citizens and municipal authorities. Built for the **Community Hero - Hyperlocal Problem Solver** hackathon challenge.

## 🌟 Key Features

* **🤖 Autonomous AI Triage:** Integrated with **Google Gemini**, Saksham autonomously parses civic issue descriptions, instantly classifying the category and severity level so authorities can prioritize critical infrastructure failures.
* **🗺️ Spatial GIS Routing:** Built on **PostgreSQL + PostGIS**. When a citizen snaps a photo, our spatial engine mathematically calculates exactly which municipal ward polygon the GPS coordinates fall inside.
* **⚡ Real-Time Ecosystem:** Powered by **Socket.IO**. The frontend UI updates instantly when issues are resolved.
* **🎮 Gamification Engine:** Citizens earn XP and level up for reporting issues and providing photo proof, transforming civic engagement into a rewarding experience.
* **⚙️ Asynchronous Workers:** Uses **BullMQ** and **Redis** to offload AI processing, media uploads (Cloudinary), and GIS math to background agents, keeping the citizen API response times under 500ms.
* **📊 Analytics Dashboard:** Interactive real-time charts displaying ward performance scores, issue breakdowns, and a community leaderboard.

## 🚀 Quick Start Guide

### Prerequisites
* Node.js (v18+)
* PostgreSQL (with PostGIS extension)
* Redis (Local or Upstash)
* Google Gemini API Key
* Cloudinary API Keys

### 1. Database Setup
Ensure PostgreSQL is running and the PostGIS extension is enabled. 
Update your `.env` file in the `backend/` directory with your `DATABASE_URL`.

### 2. Backend Setup
```bash
cd backend
npm install

# Push the Prisma Schema to your database
npx prisma db push

# Seed the database with the required Spatial Wards (Downtown & Uptown)
npx ts-node src/scripts/seedWards.ts

# Start the background workers and API server
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install

# Start the Vite development server
npm run dev
```

## 🏗️ Architecture
* **Frontend:** React, TypeScript, Vite, Recharts, CSS Modules
* **Backend:** Express, Node.js, TypeScript, Socket.IO
* **Database:** PostgreSQL (PostGIS), Prisma ORM
* **Queues:** BullMQ + Redis
* **AI Integration:** Google Gemini API
* **Cloud Storage:** Cloudinary

## 📝 Submission Details
This project was developed for the **BlockseBlock Hackathon**. 
Please refer to `Project_Description.md` for the official Google Doc submission content.
