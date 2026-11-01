import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth/authService";
import {
    checkLoginRateLimit,
    clearSuccessfulLoginAttempt,
    getLoginClientIp,
    recordFailedLoginAttempt,
} from "@/lib/auth/loginRateLimit";
import { setSessionCookie } from "@/lib/auth/session";
import { loginSchema } from "@/lib/validations/auth";

export async function POST(request) {
    let body;

    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            {
                code: "INVALID_JSON",
                message: "Format data login tidak valid.",
            },
            { status: 400 },
        );
    }

    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
        const fieldErrors = {};

        for (const issue of parsed.error.issues) {
            const field = issue.path[0];

            if (typeof field === "string") {
                fieldErrors[field] ??= [];
                fieldErrors[field].push(issue.message);
            }
        }

        return NextResponse.json(
            {
                code: "VALIDATION_ERROR",
                message: "Username atau password belum memenuhi ketentuan.",
                fieldErrors,
            },
            { status: 400 },
        );
    }

    const loginContext = {
        ip: getLoginClientIp(request),
        username: parsed.data.username,
    };

    try {
        const rateLimit = await checkLoginRateLimit(loginContext);

        if (!rateLimit.allowed) {
            return NextResponse.json(
                {
                    code: "TOO_MANY_ATTEMPTS",
                    message:
                        "Terlalu banyak percobaan login. Silakan coba lagi nanti.",
                },
                {
                    status: 429,
                    headers: {
                        "Cache-Control": "no-store",
                        "Retry-After": String(rateLimit.retryAfterSeconds),
                    },
                },
            );
        }

        const result = await authenticateUser(parsed.data);

        if (!result.ok) {
            await recordFailedLoginAttempt(loginContext);

            return NextResponse.json(
                {
                    code: result.code,
                    message: result.message,
                },
                {
                    status: result.status,
                    headers: { "Cache-Control": "no-store" },
                },
            );
        }

        await clearSuccessfulLoginAttempt(loginContext);
        await setSessionCookie(result.user, result.tokenVersion);

        return NextResponse.json(
            { user: result.user },
            { headers: { "Cache-Control": "no-store" } },
        );
    } catch (error) {
        console.error("[POST /api/auth/login]", error);

        return NextResponse.json(
            {
                code: "LOGIN_FAILED",
                message:
                    "Login gagal karena gangguan server. Silakan coba lagi.",
            },
            { status: 500 },
        );
    }
}
