    require("dotenv").config();
    const express = require("express");
    const cors = require("cors");
    const mongoose = require("mongoose");
    

    const authRoutes = require("./routes/auth.js");
    const taskRoutes = require("./routes/tasks");
    const aiRoutes = require("./routes/ai");

    const app = express();

    const PORT = process.env.PORT || 4000;
    const MONGO_URI = process.env.MONGO_URI;

    const allowedOrigins = [
        "http://localhost:5173",
        "https://taskwise.vercel.app",
        /\.vercel\.app$/,
      ];

    app.use(
    cors({
        origin: allowedOrigins,
        credentials: true,
    })
    );
    app.use(express.json());

    app.use("/api/auth", authRoutes);
    app.use("/api/tasks", taskRoutes);
    app.use("/api/ai", aiRoutes);

    app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({ message: err.message || "Internal server error" });
    });
   

    async function startServer() {
    try {
        if (!MONGO_URI) {
        throw new Error("MONGO_URI is missing in .env");
        }

        await mongoose.connect(MONGO_URI);
        console.log("MongoDB connected");

        app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error.message);
        process.exit(1);
    }
    }

    startServer();
