// backend/src/payments.ts
import express from "express";
import type { Request, Response } from "express";
import Stripe from "stripe";
import prisma from "./prismaClient.js";
import authMiddleware from "./authMiddleware.js";

if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error("Stripe keys are missing in environment variables");
}

// Use account's default API version to avoid type mismatches
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

const router = express.Router();

/**
 * POST /api/payments/checkout/create-session
 * Creates a Stripe checkout session for a course.
 */
router.post(
    "/checkout/create-session",
    authMiddleware,
    async (req: Request, res: Response) => {
        try {
            const { courseId } = req.body as { courseId?: number };
            const userId = (req as any).user?.id as number | undefined;

            if (!userId) return res.status(401).json({ error: "Unauthorized" });
            if (!courseId) return res.status(400).json({ error: "courseId is required" });

            const course = await prisma.course.findUnique({
                where: { id: Number(courseId) },
            });
            if (!course) return res.status(404).json({ error: "Course not found" });

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ["card"],
                line_items: [
                    {
                        price_data: {
                            currency: "usd",
                            product_data: { name: course.title },
                            unit_amount: Math.round(course.price * 100),
                        },
                        quantity: 1,
                    },
                ],
                mode: "payment",
                success_url: `${process.env.APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${process.env.APP_URL}/courses/${courseId}`,
                metadata: {
                    courseId: String(courseId),
                    userId: String(userId),
                },
            });

            if (!session.url) {
                return res.status(500).json({ error: "Failed to create checkout session" });
            }
            return res.json({ url: session.url });
        } catch (err) {
            console.error("Error creating checkout session:", err);
            return res.status(500).json({ error: "Internal server error" });
        }
    }
);

/**
 * Helper: record payment + enrollment in DB
 */
async function grantAccessFromSession(session: Stripe.Checkout.Session) {
    const courseId = Number(session.metadata?.courseId);
    const userId = Number(session.metadata?.userId);

    if (!courseId || !userId) {
        console.error("Missing courseId or userId in session metadata");
        return;
    }

    // Create Payment row
    try {
        await prisma.payment.create({
            data: {
                stripeSession: session.id,
                userId,
                courseId,
                amountCents: Number(session.amount_total ?? 0),
                currency: (session.currency ?? "usd").toUpperCase(),
                status: session.payment_status ?? "paid",
            },
        });
    } catch (e) {
        // avoid fatal if duplicate (e.g., rerun)
        console.warn("Payment row might already exist. Continuing…", e);
    }

    // Ensure Enrollment exists
    const existing = await prisma.enrollment.findFirst({ where: { userId, courseId } });
    if (!existing) {
        await prisma.enrollment.create({ data: { userId, courseId } });
        console.log(`✅ Enrolled user ${userId} to course ${courseId}`);
    }
}

/**
 * GET /api/payments/verify-session/:sessionId
 * (Dev helper) If paid, writes to DB as fallback to webhook.
 */
router.get("/verify-session/:sessionId", async (req: Request, res: Response) => {
    try {
        const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);

        if (session.payment_status === "paid") {
            await grantAccessFromSession(session);
            return res.json({ success: true });
        }
        return res.status(400).json({ success: false, message: "Payment not completed" });
    } catch (err) {
        console.error("verify-session error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

/**
 * POST /api/payments/webhooks/stripe
 * NOTE: In server.ts we skip express.json() for this path so req.body is raw.
 */
router.post("/webhooks/stripe", async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"];
    if (typeof sig !== "string") {
        console.error("Stripe signature header missing or invalid.");
        return res.sendStatus(400);
    }

    let event: Stripe.Event;
    try {
        // req.body is a Buffer because server.ts doesn't JSON-parse this path
        event = stripe.webhooks.constructEvent(
            req.body as any, // raw Buffer
            sig,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err) {
        console.error("⚠️  Webhook signature verification failed.", err);
        return res.sendStatus(400);
    }

    try {
        if (event.type === "checkout.session.completed") {
            const session = event.data.object as Stripe.Checkout.Session;
            console.log("✅ checkout.session.completed:", session.id);
            await grantAccessFromSession(session);
        }
        // You can handle other event types here if needed.

        // Respond quickly to Stripe
        res.status(200).send();
    } catch (err) {
        console.error("Webhook handler error:", err);
        // Respond 200 to avoid retries during dev; log error for investigation.
        res.status(200).send();
    }
});

/**
 * GET /api/payments/my-courses
 * Returns enrolled courses for the current user (for “Purchased Courses” page).
 */
router.get("/my-courses", authMiddleware, async (req: Request, res: Response) => {
    const userId = (req as any).user?.id as number;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const enrollments = await prisma.enrollment.findMany({
        where: { userId },
        include: { course: { include: { instructor: { select: { id: true, name: true } } } } },
        orderBy: { createdAt: "desc" },
    });

    const courses = enrollments.map((e) => e.course);
    res.json(courses);
});


export default router;
