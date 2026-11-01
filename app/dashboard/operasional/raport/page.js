import { Suspense } from "react";
import OperationalSkeleton from "@/components/operational/OperationalSkeleton";
import StudentReportManager from "@/components/operational/StudentReportManager";
import { requireFeatureAccess } from "@/lib/auth/authService";
import {
    canPermanentlyDelete,
    REPORT_EDITOR_ROLES,
} from "@/lib/auth/permissions";
import { getMyStudentProfile } from "@/lib/auth/profileService";
import { getCoaches } from "@/lib/data-master/coachService";
import { getReportStudents } from "@/lib/operational/operationalOptionsService";
import { getReports } from "@/lib/operational/reportService";

export const metadata = {
    title: "Raport Siswa | AAA Sport Academy",
    description:
        "Kelola raport perkembangan kompetensi renang siswa AAA Sport Academy.",
};

function getInitialSearch(resolvedSearchParams) {
    const rawQuery = Array.isArray(resolvedSearchParams?.q)
        ? resolvedSearchParams.q[0]
        : resolvedSearchParams?.q;

    return typeof rawQuery === "string" ? rawQuery.trim().slice(0, 80) : "";
}

async function StudentReportContent({ searchParams }) {
    const resolvedSearchParams = await searchParams;
    const initialSearch = getInitialSearch(resolvedSearchParams);
    const currentUser = await requireFeatureAccess(
        "studentReports",
        "/dashboard/operasional/raport",
    );
    const role = currentUser?.role;

    // Siswa hanya melihat raport PUBLISHED miliknya sendiri dan tidak
    // menerima daftar opsi siswa/pelatih milik pengguna lain. Aktor
    // diteruskan supaya filter status ditegakkan juga oleh service.
    if (role === "STUDENT") {
        const profile = await getMyStudentProfile(currentUser.id);
        const reports = profile
            ? await getReports({ studentId: profile.id, actor: currentUser })
            : [];

        return (
            <StudentReportManager
                key={initialSearch}
                initialReports={reports}
                initialSearch={initialSearch}
                students={[]}
                coaches={[]}
                canManage={false}
                canDelete={false}
                currentUser={{
                    id: currentUser.id,
                    name: currentUser.name,
                    role,
                    programScope: null,
                }}
            />
        );
    }

    const [reports, students, coaches] = await Promise.all([
        getReports({ actor: currentUser }),
        getReportStudents(currentUser),
        getCoaches(),
    ]);

    return (
        <StudentReportManager
            key={initialSearch}
            initialReports={reports}
            initialSearch={initialSearch}
            students={students}
            coaches={coaches}
            canManage={REPORT_EDITOR_ROLES.includes(role)}
            canDelete={canPermanentlyDelete(role)}
            currentUser={
                currentUser
                    ? {
                          id: currentUser.id,
                          name: currentUser.name,
                          role,
                          programScope: currentUser.programScope ?? null,
                      }
                    : null
            }
        />
    );
}

export default function StudentReportPage({ searchParams }) {
    return (
        <Suspense fallback={<OperationalSkeleton />}>
            <StudentReportContent searchParams={searchParams} />
        </Suspense>
    );
}
