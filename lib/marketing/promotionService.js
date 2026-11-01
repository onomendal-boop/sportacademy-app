import { prisma } from '@/lib/db/prisma';
import { ApiError } from '@/lib/api/routeHelpers';
import { canAccessFeature } from '@/lib/auth/permissions';

function assertMarketingAccess(actor) {
  if (!actor || !canAccessFeature(actor.role, 'marketing')) {
    throw new ApiError(
      403,
      'FORBIDDEN',
      'Akun Anda tidak memiliki izin untuk mengelola Marketing.'
    );
  }
}

export function resolvePromotionStatus(data, redeemedCount = 0, now = new Date()) {
  if (data.status === 'INACTIVE' || data.status === 'DRAFT') return data.status;
  if (now > data.endsAt) return 'EXPIRED';
  if (now < data.startsAt) return 'SCHEDULED';
  if (data.usageLimit && redeemedCount >= data.usageLimit) return 'REDEEMED';
  return 'ACTIVE';
}

export function mapPromotion(promotion) {
  const usageLimit = promotion.usageLimit ?? null;

  return {
    id: promotion.id,
    title: promotion.title,
    code: promotion.code ?? '',
    description: promotion.description ?? '',
    type: promotion.type,
    batchId: promotion.batchId ?? '',
    discountType: promotion.discountType,
    discountValue: promotion.discountValue,
    maxDiscountAmount: promotion.maxDiscountAmount ?? null,
    minPurchaseAmount: promotion.minPurchaseAmount ?? 0,
    program: promotion.program ?? null,
    poolName: promotion.poolName ?? '',
    startsAt: promotion.startsAt?.toISOString?.() ?? promotion.startsAt,
    endsAt: promotion.endsAt?.toISOString?.() ?? promotion.endsAt,
    usageLimit,
    perUserLimit: promotion.perUserLimit,
    redeemedCount: promotion.redeemedCount,
    usagePercent:
      usageLimit && usageLimit > 0
        ? Math.min(100, Math.round((promotion.redeemedCount / usageLimit) * 100))
        : 0,
    referrerBenefit: promotion.referrerBenefit ?? '',
    refereeBenefit: promotion.refereeBenefit ?? '',
    status: promotion.status,
    terms: promotion.terms ?? '',
    createdById: promotion.createdById ?? null,
    createdAt: promotion.createdAt?.toISOString?.() ?? promotion.createdAt,
    updatedAt: promotion.updatedAt?.toISOString?.() ?? promotion.updatedAt,
  };
}

async function assertCodeAvailable(client, code, excludeId = null) {
  if (!code) return;

  const existing = await client.promotion.findUnique({
    where: { code },
    select: { id: true },
  });

  if (existing && existing.id !== excludeId) {
    throw new ApiError(
      409,
      'DUPLICATE_PROMOTION_CODE',
      'Kode promo/voucher tersebut sudah digunakan.'
    );
  }
}

function toWriteData(data, redeemedCount = 0) {
  return {
    title: data.title,
    code: data.code,
    description: data.description,
    type: data.type,
    batchId: data.batchId,
    discountType: data.discountType,
    discountValue: data.discountValue,
    maxDiscountAmount: data.maxDiscountAmount,
    minPurchaseAmount: data.minPurchaseAmount,
    program: data.program,
    poolName: data.poolName,
    startsAt: data.startsAt,
    endsAt: data.endsAt,
    usageLimit: data.usageLimit,
    perUserLimit: data.perUserLimit,
    referrerBenefit: data.referrerBenefit,
    refereeBenefit: data.refereeBenefit,
    status: resolvePromotionStatus(data, redeemedCount),
    terms: data.terms,
  };
}

export async function getPromotions(actor) {
  assertMarketingAccess(actor);

  const promotions = await prisma.promotion.findMany({
    orderBy: [{ startsAt: 'desc' }, { createdAt: 'desc' }],
  });

  return promotions.map(mapPromotion);
}

export async function createPromotion(data, actor) {
  assertMarketingAccess(actor);
  await assertCodeAvailable(prisma, data.code);

  const promotion = await prisma.promotion.create({
    data: { ...toWriteData(data), createdById: actor.id },
  });

  return mapPromotion(promotion);
}

export async function createPromotionBatch(items, actor) {
  assertMarketingAccess(actor);

  if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
    throw new ApiError(
      400,
      'INVALID_PROMOTION_BATCH',
      'Batch voucher harus berisi 1-50 campaign.'
    );
  }

  const codes = items.map((item) => item.code).filter(Boolean);
  if (new Set(codes).size !== codes.length) {
    throw new ApiError(
      409,
      'DUPLICATE_PROMOTION_CODE',
      'Batch voucher mengandung kode duplikat.'
    );
  }

  const created = await prisma.$transaction(async (tx) => {
    for (const item of items) {
      await assertCodeAvailable(tx, item.code);
    }

    const records = [];
    for (const item of items) {
      records.push(
        await tx.promotion.create({
          data: { ...toWriteData(item), createdById: actor.id },
        })
      );
    }
    return records;
  });

  return created.map(mapPromotion);
}

export async function updatePromotion(id, data, actor) {
  assertMarketingAccess(actor);

  const existing = await prisma.promotion.findUnique({
    where: { id },
    select: { id: true, redeemedCount: true },
  });

  if (!existing) {
    throw new ApiError(404, 'NOT_FOUND', 'Campaign/promo tidak ditemukan.');
  }

  if (data.usageLimit !== null && data.usageLimit < existing.redeemedCount) {
    throw new ApiError(
      400,
      'USAGE_LIMIT_BELOW_REDEEMED',
      'Batas pemakaian tidak boleh lebih kecil dari jumlah promo yang sudah dipakai.'
    );
  }

  await assertCodeAvailable(prisma, data.code, id);

  const promotion = await prisma.promotion.update({
    where: { id },
    data: toWriteData(data, existing.redeemedCount),
  });

  return mapPromotion(promotion);
}

export async function deletePromotion(id, actor) {
  assertMarketingAccess(actor);

  const existing = await prisma.promotion.findUnique({
    where: { id },
    select: { id: true, title: true, redeemedCount: true },
  });

  if (!existing) {
    throw new ApiError(404, 'NOT_FOUND', 'Campaign/promo tidak ditemukan.');
  }

  if (existing.redeemedCount > 0) {
    throw new ApiError(
      409,
      'PROMOTION_HAS_REDEMPTIONS',
      'Promo yang sudah pernah dipakai tidak dapat dihapus. Nonaktifkan campaign agar histori tetap terjaga.'
    );
  }

  await prisma.promotion.delete({ where: { id } });
  return { id, title: existing.title };
}
