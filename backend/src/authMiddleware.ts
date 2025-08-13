import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
    user?: { id: number; email: string; role: string };
}

export default function authMiddleware(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET is not set in environment variables");
        return res.status(500).json({ error: "Server misconfiguration" });
    }

    try {
        const decoded = jwt.verify(token as string, process.env.JWT_SECRET) as JwtPayload;

        if (
            typeof decoded === "object" &&
            decoded !== null &&
            "id" in decoded &&
            "email" in decoded &&
            "role" in decoded
        ) {
            req.user = {
                id: decoded.id as number,
                email: decoded.email as string,
                role: decoded.role as string,
            };
            next();
        } else {
            return res.status(401).json({ error: "Invalid token payload" });
        }
    } catch (err) {
        return res.status(401).json({ error: "Invalid token" });
    }
}
