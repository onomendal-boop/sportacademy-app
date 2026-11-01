import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireApiUser } from "@/lib/auth/apiAuth";
import { createPackage, getPackages } from "@/lib/finance/packageService";
import {
    handleFinanceError,
    parseJsonBody,
    validationResponse,
} from "@/lib/finance/routeHelpers";
import { packageSchema } from "@/lib/validations/finance";

const MARKETING_PACKAGE_ROLES = ["SUPERADMIN", "OWNER"];

function revalidatePackageCatalog() {
    revalidateTag("program-content", "max");
    revalidateTag("packages", "max");
    revalidateTag("public-landing", "max");
}

export async function GET() {
    const { user, response } = await requireApiUser(MARKETING_PACKAGE_ROLES);
    if (response) return response;

    try {
        return NextResponse.json({ data: await getPackages(user) });
    } catch (error) {
        return handleFinanceError(error, "Katalog Paket Marketing");
    }
}

export async function POST(request) {
    const { user, response } = await requireApiUser(MARKETING_PACKAGE_ROLES);
    if (response) return response;

    const { body, response: bodyResponse } = await parseJsonBody(request);
    if (bodyResponse) return bodyResponse;

    const parsed = packageSchema.safeParse(body);
    if (!parsed.success) return validationResponse(parsed.error);

    try {
        const pkg = await createPackage(parsed.data, user);
        revalidatePackageCatalog();
        return NextResponse.json({ data: pkg }, { status: 201 });
    } catch (error) {
        return handleFinanceError(error, "Katalog Paket Marketing");
    }
}
