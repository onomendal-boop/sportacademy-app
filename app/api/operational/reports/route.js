import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/apiAuth";
import { getMyStudentProfile } from "@/lib/auth/profileService";
import { createReport, getReports } from "@/lib/operational/reportService";
import {
    handleOperationalError,
    parseJsonBody,
    validationResponse,
} from "@/lib/operational/routeHelpers";
import { reportSchema } from "@/lib/validations/operational";

export async function GET() {
    const { user, response } = await requireApiUser();
    if (response) return response;

    try {
        // Siswa hanya boleh melihat raport PUBLISHED miliknya sendiri.
        // Aktor diteruskan agar service juga memaksa filter status tersebut.
        if (user.role === "STUDENT") {
            const profile = await getMyStudentProfile(user.id);
            return NextResponse.json({
                data: profile
                    ? await getReports({ studentId: profile.id, actor: user })
                    : [],
            });
        }

        return NextResponse.json({ data: await getReports({ actor: user }) });
    } catch (error) {
        return handleOperationalError(error, "Raport");
    }
}

export async function POST(request) {
    const { user, response } = await requireApiUser([
        "SUPERADMIN",
        "OWNER",
        "ADMIN",
        "COACH",
    ]);
    if (response) return response;

    const { body, response: bodyResponse } = await parseJsonBody(request);
    if (bodyResponse) return bodyResponse;

    const parsed = reportSchema.safeParse(body);
    if (!parsed.success) {
        return validationResponse(
            parsed.error,
            "Data raport belum memenuhi ketentuan.",
        );
    }

    try {
        const report = await createReport(parsed.data, user);
        return NextResponse.json({ data: report }, { status: 201 });
    } catch (error) {
        return handleOperationalError(error, "Raport");
    }
}
