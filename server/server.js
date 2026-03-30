    require("dotenv").config();
    const express = require("express");
    const cors = require("cors");
    const mongoose = require("mongoose");
    const aiRoutes = require("./routes/ai");

    const authRoutes = require("./routes/auth.js");
    const taskRoutes = require("./routes/tasks");

    const app = express();

    const PORT = process.env.PORT || 4000;
    const MONGO_URI = process.env.MONGO_URI;

    app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true,
    })
    );
    app.use(express.json());

    app.use("/api/auth", authRoutes);
    app.use("/api/tasks", taskRoutes);

    app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({ message: err.message || "Internal server error" });
    });
    app.use("/api/ai", aiRoutes);

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
