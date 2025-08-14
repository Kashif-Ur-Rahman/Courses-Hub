import * as jwt from "jsonwebtoken";

const keyId = process.env.MUX_SIGNING_KEY as string;
const secret = process.env.MUX_SIGNING_SECRET as string;

if (!keyId || !secret) {
    throw new Error("MUX_SIGNING_KEY or MUX_SIGNING_SECRET not set in environment variables.");
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
            kid: keyId,
            playback_id: playbackId,
            type,
            exp,
        },
        secret,
        { algorithm: "HS256" }
    );
}
