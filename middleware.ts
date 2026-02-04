import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAuthenticated } from "@/lib/auth";

export function middleware(req: NextRequest) {
    const isAuth = isAuthenticated(req);
    const isLoginPage = req.nextUrl.pathname === "/login";

    // Public paths
    if (
        req.nextUrl.pathname.startsWith("/_next") ||
        req.nextUrl.pathname.startsWith("/static") ||
        req.nextUrl.pathname.includes(".")
    ) {
        return NextResponse.next();
    }

    // Allow API routes through (so POST/PUT/DELETE reach their handlers)
    if (req.nextUrl.pathname.startsWith("/api")) {
        return NextResponse.next();
    }

    // 1. User is NOT logged in and tries to access protected route -> Redirect to Login
    if (!isAuth && !isLoginPage && req.nextUrl.pathname !== "/api/auth/login") {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    // 2. User IS logged in and tries to access Login page -> Redirect to Dashboard
    if (isAuth && isLoginPage) {
        return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
