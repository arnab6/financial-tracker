import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "auth_session";
const SESSION_SECRET = "super-secret-key-change-this-in-env";

// Simple encryption/hashing could go here, but for now we'll check a simple token
// In production, use a library like `jose` for proper JWTs.

export async function createSession(res: NextResponse) {
    res.cookies.set(SESSION_COOKIE_NAME, "authenticated", {
        httpOnly: true,
        secure: false, // Allow cookies in development (localhost)
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: "/",
    });
}

export async function clearSession(res: NextResponse) {
    res.cookies.delete(SESSION_COOKIE_NAME);
}

export function isAuthenticated(req: NextRequest) {
    const cookie = req.cookies.get(SESSION_COOKIE_NAME);
    return cookie?.value === "authenticated";
}
