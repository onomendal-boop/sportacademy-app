import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { requireApiUser } from '@/lib/auth/apiAuth';
import {
  handleApiError,
  parseJsonBody,
  validationResponse,
} from '@/lib/api/routeHelpers';
import {
  createArticle,
  getArticles,
} from '@/lib/marketing/articleService';
import { articleSchema } from '@/lib/marketing/marketingValidation';

const MARKETING_ROLES = ['SUPERADMIN', 'OWNER'];

export async function GET() {
  const { user, response } = await requireApiUser(MARKETING_ROLES);
  if (response) return response;

  try {
    return NextResponse.json({ data: await getArticles(user) });
  } catch (error) {
    return handleApiError(error, 'Artikel');
  }
}

export async function POST(request) {
  const { user, response } = await requireApiUser(MARKETING_ROLES);
  if (response) return response;

  const { body, response: bodyResponse } = await parseJsonBody(request);
  if (bodyResponse) return bodyResponse;

  const parsed = articleSchema.safeParse(body);
  if (!parsed.success) return validationResponse(parsed.error);

  try {
    const article = await createArticle(parsed.data, user);
    revalidateTag('articles', 'max');
    revalidateTag('public-landing', 'max');
    revalidateTag(`article:${article.slug}`, 'max');
    return NextResponse.json({ data: article }, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'Artikel');
  }
}
