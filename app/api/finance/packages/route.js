import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/apiAuth";
import { getPackages } from "@/lib/finance/packageService";
import { handleFinanceError } from "@/lib/finance/routeHelpers";

// Endpoint Finance untuk katalog paket bersifat read-only. Pembuatan,
// pengubahan, aktivasi/nonaktivasi, dan penghapusan paket dilakukan
// melalui endpoint Marketing (`/api/marketing/packages`).
export async function GET() {
    const { user, response } = await requireApiUser([
        "SUPERADMIN",
        "OWNER",
        "ADMIN",
    ]);
    if (response) return response;

    try {
        return NextResponse.json({ data: await getPackages(user) });
    } catch (error) {
        return handleFinanceError(error, "Katalog Paket");
    }
}
