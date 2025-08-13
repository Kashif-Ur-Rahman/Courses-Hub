import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

import muxRouter from "./mux.js";
import paymentsRouter from "./payments.js"; // add .js if using ESM
import courseRoutes from "./routes/course.routes.js";
import authRoutes from "./routes/auth.js";


dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(cors({
    origin: "http://localhost:5173", // my frontend URL
    credentials: true, // allow sending cookies/credentials
}));
app.use(express.json());

// Routes
app.use("/api/mux", muxRouter);
app.use("/api/payments", paymentsRouter);


app.use("/courses", courseRoutes);
// Register auth routes
app.use("/api/auth", authRoutes);

// Get all users
app.get("/users", async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, name: true, email: true, createdAt: true }, // hide password
        });
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Something went wrong" });
    }
});

// Create a new user
app.post("/users", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: "Name, email, and password are required" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: { name, email, password: hashedPassword },
            select: { id: true, name: true, email: true, createdAt: true }, // hide password
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
