import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/api/routeHelpers";
import { canAccessFeature } from "@/lib/auth/permissions";
import { getPlainTextFromHtml, sanitizeArticleHtml } from "./sanitizeHtml";

function assertMarketingAccess(actor) {
    if (!actor || !canAccessFeature(actor.role, "marketing")) {
        throw new ApiError(
            403,
            "FORBIDDEN",
            "Akun Anda tidak memiliki izin untuk mengelola Marketing.",
        );
    }
}

export function slugifyArticleTitle(value) {
    const slug = String(value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 180);

    return slug || "artikel";
}

async function resolveUniqueSlug(client, desiredSlug, excludeId = null) {
    const baseSlug = slugifyArticleTitle(desiredSlug);
    let candidate = baseSlug;
    let suffix = 2;

    while (true) {
        const existing = await client.article.findUnique({
            where: { slug: candidate },
            select: { id: true },
        });

        if (!existing || existing.id === excludeId) return candidate;

        candidate = `${baseSlug.slice(0, 190)}-${suffix}`;
        suffix += 1;
    }
}

function normalizeTags(tags) {
    if (!Array.isArray(tags)) return [];
    return [
        ...new Set(tags.map((tag) => String(tag).trim()).filter(Boolean)),
    ].slice(0, 10);
}

export function mapArticle(article) {
    const plainText = getPlainTextFromHtml(article.content ?? "");
    const wordCount = plainText.split(/\s+/).filter(Boolean).length;

    return {
        id: article.id,
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        content: sanitizeArticleHtml(article.content),
        category: article.category,
        tags: normalizeTags(article.tags),
        featuredImageUrl: article.featuredImageUrl ?? "",
        featuredImageAlt: article.featuredImageAlt ?? "",
        seoTitle: article.seoTitle ?? "",
        seoDescription: article.seoDescription ?? "",
        authorId: article.authorId ?? null,
        authorName: article.author?.name ?? article.authorName,
        status: article.status,
        scheduledAt:
            article.scheduledAt?.toISOString?.() ?? article.scheduledAt ?? null,
        publishedAt:
            article.publishedAt?.toISOString?.() ?? article.publishedAt ?? null,
        viewCount: article.viewCount,
        readingTime: Math.max(1, Math.ceil(wordCount / 180)),
        createdAt: article.createdAt?.toISOString?.() ?? article.createdAt,
        updatedAt: article.updatedAt?.toISOString?.() ?? article.updatedAt,
    };
}

async function toWriteData(client, data, actor, existing = null) {
    const content = sanitizeArticleHtml(data.content);
    const plainText = getPlainTextFromHtml(content);

    if (plainText.length < 20) {
        throw new ApiError(
            400,
            "ARTICLE_CONTENT_TOO_SHORT",
            "Isi artikel terlalu singkat setelah HTML dibersihkan.",
        );
    }

    const now = new Date();
    const slug = await resolveUniqueSlug(
        client,
        data.slug || data.title,
        existing?.id ?? null,
    );

    return {
        title: data.title,
        slug,
        excerpt: data.excerpt,
        content,
        category: data.category,
        tags: normalizeTags(data.tags),
        featuredImageUrl: data.featuredImageUrl,
        featuredImageAlt: data.featuredImageAlt,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        authorId: existing?.authorId ?? actor.id,
        authorName: existing?.authorName ?? actor.name,
        status: data.status,
        scheduledAt: data.status === "SCHEDULED" ? data.scheduledAt : null,
        publishedAt:
            data.status === "PUBLISHED"
                ? (existing?.publishedAt ?? now)
                : data.status === "ARCHIVED"
                  ? (existing?.publishedAt ?? null)
                  : data.status === "SCHEDULED"
                    ? null
                    : (existing?.publishedAt ?? null),
    };
}

const articleInclude = {
    author: { select: { id: true, name: true } },
};

export function sanitizeArticlePreview(content, actor) {
    assertMarketingAccess(actor);

    return sanitizeArticleHtml(content);
}

export async function getArticles(actor) {
    assertMarketingAccess(actor);

    const articles = await prisma.article.findMany({
        include: articleInclude,
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    });

    return articles.map(mapArticle);
}

export async function createArticle(data, actor) {
    assertMarketingAccess(actor);

    const writeData = await toWriteData(prisma, data, actor);
    const article = await prisma.article.create({
        data: writeData,
        include: articleInclude,
    });

    return mapArticle(article);
}

export async function updateArticle(id, data, actor) {
    assertMarketingAccess(actor);

    const existing = await prisma.article.findUnique({ where: { id } });
    if (!existing) {
        throw new ApiError(404, "NOT_FOUND", "Artikel tidak ditemukan.");
    }

    const writeData = await toWriteData(prisma, data, actor, existing);
    const article = await prisma.article.update({
        where: { id },
        data: writeData,
        include: articleInclude,
    });

    return mapArticle(article);
}

export async function deleteArticle(id, actor) {
    assertMarketingAccess(actor);

    const existing = await prisma.article.findUnique({
        where: { id },
        select: { id: true, title: true, slug: true },
    });

    if (!existing) {
        throw new ApiError(404, "NOT_FOUND", "Artikel tidak ditemukan.");
    }

    await prisma.article.delete({ where: { id } });
    return existing;
}
