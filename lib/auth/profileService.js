import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { toSafeUser } from "./authService";

// Layanan profil akun sendiri (Settings Profil). Semua fungsi di sini
// hanya bekerja pada baris User milik pemanggil (userId dari session),
// tidak pernah menerima target user lain dari client.

/**
 * Profil operasional Student yang terhubung ke akun login, bila ada.
 * Dipakai halaman Raport (filter milik sendiri) dan Paket Saya.
 */
export async function getMyStudentProfile(userId) {
    if (!userId) return null;

    return prisma.student.findUnique({
        where: { userId },
        select: {
            id: true,
            name: true,
            level: true,
            status: true,
        },
    });
}

export async function updateMyProfile(userId, data) {
    const emailOwner = await prisma.user.findFirst({
        where: {
            email: data.email,
            id: { not: userId },
        },
        select: { id: true },
    });

    if (emailOwner) {
        return {
            ok: false,
            status: 409,
            code: "EMAIL_ALREADY_USED",
            message:
                "Email sudah dipakai akun lain. Gunakan email yang berbeda.",
        };
    }

    const updated = await prisma.user.update({
        where: { id: userId },
        data: {
            name: data.name,
            email: data.email,
            phone: data.phone,
        },
    });

    // Nama profil operasional siswa mengikuti nama akun, sama seperti
    // sinkronisasi pada Data Master Siswa.
    await prisma.student.updateMany({
        where: { userId },
        data: { name: data.name },
    });

    return { ok: true, user: toSafeUser(updated) };
}

export async function changeMyPassword(
    userId,
    { currentPassword, newPassword },
) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, password: true },
    });

    if (!user) {
        return {
            ok: false,
            status: 404,
            code: "USER_NOT_FOUND",
            message: "Akun tidak ditemukan.",
        };
    }

    const isCurrentValid = await bcrypt.compare(currentPassword, user.password);

    if (!isCurrentValid) {
        return {
            ok: false,
            status: 400,
            code: "CURRENT_PASSWORD_INVALID",
            message: "Password saat ini salah. Periksa kembali lalu coba lagi.",
        };
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    const updated = await prisma.user.update({
        where: { id: userId },
        data: {
            password: passwordHash,
            // Menaikkan versi dalam update yang sama mencabut token lama di
            // perangkat/browser lain tanpa jendela race di antara dua tulisan.
            tokenVersion: { increment: 1 },
        },
    });

    return {
        ok: true,
        user: toSafeUser(updated),
        // Dipakai route untuk menerbitkan ulang cookie sesi saat ini.
        tokenVersion: updated.tokenVersion,
    };
}
