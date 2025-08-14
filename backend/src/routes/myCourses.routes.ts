// routes/myCourses.routes.ts
import express from "express";
import authMiddleware from "../authMiddleware.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = express.Router();

// GET purchased courses for logged-in user
router.get("/my-courses", authMiddleware, async (req: any, res) => {
    try {
        const userId = req.user.id;

        // Fetch purchased courses using Prisma relations
        const purchasedCourses = await prisma.purchase.findMany({
            where: { userId },
            include: {
                course: true,
            },
        });


        // Format to match frontend's expected shape
        const formattedCourses = purchasedCourses.map((p: { course: any }) => ({
            id: p.course.id,
            title: p.course.title,
            description: p.course.description,
            thumbnail_url: p.course.thumbnail_url,
        }));


        res.json(formattedCourses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
