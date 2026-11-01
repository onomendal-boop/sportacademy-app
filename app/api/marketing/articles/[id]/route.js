import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { requireApiUser } from '@/lib/auth/apiAuth';
import {
  handleApiError,
  parseJsonBody,
  validationResponse,
} from '@/lib/api/routeHelpers';
import {
  deleteArticle,
  updateArticle,
} from '@/lib/marketing/articleService';
import { articleSchema } from '@/lib/marketing/marketingValidation';

const MARKETING_ROLES = ['SUPERADMIN', 'OWNER'];

export async function PATCH(request, { params }) {
  const { user, response } = await requireApiUser(MARKETING_ROLES);
  if (response) return response;

  const { body, response: bodyResponse } = await parseJsonBody(request);
  if (bodyResponse) return bodyResponse;

  const parsed = articleSchema.safeParse(body);
  if (!parsed.success) return validationResponse(parsed.error);

  try {
    const { id } = await params;
    const article = await updateArticle(id, parsed.data, user);
    revalidateTag('articles', 'max');
    revalidateTag('public-landing', 'max');
    revalidateTag(`article:${article.slug}`, 'max');
    return NextResponse.json({ data: article });
  } catch (error) {
    return handleApiError(error, 'Artikel');
  }
}

export async function DELETE(_request, { params }) {
  const { user, response } = await requireApiUser(MARKETING_ROLES);
  if (response) return response;

  try {
    const { id } = await params;
    const result = await deleteArticle(id, user);
    revalidateTag('articles', 'max');
    revalidateTag('public-landing', 'max');
    revalidateTag(`article:${result.slug}`, 'max');
    return NextResponse.json({ data: result });
  } catch (error) {
    return handleApiError(error, 'Artikel');
  }
}
