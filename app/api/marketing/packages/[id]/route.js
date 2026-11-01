import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireApiUser } from "@/lib/auth/apiAuth";
import { deletePackage, updatePackage } from "@/lib/finance/packageService";
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

export async function PATCH(request, { params }) {
    const { user, response } = await requireApiUser(MARKETING_PACKAGE_ROLES);
    if (response) return response;

    const { id } = await params;
    const { body, response: bodyResponse } = await parseJsonBody(request);
    if (bodyResponse) return bodyResponse;

    const parsed = packageSchema.safeParse(body);
    if (!parsed.success) return validationResponse(parsed.error);

    try {
        const pkg = await updatePackage(id, parsed.data, user);
        revalidatePackageCatalog();
        return NextResponse.json({ data: pkg });
    } catch (error) {
        return handleFinanceError(error, "Katalog Paket Marketing");
    }
}

export async function DELETE(_request, { params }) {
    const { user, response } = await requireApiUser(MARKETING_PACKAGE_ROLES);
    if (response) return response;

    const { id } = await params;

    try {
        const result = await deletePackage(id, user);
        revalidatePackageCatalog();
        return NextResponse.json({ data: result });
    } catch (error) {
        return handleFinanceError(error, "Katalog Paket Marketing");
    }
}
