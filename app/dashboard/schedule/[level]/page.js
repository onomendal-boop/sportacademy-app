import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays } from "lucide-react";
import OperationalSkeleton from "@/components/operational/OperationalSkeleton";
import ScheduleCalendar from "@/components/operational/ScheduleCalendar";
import { getCurrentUser } from "@/lib/auth/authService";
import {
    canManageProgram,
    getProgramScope,
    isAdminLevel,
} from "@/lib/auth/permissions";
import { getMyStudentProfile } from "@/lib/auth/profileService";
import { getCoachOptions } from "@/lib/data-master/coachService";
import { PROGRAM_BY_SLUG, PROGRAM_CONFIG } from "@/lib/operational/constants";
import { getOperationalStudents } from "@/lib/operational/operationalOptionsService";

export const metadata = {
    title: "Jadwal Program | AAA Sport Academy",
    description: "Kalender jadwal mingguan program AAA Sport Academy.",
};

function InvalidLevel({ level }) {
    return (
        <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-red-100">
                <CalendarDays className="h-7 w-7" aria-hidden="true" />
            </span>
            <h2 className="mt-4 font-heading text-2xl font-extrabold text-slate-900">
                Level Jadwal Tidak Ditemukan
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
                Route{" "}
                <span className="font-bold text-slate-900">
                    /dashboard/schedule/{level || "-"}
                </span>{" "}
                tidak valid. Gunakan salah satu level berikut.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
                {Object.values(PROGRAM_CONFIG).map((config) => (
                    <Link
                        key={config.code}
                        href={`/dashboard/schedule/${config.slug}`}
                        className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-50 px-4 text-sm font-bold text-[#0066CC] transition hover:bg-blue-100"
                    >
                        {config.title}
                    </Link>
                ))}
            </div>
        </div>
    );
}

async function ScheduleLevelContent({ params }) {
    const resolvedParams = await params;
    const rawLevel = Array.isArray(resolvedParams?.level)
        ? resolvedParams.level[0]
        : resolvedParams?.level;
    const levelSlug = String(rawLevel ?? "").toLowerCase();
    const programConfig = PROGRAM_BY_SLUG[levelSlug];

    if (!programConfig) {
        return <InvalidLevel level={levelSlug} />;
    }

    const currentUser = await getCurrentUser();
    const isBusinessManager = isAdminLevel(currentUser?.role);
    const programScope = getProgramScope(currentUser);

    if (currentUser?.role === "ADMIN") {
        if (!programScope) {
            redirect("/dashboard");
        }

        if (
            programConfig.code !== "PRIVATE" &&
            programConfig.code !== programScope
        ) {
            redirect(
                `/dashboard/schedule/${PROGRAM_CONFIG[programScope].slug}`,
            );
        }
    }
    const canManage =
        currentUser?.role === "ADMIN"
            ? canManageProgram(currentUser, programConfig.code)
            : isBusinessManager;
    const studentProfile =
        currentUser?.role === "STUDENT"
            ? await getMyStudentProfile(currentUser.id)
            : null;

    const canBook =
        (isBusinessManager &&
            (currentUser?.role !== "ADMIN" || Boolean(programScope))) ||
        studentProfile?.status === "ACTIVE";

    // Pilihan pelatih diperlukan oleh pengelola jadwal, admin program
    // yang membuat booking Private, dan siswa yang membuat booking.
    // Gunakan DTO opsi minimal untuk semua role: halaman ini tidak
    // membutuhkan username/email/jumlah penugasan pelatih, dan field
    // tersebut tidak boleh masuk props client untuk STUDENT. Daftar
    // siswa untuk admin program sudah dibatasi ke levelnya oleh service;
    // siswa hanya menerima profilnya sendiri.
    const needsCoachOptions =
        canManage ||
        currentUser?.role === "STUDENT" ||
        (programConfig.code === "PRIVATE" && canBook);
    const [coaches, students] = await Promise.all([
        needsCoachOptions ? getCoachOptions() : Promise.resolve([]),
        isBusinessManager
            ? getOperationalStudents(currentUser)
            : Promise.resolve(studentProfile ? [studentProfile] : []),
    ]);

    return (
        <ScheduleCalendar
            programConfig={programConfig}
            coaches={coaches}
            students={students}
            canManage={canManage}
            canBook={canBook}
            currentStudentId={studentProfile?.id ?? null}
            programScope={programScope}
        />
    );
}

/**
 * params diteruskan sebagai Promise ke async child di dalam Suspense.
 * Pola ini kompatibel dengan Cache Components Next.js 16.
 */
export default function ScheduleLevelPage({ params }) {
    return (
        <Suspense fallback={<OperationalSkeleton />}>
            <ScheduleLevelContent params={params} />
        </Suspense>
    );
}
