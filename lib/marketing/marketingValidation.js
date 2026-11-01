import { z } from "zod";

export const PROGRAM_VALUES = ["AAA", "A3", "SWDC", "PRIVATE"];

function optionalText(max) {
    return z
        .union([z.string(), z.null()])
        .optional()
        .transform((value) => {
            const text = String(value ?? "").trim();
            return text === "" ? null : text;
        })
        .refine(
            (value) => value === null || value.length <= max,
            `Maksimal ${max} karakter`,
        );
}

function optionalInt({ min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
    return z
        .union([z.string(), z.number(), z.null()])
        .optional()
        .transform((value) => {
            if (value === undefined || value === null || value === "")
                return null;
            return Number(value);
        })
        .refine(
            (value) =>
                value === null ||
                (Number.isInteger(value) && value >= min && value <= max),
            "Nilai harus berupa bilangan bulat yang valid",
        );
}

function requiredInt({ min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
    return z
        .union([z.string(), z.number()])
        .transform((value) => Number(value))
        .refine(
            (value) => Number.isInteger(value) && value >= min && value <= max,
            "Nilai harus berupa bilangan bulat yang valid",
        );
}

function optionalDate() {
    return z
        .union([z.string(), z.date(), z.null()])
        .optional()
        .transform((value) => {
            if (value === undefined || value === null || value === "")
                return null;
            return value instanceof Date ? value : new Date(value);
        })
        .refine(
            (value) => value === null || !Number.isNaN(value.getTime()),
            "Format tanggal tidak valid",
        );
}

function requiredDate() {
    return z
        .union([z.string(), z.date()])
        .transform((value) => (value instanceof Date ? value : new Date(value)))
        .refine(
            (value) => !Number.isNaN(value.getTime()),
            "Format tanggal tidak valid",
        );
}

export const promotionSchema = z
    .object({
        title: z.string().trim().min(5).max(140),
        code: optionalText(60).transform((value) =>
            value ? value.toUpperCase().replace(/\s+/g, "") : null,
        ),
        description: z
            .union([z.string(), z.null()])
            .optional()
            .transform((value) => {
                const text = String(value ?? "").trim();
                return text === "" ? null : text;
            })
            .refine(
                (value) => value === null || value.length >= 10,
                "Deskripsi minimal 10 karakter",
            ),
        type: z.enum([
            "FLASH_SALE",
            "REFERRAL",
            "VOUCHER",
            "SEASONAL",
            "PARTNER",
        ]),
        batchId: optionalText(60),
        discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT", "FREE_SESSION"]),
        discountValue: requiredInt({ min: 1, max: 100_000_000 }),
        maxDiscountAmount: optionalInt({ min: 1, max: 100_000_000 }),
        minPurchaseAmount: optionalInt({ min: 0, max: 1_000_000_000 }),
        program: z
            .enum(PROGRAM_VALUES)
            .nullable()
            .optional()
            .transform((value) => value ?? null),
        poolName: optionalText(120),
        startsAt: requiredDate(),
        endsAt: requiredDate(),
        usageLimit: optionalInt({ min: 1, max: 1_000_000 }),
        perUserLimit: optionalInt({ min: 1, max: 1_000 }).transform(
            (value) => value ?? 1,
        ),
        referrerBenefit: optionalText(160),
        refereeBenefit: optionalText(160),
        status: z.enum([
            "DRAFT",
            "SCHEDULED",
            "ACTIVE",
            "INACTIVE",
            "EXPIRED",
            "REDEEMED",
        ]),
        terms: optionalText(2_000),
    })
    .superRefine((data, context) => {
        if (data.endsAt <= data.startsAt) {
            context.addIssue({
                code: "custom",
                path: ["endsAt"],
                message: "Tanggal berakhir harus setelah tanggal mulai",
            });
        }

        if (data.discountType === "PERCENTAGE" && data.discountValue > 100) {
            context.addIssue({
                code: "custom",
                path: ["discountValue"],
                message: "Diskon persentase maksimal 100%",
            });
        }

        if (
            data.type === "REFERRAL" &&
            !data.referrerBenefit &&
            !data.refereeBenefit
        ) {
            context.addIssue({
                code: "custom",
                path: ["referrerBenefit"],
                message: "Benefit referral wajib diisi",
            });
        }
    });

export const articleSchema = z
    .object({
        title: z.string().trim().min(10).max(180),
        slug: optionalText(200),
        excerpt: z.string().trim().min(20).max(500),
        content: z.string().trim().min(20).max(200_000),
        category: z.string().trim().min(2).max(80),
        tags: z
            .array(z.string().trim().min(1).max(40))
            .max(10)
            .optional()
            .transform((tags) => [
                ...new Set(
                    (tags ?? []).map((tag) => tag.trim()).filter(Boolean),
                ),
            ]),
        featuredImageUrl: optionalText(2_800_000).refine((value) => {
            if (!value) return true;
            return (
                value.startsWith("data:image/") ||
                value.startsWith("https://") ||
                value.startsWith("http://")
            );
        }, "Featured image harus URL http/https atau data URL gambar"),
        featuredImageAlt: optionalText(180),
        seoTitle: optionalText(180),
        seoDescription: optionalText(320),
        status: z.enum(["DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED"]),
        scheduledAt: optionalDate(),
    })
    .superRefine((data, context) => {
        if (data.status === "SCHEDULED" && !data.scheduledAt) {
            context.addIssue({
                code: "custom",
                path: ["scheduledAt"],
                message:
                    "Tanggal terjadwal wajib diisi untuk artikel terjadwal",
            });
        }
    });

export const articleContentPreviewSchema = z.object({
    content: z.string().max(200_000),
});

const phoneSchema = z
    .string({ error: "Nomor WhatsApp wajib diisi" })
    .transform((value) => value.replace(/[\s-]/g, "").trim())
    .refine(
        (value) => /^(?:\+62|62|0)8\d{7,13}$/.test(value),
        "Masukkan nomor WhatsApp Indonesia yang valid",
    );

const leadBaseSchema = z.object({
    studentName: z.string().trim().min(3).max(100),
    studentAge: optionalInt({ min: 3, max: 18 }),
    parentName: z.string().trim().min(3).max(100),
    parentPhone: phoneSchema,
    parentEmail: z
        .union([z.string(), z.null()])
        .optional()
        .transform((value) => {
            const email = String(value ?? "")
                .trim()
                .toLowerCase();
            return email === "" ? null : email;
        })
        .refine(
            (value) =>
                value === null || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
            "Format email tidak valid",
        ),
    program: z
        .enum(PROGRAM_VALUES)
        .nullable()
        .optional()
        .transform((value) => value ?? null),
    poolPreference: optionalText(120),
    referralCode: optionalText(60).transform((value) =>
        value ? value.toUpperCase().replace(/\s+/g, "") : null,
    ),
    message: optionalText(1_000),
});

export const leadCreateSchema = leadBaseSchema.extend({
    source: z
        .enum([
            "WEBSITE",
            "LANDING_PAGE",
            "WHATSAPP",
            "INSTAGRAM",
            "REFERRAL",
            "WALK_IN",
            "EVENT",
            "OTHER",
        ])
        .optional()
        .transform((value) => value ?? "WEBSITE"),
    priority: z
        .enum(["LOW", "MEDIUM", "HIGH"])
        .optional()
        .transform((value) => value ?? "MEDIUM"),
});

export const publicLeadCreateSchema = leadBaseSchema.extend({
    // Honeypot anti-spam: field ini disembunyikan dari pengguna manusia dan
    // harus selalu kosong. Bot sederhana yang mengisinya akan ditolak diam-diam
    // oleh service tanpa membuat record lead.
    website: z
        .string()
        .max(200)
        .optional()
        .transform((value) => value ?? ""),
});

export const leadUpdateSchema = z
    .object({
        status: z
            .enum([
                "NEW",
                "CONTACTED",
                "WAITING_RESPONSE",
                "TRIAL_SCHEDULED",
                "TRIAL_COMPLETED",
                "REGISTERED",
                "NOT_INTERESTED",
                "UNREACHABLE",
            ])
            .optional(),
        priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
        assignedToId: z
            .union([z.string(), z.null()])
            .optional()
            .transform((value) => {
                if (value === undefined) return undefined;
                const id = String(value ?? "").trim();
                return id === "" ? null : id;
            }),
        nextFollowUpAt: optionalDate(),
        trialScheduledAt: optionalDate(),
        internalNotes: optionalText(2_000),
    })
    .superRefine((data, context) => {
        if (data.status === "TRIAL_SCHEDULED" && !data.trialScheduledAt) {
            context.addIssue({
                code: "custom",
                path: ["trialScheduledAt"],
                message:
                    "Tanggal trial wajib diisi saat status Trial Terjadwal",
            });
        }
    });

export const leadActivitySchema = z.object({
    note: z.string().trim().min(2).max(1_000),
});
