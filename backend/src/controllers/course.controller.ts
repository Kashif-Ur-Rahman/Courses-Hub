import type { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get all courses
export const getCourses = async (req: Request, res: Response) => {
    try {
        const courses = await prisma.course.findMany({
            include: {
                instructor: true,
                enrollments: true,
                payments: true,
                purchases: true,
            },
        });
        res.json(courses);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch courses" });
    }
};

// Create a course
export const createCourse = async (req: Request, res: Response) => {
    const { title, price, instructorId } = req.body;
    if (!title || !price || !instructorId) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        // Check if instructor exists
        const instructor = await prisma.user.findUnique({
            where: { id: instructorId },
        });
        if (!instructor) {
            return res.status(400).json({ error: "Instructor does not exist" });
        }

        const course = await prisma.course.create({
            data: { title, price, instructorId },
        });

        res.json(course);
    } catch (err) {
        console.error("Create course error:", err);
        if (err instanceof Error) {
            res.status(500).json({ error: err.message });
        } else {
            res.status(500).json({ error: String(err) });
        }
    }
};

// Get a single course by ID
export const getCourseById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const course = await prisma.course.findUnique({
            where: { id: Number(id) },
            include: {
                instructor: true,
                enrollments: true,
                payments: true,
                purchases: true,
            },
        });
        if (!course) return res.status(404).json({ error: "Course not found" });
        res.json(course);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch course" });
    }
};


