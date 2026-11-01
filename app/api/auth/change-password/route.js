import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/apiAuth";
import { changeMyPassword } from "@/lib/auth/profileService";
import { setSessionCookie } from "@/lib/auth/session";
import {
    changePasswordSchema,
    getAuthFieldErrors,
} from "@/lib/validations/auth";

export async function POST(request) {
    const { user, response } = await requireApiUser();
    if (response) return response;

    let body;

    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            {
                code: "INVALID_JSON",
                message: "Format data yang dikirim tidak valid.",
            },
            { status: 400 },
        );
    }

    const parsed = changePasswordSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json(
            {
                code: "VALIDATION_ERROR",
                message: "Data password belum memenuhi ketentuan.",
                fieldErrors: getAuthFieldErrors(parsed.error),
            },
            { status: 400 },
        );
    }

    try {
        const result = await changeMyPassword(user.id, parsed.data);

        if (!result.ok) {
            return NextResponse.json(
                { code: result.code, message: result.message },
                { status: result.status },
            );
        }

        // tokenVersion sudah naik, sehingga token di sesi lain gugur. Sesi
        // yang baru saja membuktikan password saat ini mendapat cookie baru
        // dengan versi terbaru agar pengguna tidak ikut ter-logout.
        await setSessionCookie(result.user, result.tokenVersion);

        return NextResponse.json({
            ok: true,
            message:
                "Password berhasil diubah. Sesi pada perangkat lain telah dikeluarkan; gunakan password baru pada login berikutnya.",
        });
    } catch (error) {
        console.error("[Profile] Gagal mengubah password:", error);
        return NextResponse.json(
            {
                code: "INTERNAL_ERROR",
                message:
                    "Terjadi kendala saat mengubah password. Coba lagi beberapa saat.",
            },
            { status: 500 },
        );
    }
}
