import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { canAccessFeature } from "./permissions";
import { buildLoginPath } from "./redirect";
import { getSession } from "./session";

const safeUserSelect = {
    id: true,
    name: true,
    username: true,
    email: true,
    phone: true,
    profileImage: true,
    role: true,
    programScope: true,
    specialization: true,
    isActive: true,
};

// Hash bcrypt valid dengan cost yang sama seperti password user (10).
// Hash ini hanya dipakai agar jalur username tidak ditemukan tetap
// menjalankan bcrypt.compare. Walaupun password yang dikirim cocok dengan
// hash dummy ini, login tetap ditolak karena user-nya tidak ada.
const DUMMY_PASSWORD_HASH =
    "$2b$10$6lcCjFiPsddO6obDXaEuaOGaPjpJXfZWEWHfyP2OooXokuOfwT47S";

function invalidCredentialsResult() {
    return {
        ok: false,
        status: 401,
        code: "INVALID_CREDENTIALS",
        message: "Username atau password salah. Silakan coba lagi.",
    };
}

export function toSafeUser(user) {
    if (!user) return null;

    return {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        phone: user.phone ?? null,
        profileImage: user.profileImage ?? null,
        role: user.role,
        programScope: user.programScope ?? null,
        specialization: user.specialization ?? null,
    };
}

/**
 * Fungsi server untuk memverifikasi username dan password ke database MySQL.
 * Email tidak digunakan sebagai kredensial login.
 */
export async function authenticateUser({ username, password }) {
    const normalizedUsername = username.trim().toLowerCase();

    const user = await prisma.user.findUnique({
        where: { username: normalizedUsername },
        select: {
            ...safeUserSelect,
            password: true,
            tokenVersion: true,
        },
    });

    // Selalu jalankan bcrypt.compare, termasuk ketika username tidak ada,
    // agar respons dan waktu proses tidak membocorkan keberadaan akun.
    const passwordHash = user?.password ?? DUMMY_PASSWORD_HASH;
    const isPasswordValid = await bcrypt
        .compare(password, passwordHash)
        .catch(() => false);

    // Username tidak ada dan password salah harus tidak dapat dibedakan
    // dari status, code, maupun pesan yang diterima client.
    if (!user || !isPasswordValid) {
        return invalidCredentialsResult();
    }

    // Status nonaktif baru boleh diungkap setelah password terbukti benar.
    // Dengan urutan ini, penyerang yang tidak tahu password tidak dapat
    // memakai ACCOUNT_DISABLED untuk memeriksa akun mana yang terdaftar.
    if (!user.isActive) {
        return {
            ok: false,
            status: 403,
            code: "ACCOUNT_DISABLED",
            message: "Akun Anda nonaktif. Silakan hubungi admin.",
        };
    }

    return {
        ok: true,
        user: toSafeUser(user),
        // Hanya untuk pembuatan cookie di route login; jangan kirim nilai ini
        // sebagai bagian dari DTO user ke client.
        tokenVersion: user.tokenVersion,
    };
}

/**
 * Ambil user dari token cookie, lalu verifikasi kembali ke database.
 * Dengan cara ini akun yang sudah dihapus/nonaktif tidak tetap lolos.
 */
export async function getCurrentUser() {
    const session = await getSession();

    if (!session?.sub) return null;

    const user = await prisma.user.findUnique({
        where: { id: session.sub },
        select: {
            ...safeUserSelect,
            tokenVersion: true,
        },
    });

    if (!user || !user.isActive || user.tokenVersion !== session.tokenVersion) {
        return null;
    }

    return toSafeUser(user);
}

/**
 * Guard untuk Server Component/layout. User yang belum login selalu
 * diarahkan ke /login, termasuk ketika mengetik URL dashboard langsung.
 */
export async function requireCurrentUser(nextPath = "/dashboard") {
    const user = await getCurrentUser();

    if (!user) {
        redirect(buildLoginPath(nextPath));
    }

    return user;
}

/**
 * Guard halaman per fitur berdasarkan matriks role di permissions.js.
 * Menu sidebar sudah disembunyikan untuk role yang tidak berhak; guard
 * ini adalah lapisan kedua agar URL yang diketik langsung pun ditolak.
 * Role yang tidak berhak diarahkan ke Ringkasan dashboard.
 */
export async function requireFeatureAccess(feature, nextPath = "/dashboard") {
    const user = await requireCurrentUser(nextPath);

    if (!canAccessFeature(user.role, feature)) {
        redirect("/dashboard");
    }

    return user;
}
