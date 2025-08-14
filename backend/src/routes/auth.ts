import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../prismaClient.js"; 

const router = express.Router();

// POST /api/auth/register
router.post("/register", async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
        return res.status(400).json({ error: "All fields are required" });

    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser)
            return res.status(400).json({ error: "User already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: { name, email, password: hashedPassword },
        });

        const token = jwt.sign(
            { id: user.id, email: user.email, role: "user" },
            process.env.JWT_SECRET!,
            { expiresIn: "1h" }
        );


        return res.json({ user, token });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Server error" });
    }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password)
        return res.status(400).json({ error: "Email and password are required" });

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(400).json({ error: "Invalid credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

        // Generate JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, role: "user" },
            process.env.JWT_SECRET!,
            { expiresIn: "1h" }
        );

        return res.json({ user, token });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Server error" });
    }
});


export default router;
