
import express from "express";
import prisma from "../prismaClient.js";
import authMiddleware from "../authMiddleware.js"; // verifies JWT
import { getCourses, createCourse, getCourseById } from "../controllers/course.controller.js";
import AWS from "aws-sdk";

const router = express.Router();

// AWS S3 config
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

// Helper function to generate signed URL
const getSignedUrl = (key: string) => {
    return s3.getSignedUrl("getObject", {
        Bucket: process.env.S3_BUCKET!,
        Key: key,
        Expires: 60 * 10, // URL valid for 10 minutes
    });
};

// Existing routes
router.get("/", getCourses);
router.post("/", createCourse);
router.get("/:id", getCourseById);

// New route: Get course materials for enrolled users
router.get("/:id/materials", authMiddleware, async (req, res) => {
    try {
        const courseId = Number(req.params.id);
        const userId = (req as any).user?.id;

        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        // Check if user is enrolled
        const enrollment = await prisma.enrollment.findFirst({
            where: { courseId, userId },
        });

        if (!enrollment)
            return res.status(403).json({ error: "You must purchase this course" });

        // Get all materials for the course
        const materials = await prisma.material.findMany({ where: { courseId } });

        // Convert S3 keys to signed URLs
        const materialsWithUrls = materials.map((m) => ({
            id: m.id,
            fileName: m.fileName,
            url: getSignedUrl(m.fileKey),
        }));

        res.json(materialsWithUrls);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

export default router;
