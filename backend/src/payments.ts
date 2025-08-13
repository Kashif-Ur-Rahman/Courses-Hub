// backend/src/routes/payments.ts
import express from "express";
import type { Request, Response } from "express";
import Stripe from "stripe";
import prisma from "./prismaClient.js";
import authMiddleware from "./authMiddleware.js";
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

// Ensure required env vars are present
if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error("Stripe keys are missing in environment variables");
}

// Don't specify apiVersion — use account default to avoid type mismatch errors
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

const router = express.Router();
/**
 * GET /api/payments/checkout/create-session
 * This route is used to create a Stripe checkout session for course purchase.
 */
/**
 * POST /api/payments/checkout/create-session
 */
router.post(
    "/checkout/create-session",
    authMiddleware,
    async (req: Request, res: Response) => {
        try {
            const { courseId } = req.body;
            const userId = (req as any).user?.id;

            if (!userId) return res.status(401).json({ error: "Unauthorized" });

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
                return res
                    .status(500)
                    .json({ error: "Failed to create checkout session" });
            }

            return res.json({ url: session.url });
        } catch (err) {
            console.error("Error creating checkout session:", err);
            return res.status(500).json({ error: "Internal server error" });
        }
    }
);

router.get('/verify-session/:sessionId', async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);

        if (session.payment_status === 'paid') {
            // TODO: Add course to user in DB here
            return res.json({ success: true });
        } else {
            return res.status(400).json({ success: false, message: 'Payment not completed' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * Stripe webhook - must use express.raw() for this route
 */
router.post('/webhooks/stripe',
    bodyParser.raw({ type: 'application/json' }),
    (req, res) => {
        const sig = req.headers['stripe-signature'];

        if (typeof sig !== 'string') {
            console.error('⚠️  Stripe signature header missing or invalid.');
            return res.sendStatus(400);
        }

        let event;
        try {
            event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
        } catch (err) {
            if (err instanceof Error) {
                console.error('⚠️  Webhook signature verification failed.', err.message);
            } else {
                console.error('⚠️  Webhook signature verification failed.', err);
            }
            return res.sendStatus(400);
        }

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            console.log('✅ Payment was successful!', session);
            // TODO: add course to user's account in DB here
        }

        res.status(200).send();
    }
);


export default router;
