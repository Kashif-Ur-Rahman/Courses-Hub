import express, { type Request, type Response } from "express";
import Mux from "@mux/mux-node";
import prisma from "./prismaClient.js";
import authMiddleware from "./authMiddleware.js";

const mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID!,
    tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

const router = express.Router();

/**
 * POST /api/mux/instructor/:courseId/live/create
 */
router.post(
    "/instructor/:courseId/live/create",
    authMiddleware,
    async (req: Request, res: Response) => {
        try {
            const { courseId } = req.params;
            const userId = (req as any).user?.id;
            if (!userId) return res.status(401).send("Unauthorized");

            const course = await prisma.course.findUnique({ where: { id: Number(courseId) } });
            if (!course || course.instructorId !== userId) return res.status(403).send("Forbidden");

            const live = await mux.video.liveStreams.create({
                playback_policy: ["signed"],
                new_asset_settings: { playback_policy: ["signed"] },
            });

            await prisma.liveStream.create({
                data: {
                    courseId: Number(courseId),
                    muxStreamId: (live as any).id ?? "",
                    muxPlaybackId: (live as any).playback_ids?.[0]?.id ?? "",
                    status: "created",
                },
            });

            const streamKey = (live as any).stream_key ?? (live as any).streamKey ?? null;
            const ingestUrl = (live as any).ingest_url ?? (live as any).ingest?.url ?? null;

            return res.json({
                ingest: { stream_key: streamKey, rtmp_ingest: ingestUrl },
                playback_id: (live as any).playback_ids?.[0]?.id ?? "",
            });
        } catch (err) {
            console.error("Error creating live stream:", err);
            return res.status(500).send("Internal server error");
        }
    }
);

/**
 * GET /api/mux/courses/:courseId/playback-token
 */
router.get(
    "/courses/:courseId/playback-token",
    authMiddleware,
    async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user?.id;
            if (!userId) return res.status(401).send("Unauthorized");

            const courseId = Number(req.params.courseId);
            const enrollment = await prisma.enrollment.findFirst({ where: { userId, courseId } });
            if (!enrollment) return res.status(403).send("You are not enrolled");

            const stream = await prisma.liveStream.findUnique({ where: { courseId } });
            if (!stream || !stream.muxPlaybackId) return res.status(404).send("No active stream");

            const muxPlaybackId = stream.muxPlaybackId;

            // v12 runtime helper: use mux.jwt.signPlaybackId(...) — types may not expose it, so cast to any.
            const playbackToken: string = await (mux.jwt as any).signPlaybackId(muxPlaybackId, {
                type: "video",
                keyId: process.env.MUX_SIGNING_KEY_ID!,
                keySecret: process.env.MUX_SIGNING_KEY_PRIVATE!,
                expiration: Math.floor(Date.now() / 1000) + 3600,
            });

            return res.json({
                playbackUrl: `https://stream.mux.com/${muxPlaybackId}.m3u8?token=${playbackToken}`,
            });
        } catch (err) {
            console.error("Error generating playback token:", err);
            return res.status(500).send("Internal server error");
        }
    }
);

export default router;
