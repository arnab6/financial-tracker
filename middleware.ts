import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "auth_session";

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Public routes that don't require authentication
    const publicRoutes = ["/login", "/api/auth/login"];
    
    // Check if the current path is public
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

    // Get the session cookie
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
    const isAuthenticated = sessionCookie?.value === "authenticated";

    // Redirect logic
    if (!isAuthenticated && !isPublicRoute) {
        // Not authenticated and trying to access protected route -> redirect to login
        const loginUrl = new URL("/login", request.url);
        return NextResponse.redirect(loginUrl);
    }

    if (isAuthenticated && pathname === "/login") {
        // Already authenticated and on login page -> redirect to home
        const homeUrl = new URL("/", request.url);
        return NextResponse.redirect(homeUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
};
