// server.ts
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import bodyParser from "body-parser";

import muxRouter from "./mux.js";
import paymentsRouter from "./payments.js";
import courseRoutes from "./routes/course.routes.js";
import authRoutes from "./routes/auth.js";
import myCoursesRoutes from "./routes/myCourses.routes.js";

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true,
    })
);

/**
 * IMPORTANT: Stripe webhook needs the raw body.
 * We add a guard that skips express.json() ONLY for that one path.
 */
app.use((req, res, next) => {
    if (req.originalUrl === "/api/payments/webhooks/stripe") {
        // let payments router handle raw body itself
        return next();
    }
    return express.json()(req, res, next);
});

// Routes
app.use("/api/mux", muxRouter);
app.use("/api/payments", paymentsRouter); // includes the webhook + JSON routes

app.use("/courses", courseRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", myCoursesRoutes);

// Users (unchanged)
app.get("/users", async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, name: true, email: true, createdAt: true },
        });
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Something went wrong" });
    }
});

app.post("/users", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: "Name, email, and password are required" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await prisma.user.create({
            data: { name, email, password: hashedPassword },
            select: { id: true, name: true, email: true, createdAt: true },
        });
        res.json(newUser);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to create user" });
    }
});

const PORT = process.env.PORT ?? 5000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
