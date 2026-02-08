import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    const authenticated = isAuthenticated(req);
    return NextResponse.json({ authenticated });
}