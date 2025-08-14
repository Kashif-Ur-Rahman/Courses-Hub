// backend/src/mux.ts
import express, { type Request, type Response, type NextFunction } from "express";
import Mux from "@mux/mux-node";
import { generateSignedPlaybackToken } from "./utils/muxUtils.js";
import prisma from "./prismaClient.js";
import authMiddleware from "./authMiddleware.js";
import type { AuthenticatedRequest } from "./authMiddleware.js";

if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
    throw new Error("MUX_TOKEN_ID / MUX_TOKEN_SECRET missing");
}

const mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID!,
    tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

const router = express.Router();

// --- helpers ---
const hasSignedPlayback = !!(process.env.MUX_SIGNING_KEY_ID && process.env.MUX_SIGNING_KEY_PRIVATE);
const SIGNING_KEY_ID = process.env.MUX_SIGNING_KEY_ID!;
const SIGNING_KEY_PRIVATE = process.env.MUX_SIGNING_KEY_PRIVATE!;

function requireInstructor(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    if (!req.user || req.user.role !== "instructor") {
        return res.status(403).json({ error: "Instructor access only" });
    }
    next();
}

/**
 * POST /api/mux/courses/:id/live
 */
router.post(
    "/courses/:id/live",
    authMiddleware,
    requireInstructor,
    async (req: AuthenticatedRequest, res: Response) => {
        try {
            const courseId = Number(req.params.id);
            const userId = req.user!.id;

            const course = await prisma.course.findUnique({ where: { id: courseId } });
            if (!course) return res.status(404).json({ error: "Course not found" });
            if (course.instructorId !== userId) return res.status(403).json({ error: "Not your course" });

            const existing = await prisma.liveStream.findUnique({ where: { courseId } });
            if (existing?.muxStreamId && existing.muxPlaybackId) {
                return res.json({
                    reused: true,
                    ingestUrl: "rtmps://global-live.mux.com:443/app",
                    streamKey: "(hidden for security — fetch from Mux if needed)",
                    playbackId: existing.muxPlaybackId,
                    playbackPolicy: hasSignedPlayback ? "signed" : "public",
                });
            }

            const live = await mux.video.liveStreams.create({
                playback_policy: hasSignedPlayback ? ["signed"] : ["public"],
                new_asset_settings: { playback_policy: hasSignedPlayback ? ["signed"] : ["public"] },
                latency_mode: "low",
                reconnect_window: 60,
            });

            await prisma.liveStream.upsert({
                where: { courseId },
                create: {
                    courseId,
                    muxStreamId: live.id,
                    muxPlaybackId: live.playback_ids?.[0]?.id ?? "",
                    status: live.status ?? "idle",
                },
                update: {
                    muxStreamId: live.id,
                    muxPlaybackId: live.playback_ids?.[0]?.id ?? "",
                    status: live.status ?? "idle",
                },
            });

            return res.json({
                ingestUrl: "rtmps://global-live.mux.com:443/app",
                streamKey: live.stream_key,
                playbackId: live.playback_ids?.[0]?.id,
                playbackPolicy: hasSignedPlayback ? "signed" : "public",
            });
        } catch (err) {
            console.error("Error creating live stream:", err);
            return res.status(500).json({ error: "Internal server error" });
        }
    }
);

/**
 * GET /api/mux/courses/:id/status
 */
router.get(
    "/courses/:id/status",
    authMiddleware,
    async (req: AuthenticatedRequest, res: Response) => {
        try {
            const courseId = Number(req.params.id);
            const live = await prisma.liveStream.findUnique({ where: { courseId } });
            if (!live) return res.status(404).json({ error: "No live stream for this course" });

            const info = await mux.video.liveStreams.retrieve(live.muxStreamId);
            if (info?.status && info.status !== live.status) {
                await prisma.liveStream.update({
                    where: { courseId },
                    data: { status: info.status },
                });
            }

            return res.json({
                status: info.status,
                isActive: info.status === "active",
                playbackId: live.muxPlaybackId,
            });
        } catch (err) {
            console.error("Error fetching live status:", err);
            return res.status(500).json({ error: "Internal server error" });
        }
    }
);

/**
 * GET /api/mux/courses/:id/join
 */
router.get(
    "/courses/:id/join",
    authMiddleware,
    async (req: AuthenticatedRequest, res: Response) => {
        try {
            const courseId = Number(req.params.id);
            const userId = req.user!.id;

            const enrollment = await prisma.enrollment.findFirst({ where: { userId, courseId } });
            if (!enrollment) return res.status(403).json({ error: "You must purchase this course" });

            const live = await prisma.liveStream.findUnique({ where: { courseId } });
            if (!live?.muxPlaybackId) return res.status(404).json({ error: "Live stream not configured" });

            const base = `https://stream.mux.com/${live.muxPlaybackId}.m3u8`;

            if (hasSignedPlayback) {
                const exp = Math.floor(Date.now() / 1000) + 10 * 60;

                const token = generateSignedPlaybackToken(live.muxPlaybackId, exp);


                return res.json({ playbackPolicy: "signed", hls: `${base}?token=${token}` });
            }

            return res.json({ playbackPolicy: "public", hls: base });
        } catch (err) {
            console.error("Error joining live:", err);
            return res.status(500).json({ error: "Internal server error" });
        }
    }
);

/**
 * POST /api/mux/webhook
 */
router.post("/webhook", async (req: Request, res: Response) => {
    try {
        const evt: any = req.body;
        if (evt?.type?.startsWith("video.live_stream.")) {
            const liveId = evt?.data?.id;
            const status = evt?.data?.status;
            if (liveId && status) {
                await prisma.liveStream.updateMany({
                    where: { muxStreamId: liveId },
                    data: { status },
                });
            }
        }
        res.status(200).send();
    } catch (e) {
        console.error("Mux webhook error:", e);
        res.status(200).send();
    }
});

export default router;
