import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/apiAuth";
import {
    handleApiError,
    parseJsonBody,
    validationResponse,
} from "@/lib/api/routeHelpers";
import { sanitizeArticlePreview } from "@/lib/marketing/articleService";
import { articleContentPreviewSchema } from "@/lib/marketing/marketingValidation";

const MARKETING_ROLES = ["SUPERADMIN", "OWNER"];

export async function POST(request) {
    const { user, response } = await requireApiUser(MARKETING_ROLES);
    if (response) return response;

    const { body, response: bodyResponse } = await parseJsonBody(request);
    if (bodyResponse) return bodyResponse;

    const parsed = articleContentPreviewSchema.safeParse(body);
    if (!parsed.success) return validationResponse(parsed.error);

    try {
        return NextResponse.json(
            {
                data: {
                    content: sanitizeArticlePreview(parsed.data.content, user),
                },
            },
            {
                headers: {
                    "Cache-Control": "no-store",
                },
            },
        );
    } catch (error) {
        return handleApiError(error, "Preview artikel");
    }
}
