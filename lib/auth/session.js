import { cookies } from "next/headers";
import { connection } from "next/server";
import {
    SESSION_TTL_SECONDS,
    createSessionToken,
    verifySessionToken,
} from "./sessionToken";

export const SESSION_COOKIE_NAME = "aaa_session";

function getCookieOptions(maxAge) {
    return {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge,
    };
}

export async function setSessionCookie(
    user,
    tokenVersion = user?.tokenVersion,
) {
    const cookieStore = await cookies();
    const token = createSessionToken(user, { tokenVersion });

    cookieStore.set(
        SESSION_COOKIE_NAME,
        token,
        getCookieOptions(SESSION_TTL_SECONDS),
    );
}

export async function clearSessionCookie() {
    const cookieStore = await cookies();

    cookieStore.set(SESSION_COOKIE_NAME, "", {
        ...getCookieOptions(0),
        expires: new Date(0),
    });
}

export async function getSession() {
    // Session selalu spesifik untuk request pengguna yang sedang masuk.
    // connection() menghentikan prerender di titik ini, sehingga pembacaan
    // cookie dan pemeriksaan waktu kedaluwarsa token (Date.now() di
    // verifySessionToken) hanya berjalan pada request time. Tanpa ini,
    // Cache Components Next.js 16 dapat memicu error Blocking Route
    // "unstable value Date.now() while prerendering".
    await connection();

    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    return verifySessionToken(token);
}
