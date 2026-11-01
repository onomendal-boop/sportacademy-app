import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = [
    "a",
    "b",
    "blockquote",
    "br",
    "div",
    "em",
    "h2",
    "h3",
    "h4",
    "i",
    "img",
    "li",
    "ol",
    "p",
    "s",
    "span",
    "strong",
    "u",
    "ul",
];

const NON_TEXT_TAGS = [
    "button",
    "embed",
    "form",
    "head",
    "iframe",
    "noscript",
    "object",
    "script",
    "select",
    "style",
    "textarea",
    "title",
];

const SAFE_DATA_IMAGE_PATTERN =
    /^data:image\/(?:png|jpe?g|gif|webp);base64,[a-z0-9+/=]+$/i;

function decodeEntities(value) {
    return String(value ?? "")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;|&apos;/gi, "'")
        .replace(/&#x([0-9a-f]+);/gi, (_match, hex) => {
            const codePoint = Number.parseInt(hex, 16);
            return codePoint >= 0 && codePoint <= 0x10ffff
                ? String.fromCodePoint(codePoint)
                : "";
        })
        .replace(/&#(\d+);/g, (_match, decimal) => {
            const codePoint = Number.parseInt(decimal, 10);
            return codePoint >= 0 && codePoint <= 0x10ffff
                ? String.fromCodePoint(codePoint)
                : "";
        });
}

function normalizeImageSource(value) {
    const source = String(value ?? "").trim();

    if (!source || source.startsWith("//")) return null;

    if (/^data:/i.test(source)) {
        const compactSource = source.replace(/\s+/g, "");
        return SAFE_DATA_IMAGE_PATTERN.test(compactSource)
            ? compactSource
            : null;
    }

    if (source.startsWith("/")) return source;

    try {
        const url = new URL(source);
        return ["http:", "https:"].includes(url.protocol) ? source : null;
    } catch {
        // Nama file/path relatif tanpa skema tidak dapat mengeksekusi script
        // melalui atribut src <img>; skema berbahaya sudah ditangani oleh
        // allowedSchemes sanitize-html dan pemeriksaan data URL di atas.
        return source;
    }
}

function transformLink(tagName, attribs) {
    const nextAttribs = { ...attribs };
    const href = String(nextAttribs.href ?? "");

    if (/^https?:\/\//i.test(href)) {
        nextAttribs.target = "_blank";
        nextAttribs.rel = "noopener noreferrer";
    } else {
        delete nextAttribs.target;
        delete nextAttribs.rel;
    }

    return { tagName, attribs: nextAttribs };
}

function transformImage(tagName, attribs) {
    const nextAttribs = { ...attribs };
    const source = normalizeImageSource(nextAttribs.src);

    if (source) {
        nextAttribs.src = source;
    } else {
        delete nextAttribs.src;
    }

    if (nextAttribs.alt) {
        nextAttribs.alt = String(nextAttribs.alt).slice(0, 180);
    }

    return { tagName, attribs: nextAttribs };
}

const ARTICLE_SANITIZE_OPTIONS = {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
        a: ["href", "target", "rel"],
        img: ["src", "alt"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: {
        img: ["http", "https", "data"],
    },
    allowedSchemesAppliedToAttributes: ["href", "src"],
    allowProtocolRelative: false,
    disallowedTagsMode: "discard",
    enforceHtmlBoundary: true,
    nonTextTags: NON_TEXT_TAGS,
    transformTags: {
        a: transformLink,
        img: transformImage,
    },
    exclusiveFilter(frame) {
        return frame.tag === "img" && !frame.attribs.src;
    },
};

/**
 * Sanitasi HTML artikel di server dengan allowlist sanitize-html.
 *
 * Fungsi ini hanya boleh diimpor dari Server Component, Route Handler,
 * atau service server. HTML WYSIWYG wajib melewati fungsi ini sebelum
 * disimpan ke database dan sebelum dirender dengan
 * dangerouslySetInnerHTML. Jangan mengimpornya ke Client Component.
 */
export function sanitizeArticleHtml(html) {
    return sanitizeHtml(String(html ?? ""), ARTICLE_SANITIZE_OPTIONS).trim();
}

export function getPlainTextFromHtml(html) {
    const sanitized = sanitizeArticleHtml(html);

    return decodeEntities(sanitized.replace(/<[^>]*>/g, " "))
        .replace(/\s+/g, " ")
        .trim();
}
