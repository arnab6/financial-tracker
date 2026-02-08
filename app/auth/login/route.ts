import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const { username, password } = await req.json();

        const validUser = process.env.BASIC_AUTH_USER || "admin";
        const validPass = process.env.BASIC_AUTH_PASSWORD || "password";

        if (username === validUser && password === validPass) {
            const res = NextResponse.json({ success: true });
            await createSession(res);
            return res;
        }

        return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 });
    } catch (e) {
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
