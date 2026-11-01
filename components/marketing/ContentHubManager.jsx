"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
    Newspaper,
    Plus,
    Search,
    X,
    Check,
    ChevronDown,
    Bold,
    Italic,
    Underline,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    Quote,
    Link2,
    Eraser,
    Eye,
    Pencil,
    Trash2,
    Copy,
    CalendarDays,
    Image as ImageIcon,
    Upload,
    FileText,
    Globe,
    Tags,
    Waves,
    Clock,
} from "lucide-react";

import Card from "../ui/Card";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { articleApi } from "@/lib/marketing/marketingClient";

/* -------------------------------------------------------------------------- */
/* CONSTANTS & DATABASE ADAPTERS                                            */
/* -------------------------------------------------------------------------- */

const ARTICLE_CATEGORIES = [
    "Tips Renang",
    "Kesehatan Anak",
    "Parenting",
    "Prestasi",
    "Promo",
    "Event",
    "Edukasi Pelatih",
];

const STATUS_META = {
    draft: { label: "Draft", badgeStatus: "inactive" },
    scheduled: { label: "Scheduled", badgeStatus: "pending" },
    published: { label: "Published", badgeStatus: "active" },
    archived: { label: "Archived", badgeStatus: "cancelled" },
};

const CATEGORY_GRADIENTS = {
    "Tips Renang": "from-[#0066CC] to-cyan-400",
    "Kesehatan Anak": "from-emerald-600 to-teal-400",
    Parenting: "from-sky-700 to-blue-400",
    Prestasi: "from-indigo-700 to-blue-500",
    Promo: "from-amber-500 to-orange-400",
    Event: "from-cyan-700 to-sky-400",
    "Edukasi Pelatih": "from-slate-700 to-slate-500",
};

function toUiArticle(article) {
    return {
        ...article,
        status: String(article.status ?? "DRAFT").toLowerCase(),
        tags: Array.isArray(article.tags) ? article.tags : [],
        featuredImageUrl: article.featuredImageUrl ?? "",
        featuredImageAlt: article.featuredImageAlt ?? "",
        seoTitle: article.seoTitle ?? "",
        seoDescription: article.seoDescription ?? "",
        scheduledAt: article.scheduledAt ?? null,
        publishedAt: article.publishedAt ?? null,
    };
}

function toApiArticle(article) {
    return {
        title: article.title,
        slug: article.slug || null,
        excerpt: article.excerpt,
        content: article.content,
        category: article.category,
        tags: Array.isArray(article.tags) ? article.tags : [],
        featuredImageUrl: article.featuredImageUrl || null,
        featuredImageAlt: article.featuredImageAlt || null,
        seoTitle: article.seoTitle || null,
        seoDescription: article.seoDescription || null,
        status: String(article.status ?? "draft").toUpperCase(),
        scheduledAt:
            article.status === "scheduled" && article.scheduledAt
                ? new Date(article.scheduledAt).toISOString()
                : null,
    };
}

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

function cn(...classes) {
    return classes.filter(Boolean).join(" ");
}

function addDays(date, amount) {
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + amount);
    return nextDate;
}

function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDate(date) {
    if (!date) return "-";
    return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(date);
}

function toDatetimeLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hour = String(date.getHours()).padStart(2, "0");
    const minute = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hour}:${minute}`;
}

function slugify(value) {
    return String(value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 180);
}

function stripHtml(html) {
    return String(html ?? "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function countWords(html) {
    const text = stripHtml(html);
    return text ? text.split(/\s+/).length : 0;
}

function getInputClassName(hasError, additionalClassName = "") {
    return cn(
        "mt-1.5 h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4",
        hasError
            ? "border-red-300 focus:border-red-500 focus:ring-red-500/10"
            : "border-slate-200 focus:border-[#0066CC] focus:ring-blue-600/10",
        additionalClassName,
    );
}

function getSelectClassName(hasError, additionalClassName = "") {
    return cn(
        getInputClassName(hasError, "appearance-none pr-10"),
        additionalClassName,
    );
}

function FeaturedImage({
    article,
    className = "",
    imageClassName = "h-full w-full object-cover",
}) {
    if (article.featuredImageUrl) {
        return (
            <div className={cn("overflow-hidden bg-slate-100", className)}>
                {/* Data URL/URL gambar disimpan di database pada kolom featuredImageUrl. */}
                <img
                    src={article.featuredImageUrl}
                    alt={article.featuredImageAlt || article.title}
                    className={imageClassName}
                />
            </div>
        );
    }

    return (
        <div
            className={cn(
                "relative flex items-center justify-center overflow-hidden bg-gradient-to-br text-white",
                CATEGORY_GRADIENTS[article.category] ??
                    CATEGORY_GRADIENTS["Tips Renang"],
                className,
            )}
            aria-label={article.featuredImageAlt || article.title}
            role="img"
        >
            <Waves className="h-12 w-12 opacity-90" />
            <span className="absolute bottom-2 left-3 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold backdrop-blur">
                {article.category}
            </span>
        </div>
    );
}

function ContentSkeleton() {
    return (
        <div role="status" aria-label="Memuat artikel" className="space-y-4">
            <span className="sr-only">Memuat Content Hub...</span>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                    <Card key={index} padded>
                        <div className="h-10 w-10 animate-pulse rounded-2xl bg-slate-200" />
                        <div className="mt-4 h-4 w-24 animate-pulse rounded bg-slate-200" />
                        <div className="mt-2 h-7 w-16 animate-pulse rounded bg-slate-200" />
                    </Card>
                ))}
            </div>
            {Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} padded>
                    <div className="flex gap-4">
                        <div className="h-28 w-40 animate-pulse rounded-2xl bg-slate-200" />
                        <div className="flex-1 space-y-3 py-2">
                            <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
                            <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
                            <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}

function StatCard({ label, value, description }) {
    return (
        <Card padded hover>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {label}
            </p>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">
                {value}
            </p>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
        </Card>
    );
}

/* -------------------------------------------------------------------------- */
/* ARTICLE PREVIEW MODAL                                                      */
/* -------------------------------------------------------------------------- */

function ArticlePreviewModal({ article, onClose }) {
    if (!article) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
            <button
                type="button"
                aria-label="Tutup preview artikel"
                onClick={onClose}
                className="absolute inset-0 cursor-default bg-slate-950/50 backdrop-blur-[2px]"
            />
            <article
                role="dialog"
                aria-modal="true"
                aria-labelledby="article-preview-title"
                className="relative flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
            >
                <div className="relative shrink-0">
                    <FeaturedImage
                        article={article}
                        className="h-52 w-full sm:h-64"
                    />
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Tutup preview"
                        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-slate-950/45 text-white backdrop-blur transition-colors hover:bg-slate-950/65"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge
                            status={STATUS_META[article.status]?.badgeStatus}
                        >
                            {STATUS_META[article.status]?.label}
                        </Badge>
                        <span className="text-xs font-semibold text-[#0066CC]">
                            {article.category}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                            <Clock className="h-3.5 w-3.5" />
                            {Math.max(
                                1,
                                Math.ceil(countWords(article.content) / 200),
                            )}{" "}
                            menit baca
                        </span>
                    </div>

                    <h3
                        id="article-preview-title"
                        className="mt-4 text-3xl font-extrabold leading-tight text-slate-900"
                    >
                        {article.title}
                    </h3>
                    <p className="mt-3 text-base leading-relaxed text-slate-500">
                        {article.excerpt}
                    </p>
                    <p className="mt-4 border-y border-slate-100 py-3 text-sm text-slate-500">
                        Oleh{" "}
                        <span className="font-bold text-slate-900">
                            {article.authorName}
                        </span>{" "}
                        •{" "}
                        <span className="font-mono text-xs">
                            /blog/{article.slug}
                        </span>
                    </p>

                    {/* HTML artikel sudah disanitasi server sebelum disimpan ke database. */}
                    <div
                        className="article-preview mt-5 text-[15px] leading-8 text-slate-700 [&_blockquote]:border-l-4 [&_blockquote]:border-[#0066CC] [&_blockquote]:bg-blue-50 [&_blockquote]:px-4 [&_blockquote]:py-2 [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-2xl [&_h2]:font-extrabold [&_h2]:text-slate-900 [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-slate-900 [&_li]:ml-5 [&_ol]:list-decimal [&_p]:mb-4 [&_ul]:list-disc"
                        dangerouslySetInnerHTML={{ __html: article.content }}
                    />
                </div>
            </article>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* SIMPLE WYSIWYG EDITOR                                                      */
/* -------------------------------------------------------------------------- */

function ArticleEditor({
    initialArticle,
    existingArticles,
    today,
    currentAuthorName = "",
    onCancel,
    onSave,
}) {
    const editorRef = useRef(null);
    const fileInputRef = useRef(null);
    const previewRequestRef = useRef(0);
    const isEdit = Boolean(initialArticle?.id);

    const [slugManuallyEdited, setSlugManuallyEdited] = useState(isEdit);
    const [contentHtml, setContentHtml] = useState(
        initialArticle?.content ?? "<p>Mulai tulis artikel di sini...</p>",
    );
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [sanitizedPreviewHtml, setSanitizedPreviewHtml] = useState("");
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState(() => {
        const scheduledDate = initialArticle?.scheduledAt
            ? new Date(initialArticle.scheduledAt)
            : addDays(today ?? new Date(), 1);
        if (!initialArticle?.scheduledAt) scheduledDate.setHours(9, 0, 0, 0);

        return {
            title: initialArticle?.title ?? "",
            slug: initialArticle?.slug ?? "",
            excerpt: initialArticle?.excerpt ?? "",
            category: initialArticle?.category ?? ARTICLE_CATEGORIES[0],
            tags: initialArticle?.tags?.join(", ") ?? "",
            featuredImageUrl: initialArticle?.featuredImageUrl ?? "",
            featuredImageAlt: initialArticle?.featuredImageAlt ?? "",
            seoTitle: initialArticle?.seoTitle ?? "",
            seoDescription: initialArticle?.seoDescription ?? "",
            authorName: initialArticle?.authorName ?? currentAuthorName,
            status: initialArticle?.status ?? "draft",
            scheduledAt: toDatetimeLocal(scheduledDate),
        };
    });

    useEffect(() => {
        if (editorRef.current) {
            editorRef.current.innerHTML =
                initialArticle?.content ??
                "<p>Mulai tulis artikel di sini...</p>";
        }
        // Editor dirender dengan key artikel, sehingga inisialisasi cukup sekali.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        return () => {
            previewRequestRef.current += 1;
        };
    }, []);

    const wordCount = countWords(contentHtml);

    function handleFieldChange(event) {
        const { name, value } = event.target;
        setErrors((prev) => ({ ...prev, [name]: "" }));

        if (name === "title") {
            setFormData((prev) => ({
                ...prev,
                title: value,
                slug: slugManuallyEdited ? prev.slug : slugify(value),
                seoTitle: prev.seoTitle || value,
            }));
            return;
        }

        if (name === "slug") {
            setSlugManuallyEdited(true);
            setFormData((prev) => ({ ...prev, slug: value }));
            return;
        }

        setFormData((prev) => ({ ...prev, [name]: value }));
    }

    function executeToolbarCommand(command, value = null) {
        editorRef.current?.focus();
        document.execCommand(command, false, value);
        setContentHtml(editorRef.current?.innerHTML ?? "");
    }

    async function togglePreviewMode() {
        if (isPreviewMode) {
            previewRequestRef.current += 1;
            setIsPreviewMode(false);
            return;
        }

        const requestId = ++previewRequestRef.current;
        setIsPreviewLoading(true);

        try {
            const result = await articleApi.preview(contentHtml);
            if (previewRequestRef.current !== requestId) return;

            setSanitizedPreviewHtml(result.content ?? "");
            setIsPreviewMode(true);
        } catch (error) {
            if (previewRequestRef.current !== requestId) return;
            toast.error(
                error?.message ?? "Gagal membuat preview artikel yang aman.",
            );
        } finally {
            if (previewRequestRef.current === requestId) {
                setIsPreviewLoading(false);
            }
        }
    }

    function insertPlainText(event) {
        const transfer = event.clipboardData ?? event.dataTransfer;
        const text = transfer?.getData("text/plain") ?? "";

        // Jangan biarkan HTML clipboard masuk apa adanya ke contentEditable:
        // event handler di dalamnya dapat berjalan di konteks dashboard
        // sebelum HTML sempat disanitasi server. Format dapat ditambahkan
        // kembali dengan toolbar editor.
        event.preventDefault();
        if (!text) return;

        document.execCommand("insertText", false, text);
        setContentHtml(editorRef.current?.innerHTML ?? "");
        setErrors((prev) => ({ ...prev, content: "" }));
    }

    function insertLink() {
        const url = window.prompt(
            "Masukkan URL (gunakan https://):",
            "https://",
        );
        if (!url) return;

        try {
            const parsedUrl = new URL(url);
            if (!["http:", "https:"].includes(parsedUrl.protocol))
                throw new Error("Protocol tidak valid");
            executeToolbarCommand("createLink", parsedUrl.toString());
        } catch {
            setErrors((prev) => ({
                ...prev,
                content: "URL link tidak valid.",
            }));
        }
    }

    function handleImageUpload(event) {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setErrors((prev) => ({
                ...prev,
                featuredImageUrl: "File featured image harus berupa gambar.",
            }));
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            setErrors((prev) => ({
                ...prev,
                featuredImageUrl:
                    "Ukuran gambar maksimal 2 MB untuk disimpan ke database.",
            }));
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setFormData((prev) => ({
                ...prev,
                featuredImageUrl: String(reader.result),
            }));
            setErrors((prev) => ({ ...prev, featuredImageUrl: "" }));
        };
        reader.readAsDataURL(file);
        event.target.value = "";
    }

    function validateForm(normalizedSlug) {
        const nextErrors = {};

        if (formData.title.trim().length < 8)
            nextErrors.title = "Judul artikel minimal 8 karakter.";
        if (!normalizedSlug) nextErrors.slug = "Slug SEO wajib diisi.";
        if (
            existingArticles.some(
                (article) =>
                    article.slug === normalizedSlug &&
                    article.id !== initialArticle?.id,
            )
        ) {
            nextErrors.slug = "Slug ini sudah dipakai artikel lain.";
        }
        if (formData.excerpt.trim().length < 30)
            nextErrors.excerpt = "Ringkasan/excerpt minimal 30 karakter.";
        if (stripHtml(contentHtml).length < 50)
            nextErrors.content = "Isi artikel minimal 50 karakter teks.";
        if (formData.status === "scheduled" && !formData.scheduledAt) {
            nextErrors.scheduledAt =
                "Tanggal dan waktu penjadwalan wajib diisi.";
        }

        return nextErrors;
    }

    function handleSubmit(event) {
        event.preventDefault();

        const normalizedSlug = slugify(formData.slug || formData.title);
        const nextErrors = validateForm(normalizedSlug);
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length) return;

        onSave({
            id: initialArticle?.id,
            title: formData.title.trim(),
            slug: normalizedSlug,
            excerpt: formData.excerpt.trim(),
            content: contentHtml,
            category: formData.category,
            tags: formData.tags
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean),
            featuredImageUrl: formData.featuredImageUrl.trim(),
            featuredImageAlt: formData.featuredImageAlt.trim(),
            seoTitle: formData.seoTitle.trim() || formData.title.trim(),
            seoDescription:
                formData.seoDescription.trim() ||
                formData.excerpt.trim().slice(0, 160),
            authorName: formData.authorName.trim() || "Tim AAA Sport Academy",
            status: formData.status,
            publishedAt: initialArticle?.publishedAt ?? null,
            scheduledAt:
                formData.status === "scheduled"
                    ? new Date(formData.scheduledAt).toISOString()
                    : null,
            viewCount: initialArticle?.viewCount ?? 0,
        });
    }

    const previewArticle = {
        ...formData,
        title: formData.title || "Judul Artikel",
        excerpt: formData.excerpt || "Ringkasan artikel akan tampil di sini.",
        // Hanya untuk metadata/teks turunan. HTML yang dirender pada preview
        // selalu berasal dari sanitizedPreviewHtml hasil server.
        content: contentHtml,
        slug: slugify(formData.slug || formData.title) || "slug-artikel",
    };

    const toolbarButtons = [
        {
            label: "Bold",
            icon: Bold,
            action: () => executeToolbarCommand("bold"),
        },
        {
            label: "Italic",
            icon: Italic,
            action: () => executeToolbarCommand("italic"),
        },
        {
            label: "Underline",
            icon: Underline,
            action: () => executeToolbarCommand("underline"),
        },
        {
            label: "Heading 2",
            icon: Heading2,
            action: () => executeToolbarCommand("formatBlock", "H2"),
        },
        {
            label: "Heading 3",
            icon: Heading3,
            action: () => executeToolbarCommand("formatBlock", "H3"),
        },
        {
            label: "Bullet list",
            icon: List,
            action: () => executeToolbarCommand("insertUnorderedList"),
        },
        {
            label: "Numbered list",
            icon: ListOrdered,
            action: () => executeToolbarCommand("insertOrderedList"),
        },
        {
            label: "Quote",
            icon: Quote,
            action: () => executeToolbarCommand("formatBlock", "BLOCKQUOTE"),
        },
        { label: "Link", icon: Link2, action: insertLink },
        {
            label: "Bersihkan format",
            icon: Eraser,
            action: () => executeToolbarCommand("removeFormat"),
        },
    ];

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-4 sm:space-y-6"
            noValidate
        >
            <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="text-sm font-bold text-[#0066CC] transition-colors hover:text-[#0052A3]"
                    >
                        ← Kembali ke daftar artikel
                    </button>
                    <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                        {isEdit ? "Edit Artikel" : "Tulis Artikel Baru"}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        WYSIWYG sederhana untuk CMS database. HTML disanitasi di
                        server sebelum disimpan dan ditampilkan publik.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={togglePreviewMode}
                        loading={isPreviewLoading}
                        leftIcon={<Eye className="h-4 w-4" />}
                    >
                        {isPreviewLoading
                            ? "Memproses..."
                            : isPreviewMode
                              ? "Kembali Edit"
                              : "Preview"}
                    </Button>
                    <Button
                        type="submit"
                        leftIcon={<Check className="h-4 w-4" />}
                    >
                        {formData.status === "published"
                            ? "Publish Artikel"
                            : formData.status === "scheduled"
                              ? "Jadwalkan Artikel"
                              : "Simpan Draft"}
                    </Button>
                </div>
            </section>

            <div className="grid items-start gap-4 sm:gap-6 xl:grid-cols-3">
                {/* Main Editor */}
                <div className="space-y-4 sm:space-y-6 xl:col-span-2">
                    <Card padded>
                        <div>
                            <label
                                htmlFor="article-title"
                                className="text-sm font-bold text-slate-700"
                            >
                                Judul Artikel{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="article-title"
                                name="title"
                                value={formData.title}
                                onChange={handleFieldChange}
                                placeholder="Tulis judul artikel yang menarik..."
                                className={getInputClassName(
                                    errors.title,
                                    "h-12 text-base font-semibold",
                                )}
                            />
                            {errors.title ? (
                                <p className="mt-1.5 text-xs font-medium text-red-600">
                                    {errors.title}
                                </p>
                            ) : null}
                        </div>

                        <div className="mt-5">
                            <label
                                htmlFor="article-slug"
                                className="inline-flex items-center gap-2 text-sm font-bold text-slate-700"
                            >
                                <Globe className="h-4 w-4 text-[#0066CC]" />
                                Slug SEO <span className="text-red-500">*</span>
                            </label>
                            <div className="mt-1.5 flex overflow-hidden rounded-xl border border-slate-200 bg-white transition focus-within:border-[#0066CC] focus-within:ring-4 focus-within:ring-blue-600/10">
                                <span className="flex shrink-0 items-center bg-slate-50 px-3 text-xs font-semibold text-slate-400 sm:text-sm">
                                    /blog/
                                </span>
                                <input
                                    id="article-slug"
                                    name="slug"
                                    value={formData.slug}
                                    onChange={handleFieldChange}
                                    onBlur={() =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            slug: slugify(prev.slug),
                                        }))
                                    }
                                    placeholder="slug-artikel-seo"
                                    className="h-11 min-w-0 flex-1 px-2 font-mono text-sm outline-none"
                                />
                            </div>
                            <p className="mt-1.5 text-xs text-slate-400">
                                Slug otomatis dibuat dari judul dan masih dapat
                                disesuaikan.
                            </p>
                            {errors.slug ? (
                                <p className="mt-1.5 text-xs font-medium text-red-600">
                                    {errors.slug}
                                </p>
                            ) : null}
                        </div>

                        <div className="mt-5">
                            <label
                                htmlFor="article-excerpt"
                                className="text-sm font-bold text-slate-700"
                            >
                                Ringkasan / Excerpt{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                id="article-excerpt"
                                name="excerpt"
                                value={formData.excerpt}
                                onChange={handleFieldChange}
                                rows={3}
                                maxLength={280}
                                placeholder="Ringkasan singkat untuk kartu artikel dan hasil pencarian..."
                                className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 px-3.5 py-3 text-sm leading-relaxed outline-none transition placeholder:text-slate-400 focus:border-[#0066CC] focus:ring-4 focus:ring-blue-600/10"
                            />
                            <div className="mt-1.5 flex justify-between gap-3 text-xs text-slate-400">
                                <span>
                                    {errors.excerpt ? (
                                        <span className="font-medium text-red-600">
                                            {errors.excerpt}
                                        </span>
                                    ) : (
                                        "Idealnya 120-180 karakter."
                                    )}
                                </span>
                                <span>{formData.excerpt.length}/280</span>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h3 className="font-extrabold text-slate-900">
                                        Isi Artikel
                                    </h3>
                                    <p className="mt-0.5 text-xs text-slate-400">
                                        {wordCount} kata • sekitar{" "}
                                        {Math.max(
                                            1,
                                            Math.ceil(wordCount / 200),
                                        )}{" "}
                                        menit baca
                                    </p>
                                </div>
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-[#0066CC]">
                                    <FileText className="h-3.5 w-3.5" />
                                    WYSIWYG
                                </span>
                            </div>

                            {!isPreviewMode ? (
                                <div
                                    className="mt-4 flex flex-wrap gap-1.5"
                                    aria-label="Toolbar editor artikel"
                                >
                                    {toolbarButtons.map((button) => {
                                        const Icon = button.icon;
                                        return (
                                            <button
                                                key={button.label}
                                                type="button"
                                                title={button.label}
                                                aria-label={button.label}
                                                onMouseDown={(event) =>
                                                    event.preventDefault()
                                                }
                                                onClick={button.action}
                                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-[#0066CC]"
                                            >
                                                <Icon className="h-4 w-4" />
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : null}
                        </div>

                        {isPreviewMode ? (
                            <div
                                className="min-h-96 px-5 py-6 text-[15px] leading-8 text-slate-700 sm:px-8 [&_blockquote]:border-l-4 [&_blockquote]:border-[#0066CC] [&_blockquote]:bg-blue-50 [&_blockquote]:px-4 [&_blockquote]:py-2 [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-2xl [&_h2]:font-extrabold [&_h2]:text-slate-900 [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-slate-900 [&_li]:ml-5 [&_ol]:list-decimal [&_p]:mb-4 [&_ul]:list-disc"
                                dangerouslySetInnerHTML={{
                                    __html: sanitizedPreviewHtml,
                                }}
                            />
                        ) : (
                            <div
                                ref={editorRef}
                                contentEditable
                                suppressContentEditableWarning
                                onInput={() => {
                                    setContentHtml(
                                        editorRef.current?.innerHTML ?? "",
                                    );
                                    setErrors((prev) => ({
                                        ...prev,
                                        content: "",
                                    }));
                                }}
                                onPaste={insertPlainText}
                                onDrop={insertPlainText}
                                data-placeholder="Mulai tulis artikel di sini..."
                                className="min-h-96 px-5 py-6 text-[15px] leading-8 text-slate-700 outline-none sm:px-8 [&_blockquote]:border-l-4 [&_blockquote]:border-[#0066CC] [&_blockquote]:bg-blue-50 [&_blockquote]:px-4 [&_blockquote]:py-2 [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-2xl [&_h2]:font-extrabold [&_h2]:text-slate-900 [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-slate-900 [&_li]:ml-5 [&_ol]:list-decimal [&_p]:mb-4 [&_ul]:list-disc"
                            />
                        )}

                        {errors.content ? (
                            <p className="border-t border-red-100 bg-red-50 px-5 py-3 text-xs font-medium text-red-600 sm:px-6">
                                {errors.content}
                            </p>
                        ) : null}
                    </Card>
                </div>

                {/* Publish Settings */}
                <aside className="space-y-4 sm:space-y-6 xl:sticky xl:top-24">
                    <Card
                        title="Pengaturan Publikasi"
                        description="Status dan jadwal terbit artikel."
                    >
                        <div className="grid grid-cols-3 gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1">
                            {Object.entries(STATUS_META).map(
                                ([value, meta]) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                status: value,
                                            }))
                                        }
                                        aria-pressed={formData.status === value}
                                        className={cn(
                                            "h-9 rounded-xl px-2 text-xs font-bold transition-colors sm:text-sm",
                                            formData.status === value
                                                ? "bg-[#0066CC] text-white shadow-sm"
                                                : "text-slate-500 hover:bg-white hover:text-[#0066CC]",
                                        )}
                                    >
                                        {meta.label}
                                    </button>
                                ),
                            )}
                        </div>

                        {formData.status === "scheduled" ? (
                            <div className="mt-5">
                                <label
                                    htmlFor="article-scheduled-at"
                                    className="text-sm font-bold text-slate-700"
                                >
                                    Jadwal Terbit{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="article-scheduled-at"
                                    name="scheduledAt"
                                    type="datetime-local"
                                    value={formData.scheduledAt}
                                    onChange={handleFieldChange}
                                    className={getInputClassName(
                                        errors.scheduledAt,
                                    )}
                                />
                                {errors.scheduledAt ? (
                                    <p className="mt-1.5 text-xs font-medium text-red-600">
                                        {errors.scheduledAt}
                                    </p>
                                ) : null}
                            </div>
                        ) : null}

                        <div className="mt-5">
                            <label
                                htmlFor="article-category"
                                className="text-sm font-bold text-slate-700"
                            >
                                Kategori
                            </label>
                            <div className="relative">
                                <select
                                    id="article-category"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleFieldChange}
                                    className={getSelectClassName(false)}
                                >
                                    {ARTICLE_CATEGORIES.map((category) => (
                                        <option key={category} value={category}>
                                            {category}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 pt-1.5 text-slate-400" />
                            </div>
                        </div>

                        <div className="mt-5">
                            <label
                                htmlFor="article-author"
                                className="text-sm font-bold text-slate-700"
                            >
                                Penulis
                            </label>
                            <input
                                id="article-author"
                                name="authorName"
                                value={formData.authorName}
                                disabled
                                className={getInputClassName(
                                    false,
                                    "bg-slate-50 text-slate-500",
                                )}
                            />
                            <p className="mt-1.5 text-xs text-slate-400">
                                Artikel baru otomatis memakai akun login sebagai
                                penulis database.
                            </p>
                        </div>

                        <div className="mt-5">
                            <label
                                htmlFor="article-tags"
                                className="inline-flex items-center gap-2 text-sm font-bold text-slate-700"
                            >
                                <Tags className="h-4 w-4 text-[#0066CC]" /> Tags
                            </label>
                            <input
                                id="article-tags"
                                name="tags"
                                value={formData.tags}
                                onChange={handleFieldChange}
                                placeholder="renang anak, tips, keamanan"
                                className={getInputClassName(false)}
                            />
                            <p className="mt-1.5 text-xs text-slate-400">
                                Pisahkan dengan koma.
                            </p>
                        </div>
                    </Card>

                    <Card
                        title="Featured Image"
                        description="Gunakan URL gambar atau unggah file untuk disimpan ke database."
                    >
                        <FeaturedImage
                            article={previewArticle}
                            className="h-44 w-full rounded-2xl"
                        />

                        <label
                            htmlFor="featured-image-url"
                            className="mt-5 block text-sm font-bold text-slate-700"
                        >
                            URL Gambar
                        </label>
                        <input
                            id="featured-image-url"
                            name="featuredImageUrl"
                            value={
                                formData.featuredImageUrl.startsWith("data:")
                                    ? ""
                                    : formData.featuredImageUrl
                            }
                            onChange={handleFieldChange}
                            placeholder="https://example.com/gambar.jpg"
                            className={getInputClassName(
                                errors.featuredImageUrl,
                            )}
                        />

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                        />
                        <div className="mt-3 flex gap-2">
                            <Button
                                type="button"
                                variant="secondary"
                                className="flex-1"
                                onClick={() => fileInputRef.current?.click()}
                                leftIcon={<Upload className="h-4 w-4" />}
                            >
                                Upload Gambar
                            </Button>
                            {formData.featuredImageUrl ? (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            featuredImageUrl: "",
                                        }))
                                    }
                                >
                                    Hapus
                                </Button>
                            ) : null}
                        </div>
                        {errors.featuredImageUrl ? (
                            <p className="mt-2 text-xs font-medium text-red-600">
                                {errors.featuredImageUrl}
                            </p>
                        ) : (
                            <p className="mt-2 text-xs text-slate-400">
                                Upload maksimal 2 MB dan disimpan sebagai data
                                URL di database.
                            </p>
                        )}

                        <label
                            htmlFor="featured-image-alt"
                            className="mt-5 block text-sm font-bold text-slate-700"
                        >
                            Alt Text Gambar
                        </label>
                        <input
                            id="featured-image-alt"
                            name="featuredImageAlt"
                            value={formData.featuredImageAlt}
                            onChange={handleFieldChange}
                            placeholder="Deskripsi gambar untuk aksesibilitas dan SEO"
                            className={getInputClassName(false)}
                        />
                    </Card>

                    <Card
                        title="SEO"
                        description="Judul dan deskripsi untuk mesin pencari serta media sosial."
                    >
                        <label
                            htmlFor="seo-title"
                            className="text-sm font-bold text-slate-700"
                        >
                            SEO Title
                        </label>
                        <input
                            id="seo-title"
                            name="seoTitle"
                            value={formData.seoTitle}
                            onChange={handleFieldChange}
                            maxLength={70}
                            placeholder="Judul SEO maksimal sekitar 60-70 karakter"
                            className={getInputClassName(false)}
                        />
                        <p className="mt-1.5 text-right text-xs text-slate-400">
                            {formData.seoTitle.length}/70
                        </p>

                        <label
                            htmlFor="seo-description"
                            className="mt-4 block text-sm font-bold text-slate-700"
                        >
                            Meta Description
                        </label>
                        <textarea
                            id="seo-description"
                            name="seoDescription"
                            value={formData.seoDescription}
                            onChange={handleFieldChange}
                            rows={4}
                            maxLength={160}
                            placeholder="Deskripsi singkat yang mendorong klik dari hasil pencarian..."
                            className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 px-3.5 py-3 text-sm leading-relaxed outline-none transition placeholder:text-slate-400 focus:border-[#0066CC] focus:ring-4 focus:ring-blue-600/10"
                        />
                        <p className="mt-1.5 text-right text-xs text-slate-400">
                            {formData.seoDescription.length}/160
                        </p>

                        <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                            <p className="truncate text-xs text-emerald-700">
                                aaasport.academy/blog/{previewArticle.slug}
                            </p>
                            <p className="mt-1 line-clamp-2 font-bold leading-snug text-[#0066CC]">
                                {formData.seoTitle || previewArticle.title}
                            </p>
                            <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-slate-500">
                                {formData.seoDescription ||
                                    previewArticle.excerpt}
                            </p>
                        </div>
                    </Card>
                </aside>
            </div>
        </form>
    );
}

/* -------------------------------------------------------------------------- */
/* PAGE                                                                       */
/* -------------------------------------------------------------------------- */

export default function ContentHubManager({
    initialArticles = [],
    currentAuthorName = "",
}) {
    const router = useRouter();
    const [articles, setArticles] = useState(() =>
        initialArticles.map(toUiArticle),
    );
    const [today, setToday] = useState(null);
    const [notification, setNotification] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [viewMode, setViewMode] = useState("list");
    const [editingArticle, setEditingArticle] = useState(null);
    const [previewArticle, setPreviewArticle] = useState(null);

    useEffect(() => {
        setToday(new Date());
    }, []);

    useEffect(() => {
        if (!notification) return undefined;
        const timer = window.setTimeout(() => setNotification(""), 4000);
        return () => window.clearTimeout(timer);
    }, [notification]);

    useEffect(() => {
        document.body.style.overflow = previewArticle ? "hidden" : "";

        function handleEscape(event) {
            if (event.key === "Escape") setPreviewArticle(null);
        }

        document.addEventListener("keydown", handleEscape);
        return () => {
            document.body.style.overflow = "";
            document.removeEventListener("keydown", handleEscape);
        };
    }, [previewArticle]);

    const filteredArticles = useMemo(() => {
        const keyword = searchQuery.trim().toLowerCase();

        return articles.filter((article) => {
            const matchesCategory =
                categoryFilter === "all" || article.category === categoryFilter;
            const matchesStatus =
                statusFilter === "all" || article.status === statusFilter;
            const matchesSearch =
                !keyword ||
                article.title.toLowerCase().includes(keyword) ||
                article.slug.toLowerCase().includes(keyword) ||
                article.excerpt.toLowerCase().includes(keyword) ||
                article.tags.some((tag) => tag.toLowerCase().includes(keyword));

            return matchesCategory && matchesStatus && matchesSearch;
        });
    }, [articles, searchQuery, categoryFilter, statusFilter]);

    const articleStats = useMemo(
        () => ({
            published: articles.filter(
                (article) => article.status === "published",
            ).length,
            scheduled: articles.filter(
                (article) => article.status === "scheduled",
            ).length,
            draft: articles.filter((article) => article.status === "draft")
                .length,
            views: articles.reduce(
                (sum, article) => sum + article.viewCount,
                0,
            ),
        }),
        [articles],
    );

    function openCreate() {
        setEditingArticle(null);
        setViewMode("editor");
    }

    function openEdit(article) {
        setEditingArticle(article);
        setViewMode("editor");
    }

    async function handleSaveArticle(payload) {
        try {
            const saved = payload.id
                ? await articleApi.update(payload.id, toApiArticle(payload))
                : await articleApi.create(toApiArticle(payload));
            const uiArticle = toUiArticle(saved);

            setArticles((prev) =>
                payload.id
                    ? prev.map((article) =>
                          article.id === payload.id ? uiArticle : article,
                      )
                    : [uiArticle, ...prev],
            );
            setNotification(
                payload.id
                    ? `Artikel "${uiArticle.title}" berhasil diperbarui di database.`
                    : `Artikel "${uiArticle.title}" berhasil dibuat sebagai ${STATUS_META[uiArticle.status].label}.`,
            );
            setEditingArticle(null);
            setViewMode("list");
            router.refresh();
        } catch (error) {
            toast.error(
                error?.message ?? "Gagal menyimpan artikel ke database.",
            );
        }
    }

    async function duplicateArticle(article) {
        const duplicated = {
            ...article,
            id: undefined,
            title: `${article.title} (Salinan)`,
            slug: `${article.slug}-salinan`,
            status: "draft",
            publishedAt: null,
            scheduledAt: null,
            viewCount: 0,
        };

        try {
            const saved = await articleApi.create(toApiArticle(duplicated));
            setArticles((prev) => [toUiArticle(saved), ...prev]);
            setNotification(
                `Salinan draft "${article.title}" berhasil disimpan ke database.`,
            );
            router.refresh();
        } catch (error) {
            toast.error(
                error?.message ?? "Gagal menduplikasi artikel ke database.",
            );
        }
    }

    async function publishNow(article) {
        try {
            const saved = await articleApi.update(
                article.id,
                toApiArticle({ ...article, status: "published" }),
            );
            setArticles((prev) =>
                prev.map((item) =>
                    item.id === article.id ? toUiArticle(saved) : item,
                ),
            );
            setNotification(
                `Artikel "${article.title}" berhasil dipublikasikan.`,
            );
            router.refresh();
        } catch (error) {
            toast.error(error?.message ?? "Gagal mempublikasikan artikel.");
        }
    }

    async function deleteArticle(article) {
        try {
            await articleApi.remove(article.id);
            setArticles((prev) =>
                prev.filter((item) => item.id !== article.id),
            );
            setNotification(
                `Artikel "${article.title}" berhasil dihapus dari database.`,
            );
            router.refresh();
        } catch (error) {
            toast.error(
                error?.message ?? "Gagal menghapus artikel dari database.",
            );
        }
    }

    function getArticleDate(article) {
        if (article.status === "published") {
            return article.publishedAt ? new Date(article.publishedAt) : null;
        }
        if (article.status === "scheduled") {
            return article.scheduledAt ? new Date(article.scheduledAt) : null;
        }
        return article.publishedAt ? new Date(article.publishedAt) : null;
    }

    if (viewMode === "editor" && today) {
        return (
            <ArticleEditor
                key={editingArticle?.id ?? "new-article"}
                initialArticle={editingArticle}
                existingArticles={articles}
                today={today}
                currentAuthorName={currentAuthorName}
                onCancel={() => {
                    setEditingArticle(null);
                    setViewMode("list");
                }}
                onSave={handleSaveArticle}
            />
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge status="active">Marketing</Badge>
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
                            <Newspaper className="h-3.5 w-3.5" />
                            Mini CMS Artikel & Blog
                        </span>
                    </div>
                    <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                        Content Hub
                    </h2>
                    <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-500 sm:text-base">
                        Tulis dan jadwalkan artikel edukasi, promo, parenting,
                        dan prestasi untuk landing page AAA Sport Academy.
                    </p>
                </div>
                <Button
                    onClick={openCreate}
                    leftIcon={<Plus className="h-4 w-4" />}
                    className="shrink-0"
                >
                    Tulis Artikel
                </Button>
            </section>

            {notification ? (
                <div
                    role="status"
                    className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
                >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                        <Check className="h-4 w-4" />
                    </span>
                    <p className="min-w-0 flex-1">{notification}</p>
                    <button
                        type="button"
                        onClick={() => setNotification("")}
                        aria-label="Tutup notifikasi"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-emerald-100"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            ) : null}

            {!today ? (
                <ContentSkeleton />
            ) : (
                <>
                    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <StatCard
                            label="Published"
                            value={articleStats.published}
                            description="Artikel yang sudah tayang di blog"
                        />
                        <StatCard
                            label="Scheduled"
                            value={articleStats.scheduled}
                            description="Artikel menunggu jadwal terbit"
                        />
                        <StatCard
                            label="Draft"
                            value={articleStats.draft}
                            description="Konten yang masih dalam proses penulisan"
                        />
                        <StatCard
                            label="Total Views"
                            value={articleStats.views.toLocaleString("id-ID")}
                            description="Kunjungan artikel terbit yang tercatat di database"
                        />
                    </section>

                    <Card>
                        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:p-5 xl:flex-row xl:items-center">
                            <div className="relative flex-1">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="search"
                                    value={searchQuery}
                                    onChange={(event) =>
                                        setSearchQuery(event.target.value)
                                    }
                                    placeholder="Cari judul, slug, ringkasan, atau tag..."
                                    aria-label="Cari artikel"
                                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#0066CC] focus:bg-white focus:ring-4 focus:ring-blue-600/10"
                                />
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2 xl:w-[430px]">
                                <div className="relative">
                                    <select
                                        value={categoryFilter}
                                        onChange={(event) =>
                                            setCategoryFilter(
                                                event.target.value,
                                            )
                                        }
                                        aria-label="Filter kategori artikel"
                                        className={getSelectClassName(
                                            false,
                                            "mt-0 bg-white",
                                        )}
                                    >
                                        <option value="all">
                                            Semua Kategori
                                        </option>
                                        {ARTICLE_CATEGORIES.map((category) => (
                                            <option
                                                key={category}
                                                value={category}
                                            >
                                                {category}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                </div>

                                <div className="relative">
                                    <select
                                        value={statusFilter}
                                        onChange={(event) =>
                                            setStatusFilter(event.target.value)
                                        }
                                        aria-label="Filter status artikel"
                                        className={getSelectClassName(
                                            false,
                                            "mt-0 bg-white",
                                        )}
                                    >
                                        <option value="all">
                                            Semua Status
                                        </option>
                                        {Object.entries(STATUS_META).map(
                                            ([value, meta]) => (
                                                <option
                                                    key={value}
                                                    value={value}
                                                >
                                                    {meta.label}
                                                </option>
                                            ),
                                        )}
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                </div>
                            </div>
                        </div>

                        {filteredArticles.length ? (
                            <div className="divide-y divide-slate-100">
                                {filteredArticles.map((article) => {
                                    const articleDate = getArticleDate(article);
                                    const words = countWords(article.content);

                                    return (
                                        <article
                                            key={article.id}
                                            className="flex flex-col gap-4 p-4 transition-colors hover:bg-blue-50/40 sm:p-5 lg:flex-row"
                                        >
                                            <FeaturedImage
                                                article={article}
                                                className="h-40 w-full shrink-0 rounded-2xl lg:h-32 lg:w-48"
                                            />

                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Badge
                                                        status={
                                                            STATUS_META[
                                                                article.status
                                                            ].badgeStatus
                                                        }
                                                        size="sm"
                                                    >
                                                        {
                                                            STATUS_META[
                                                                article.status
                                                            ].label
                                                        }
                                                    </Badge>
                                                    <span className="text-xs font-bold text-[#0066CC]">
                                                        {article.category}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                                                        <CalendarDays className="h-3.5 w-3.5" />
                                                        {article.status ===
                                                        "draft"
                                                            ? "Belum dijadwalkan"
                                                            : article.status ===
                                                                "archived"
                                                              ? "Diarsipkan"
                                                              : `${article.status === "scheduled" ? "Terbit" : "Diterbitkan"} ${formatDate(articleDate)}`}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                                                        <Eye className="h-3.5 w-3.5" />
                                                        {article.viewCount.toLocaleString(
                                                            "id-ID",
                                                        )}
                                                    </span>
                                                </div>

                                                <h3 className="mt-2 line-clamp-2 text-lg font-extrabold leading-snug text-slate-900">
                                                    {article.title}
                                                </h3>
                                                <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-500">
                                                    {article.excerpt}
                                                </p>

                                                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                                                    <span className="font-mono">
                                                        /blog/{article.slug}
                                                    </span>
                                                    <span>•</span>
                                                    <span>
                                                        {article.authorName}
                                                    </span>
                                                    <span>•</span>
                                                    <span>{words} kata</span>
                                                    {article.tags.map((tag) => (
                                                        <span
                                                            key={tag}
                                                            className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-500"
                                                        >
                                                            #{tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex shrink-0 flex-wrap gap-2 lg:w-44 lg:flex-col">
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() =>
                                                        setPreviewArticle(
                                                            article,
                                                        )
                                                    }
                                                    leftIcon={
                                                        <Eye className="h-4 w-4" />
                                                    }
                                                >
                                                    Preview
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() =>
                                                        openEdit(article)
                                                    }
                                                    leftIcon={
                                                        <Pencil className="h-4 w-4" />
                                                    }
                                                >
                                                    Edit
                                                </Button>
                                                {article.status !==
                                                "published" ? (
                                                    <Button
                                                        size="sm"
                                                        onClick={() =>
                                                            publishNow(article)
                                                        }
                                                        leftIcon={
                                                            <Check className="h-4 w-4" />
                                                        }
                                                    >
                                                        Publish
                                                    </Button>
                                                ) : null}
                                                <div className="flex gap-1 lg:justify-end">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            duplicateArticle(
                                                                article,
                                                            )
                                                        }
                                                        aria-label={`Duplikat ${article.title}`}
                                                        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-blue-50 hover:text-[#0066CC]"
                                                    >
                                                        <Copy className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            deleteArticle(
                                                                article,
                                                            )
                                                        }
                                                        aria-label={`Hapus ${article.title}`}
                                                        className="flex h-9 w-9 items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="px-6 py-16 text-center">
                                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#0066CC]">
                                    <ImageIcon className="h-7 w-7" />
                                </span>
                                <h3 className="mt-4 font-extrabold text-slate-900">
                                    Artikel tidak ditemukan
                                </h3>
                                <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                                    Coba ubah pencarian/filter atau tulis
                                    artikel baru untuk blog AAA Sport Academy.
                                </p>
                            </div>
                        )}
                    </Card>
                </>
            )}

            <ArticlePreviewModal
                article={previewArticle}
                onClose={() => setPreviewArticle(null)}
            />
        </div>
    );
}
