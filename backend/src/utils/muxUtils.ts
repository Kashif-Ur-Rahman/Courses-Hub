// backend/src/utils/muxUtils.ts

import jwt from "jsonwebtoken";

const signingKeyId = process.env.MUX_SIGNING_KEY_ID as string;
const signingKeyPrivate = process.env.MUX_SIGNING_KEY_PRIVATE as string;

if (!signingKeyId || !signingKeyPrivate) {
    throw new Error("MUX_SIGNING_KEY_ID or MUX_SIGNING_KEY_PRIVATE not set in environment variables.");
}

export function generateSignedPlaybackUrl(
    playbackId: string,
    type: "video" | "live" = "video",
    expiresInSeconds: number = 3600
): string {
    const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const token = generateSignedPlaybackToken(playbackId, exp, type);
    return `https://stream.mux.com/${playbackId}.m3u8?token=${token}`;
}

export function generateSignedPlaybackToken(
    playbackId: string,
    exp: number,
    type: "video" | "live" = "video"
): string {
    return jwt.sign(
        {
            kid: signingKeyId,
            playback_id: playbackId,
            type,
            exp,
        },
        signingKeyPrivate,
        { algorithm: "RS256" } // Use RS256 for MUX signed URLs
    );
}
