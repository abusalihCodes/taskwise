# TaskWise 🧠

An AI-powered task manager built with the MERN stack.

## Live Demo
🔗 [taskwise-seven.vercel.app](https://taskwise-seven.vercel.app)

## Features
- 🔐 JWT Authentication (Register/Login)
- ✅ Full Task CRUD (Create, Read, Update, Delete)
- 🤖 AI Summarize powered by Groq LLM
- ✏️ Inline task editing
- 📊 Task completion counter
- 🔒 Protected routes
- 📱 Responsive dark UI

## Tech Stack
**Frontend:** React 18, Vite, Tailwind CSS, React Router  
**Backend:** Node.js, Express, MongoDB, Mongoose  
**Auth:** JWT, bcrypt  
**AI:** Groq API (Llama 3)  
**Deployment:** Vercel (frontend) + Render (backend)

## Getting Started

### Backend
```bash
cd server
npm install
# Add .env with MONGO_URI, JWT_SECRET, GROQ_API_KEY
npm run dev
```

### Frontend
```bash
cd client
npm install
# Add .env with VITE_API_URL=http://localhost:4000/api
npm run dev