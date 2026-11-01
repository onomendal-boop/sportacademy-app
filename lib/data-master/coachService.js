import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { DataMasterError } from "./routeHelpers";

const DEFAULT_COACH_PASSWORD = "password123";

const coachSelect = {
    id: true,
    name: true,
    username: true,
    email: true,
    profileImage: true,
    role: true,
    specialization: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
    _count: {
        select: {
            coachAssignments: true,
        },
    },
};

function defaultAvatar(name) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0066CC&color=fff&size=256&bold=true`;
}

const coachOptionSelect = {
    id: true,
    name: true,
    profileImage: true,
    specialization: true,
    isActive: true,
};

export function mapCoachOption(coach) {
    return {
        id: coach.id,
        name: coach.name,
        profileImage: coach.profileImage ?? "",
        specialization: coach.specialization ?? "",
        isActive: coach.isActive,
    };
}

export function mapCoach(coach) {
    return {
        id: coach.id,
        name: coach.name,
        username: coach.username,
        email: coach.email,
        profileImage: coach.profileImage ?? "",
        role: coach.role,
        specialization: coach.specialization ?? "AAA Sport Academy",
        isActive: coach.isActive,
        assignmentCount: coach._count?.coachAssignments ?? 0,
        createdAt: coach.createdAt.toISOString(),
        updatedAt: coach.updatedAt.toISOString(),
    };
}

async function findCoachOrThrow(id) {
    const coach = await prisma.user.findFirst({
        where: {
            id,
            role: "COACH",
        },
        select: coachSelect,
    });

    if (!coach) {
        throw new DataMasterError(404, "NOT_FOUND", "Pelatih tidak ditemukan.");
    }

    return coach;
}

export async function getCoaches() {
    const coaches = await prisma.user.findMany({
        where: { role: "COACH" },
        select: coachSelect,
        orderBy: [{ isActive: "desc" }, { name: "asc" }],
    });

    return coaches.map(mapCoach);
}

/**
 * Opsi pelatih untuk pemilih jadwal/booking.
 *
 * DTO ini sengaja tidak memuat username, email, jumlah penugasan,
 * role, atau timestamp akun karena hasilnya dapat dikirim sebagai
 * props ke role STUDENT. Data pelatih lengkap tetap hanya tersedia
 * melalui getCoaches() untuk alur Data Master yang terproteksi.
 */
export async function getCoachOptions() {
    const coaches = await prisma.user.findMany({
        where: { role: "COACH" },
        select: coachOptionSelect,
        orderBy: [{ isActive: "desc" }, { name: "asc" }],
    });

    return coaches.map(mapCoachOption);
}

export async function createCoach(data) {
    const passwordHash = await bcrypt.hash(
        data.password || DEFAULT_COACH_PASSWORD,
        10,
    );

    const coach = await prisma.user.create({
        data: {
            name: data.name,
            username: data.username,
            email: data.email,
            password: passwordHash,
            profileImage: data.profileImage || defaultAvatar(data.name),
            role: "COACH",
            specialization: data.specialization,
            isActive: data.isActive,
        },
        select: coachSelect,
    });

    return mapCoach(coach);
}

export async function updateCoach(id, data) {
    await findCoachOrThrow(id);

    const writeData = {
        name: data.name,
        username: data.username,
        email: data.email,
        profileImage: data.profileImage || defaultAvatar(data.name),
        specialization: data.specialization,
        isActive: data.isActive,
    };

    // Password hanya diganti apabila admin mengisi field password baru.
    // Reset oleh admin juga mencabut semua token sesi pelatih yang lama.
    if (data.password) {
        writeData.password = await bcrypt.hash(data.password, 10);
        writeData.tokenVersion = { increment: 1 };
    }

    const coach = await prisma.user.update({
        where: { id },
        data: writeData,
        select: coachSelect,
    });

    return mapCoach(coach);
}

export async function deleteCoach(id) {
    const coach = await findCoachOrThrow(id);

    if ((coach._count?.coachAssignments ?? 0) > 0) {
        throw new DataMasterError(
            409,
            "COACH_HAS_ASSIGNMENTS",
            "Pelatih sudah memiliki penugasan jadwal sehingga tidak dapat dihapus. Nonaktifkan pelatih sebagai gantinya.",
        );
    }

    await prisma.user.delete({ where: { id } });
    return { ok: true };
}
