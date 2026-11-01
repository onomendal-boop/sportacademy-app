import { prisma } from '@/lib/db/prisma';
import { ApiError } from '@/lib/api/routeHelpers';
import { canAccessFeature } from '@/lib/auth/permissions';

const ASSIGNEE_ROLES = ['SUPERADMIN', 'OWNER', 'ADMIN'];
const CONTACTED_STATUSES = new Set([
  'CONTACTED',
  'WAITING_RESPONSE',
  'TRIAL_SCHEDULED',
  'TRIAL_COMPLETED',
]);

function assertMarketingAccess(actor) {
  if (!actor || !canAccessFeature(actor.role, 'marketing')) {
    throw new ApiError(
      403,
      'FORBIDDEN',
      'Akun Anda tidak memiliki izin untuk mengelola Marketing Leads.'
    );
  }
}

const leadInclude = {
  assignedTo: {
    select: {
      id: true,
      name: true,
      username: true,
      role: true,
      programScope: true,
    },
  },
  activities: {
    orderBy: { createdAt: 'asc' },
    include: {
      actor: { select: { id: true, name: true, username: true } },
    },
  },
};

export function mapLead(lead) {
  return {
    id: lead.id,
    studentName: lead.studentName,
    studentAge: lead.studentAge ?? null,
    parentName: lead.parentName,
    parentPhone: lead.parentPhone,
    parentEmail: lead.parentEmail ?? '',
    program: lead.program ?? null,
    poolPreference: lead.poolPreference ?? '',
    source: lead.source,
    referralCode: lead.referralCode ?? '',
    message: lead.message ?? '',
    status: lead.status,
    priority: lead.priority,
    assignedToId: lead.assignedToId ?? null,
    assignedTo: lead.assignedTo ?? null,
    lastContactedAt:
      lead.lastContactedAt?.toISOString?.() ?? lead.lastContactedAt ?? null,
    nextFollowUpAt:
      lead.nextFollowUpAt?.toISOString?.() ?? lead.nextFollowUpAt ?? null,
    trialScheduledAt:
      lead.trialScheduledAt?.toISOString?.() ?? lead.trialScheduledAt ?? null,
    convertedStudentId: lead.convertedStudentId ?? null,
    internalNotes: lead.internalNotes ?? '',
    activities: (lead.activities ?? []).map((activity) => ({
      id: activity.id,
      type: activity.type,
      title: activity.title,
      description: activity.description ?? '',
      actorName: activity.actor?.name ?? '',
      createdAt: activity.createdAt?.toISOString?.() ?? activity.createdAt,
    })),
    createdAt: lead.createdAt?.toISOString?.() ?? lead.createdAt,
    updatedAt: lead.updatedAt?.toISOString?.() ?? lead.updatedAt,
  };
}

async function getLeadById(id, client = prisma) {
  const lead = await client.lead.findUnique({
    where: { id },
    include: leadInclude,
  });

  if (!lead) throw new ApiError(404, 'NOT_FOUND', 'Lead tidak ditemukan.');
  return mapLead(lead);
}

async function assertPoolPreferenceExists(poolPreference) {
  if (!poolPreference) return;

  const venue = await prisma.pool.findFirst({
    where: { name: poolPreference, status: 'ACTIVE' },
    select: { id: true },
  });

  if (!venue) {
    throw new ApiError(
      400,
      'INVALID_POOL_PREFERENCE',
      'Preferensi kolam tidak ditemukan pada Data Master tempat latihan aktif.'
    );
  }
}

function phoneVariants(phone) {
  const digits = String(phone ?? '').replace(/\D/g, '');
  const variants = new Set([String(phone ?? ''), digits]);

  if (digits.startsWith('62')) {
    variants.add(`0${digits.slice(2)}`);
    variants.add(`+${digits}`);
  } else if (digits.startsWith('0')) {
    variants.add(`62${digits.slice(1)}`);
    variants.add(`+62${digits.slice(1)}`);
  } else if (digits.startsWith('8')) {
    variants.add(`0${digits}`);
    variants.add(`62${digits}`);
    variants.add(`+62${digits}`);
  }

  return [...variants].filter(Boolean);
}

export async function getLeads(actor) {
  assertMarketingAccess(actor);

  const leads = await prisma.lead.findMany({
    include: leadInclude,
    orderBy: [{ createdAt: 'desc' }],
  });

  return leads.map(mapLead);
}

export async function getLeadOptions(actor) {
  assertMarketingAccess(actor);

  const [venues, assignees] = await Promise.all([
    prisma.pool.findMany({
      where: { status: 'ACTIVE' },
      orderBy: [{ name: 'asc' }, { location: 'asc' }],
      select: { id: true, name: true, location: true },
    }),
    prisma.user.findMany({
      where: { isActive: true, role: { in: ASSIGNEE_ROLES } },
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        programScope: true,
      },
    }),
  ]);

  const uniqueVenues = [];
  const seenVenueNames = new Set();

  for (const venue of venues) {
    if (seenVenueNames.has(venue.name)) continue;
    seenVenueNames.add(venue.name);
    uniqueVenues.push(venue);
  }

  return { venues: uniqueVenues, assignees };
}

function toLeadCreateData(data, source) {
  return {
    studentName: data.studentName,
    studentAge: data.studentAge,
    parentName: data.parentName,
    parentPhone: data.parentPhone,
    parentEmail: data.parentEmail,
    program: data.program,
    poolPreference: data.poolPreference,
    source,
    referralCode: data.referralCode,
    message: data.message,
    status: 'NEW',
    priority: data.priority ?? 'MEDIUM',
    nextFollowUpAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };
}

export async function createLead(data, actor) {
  assertMarketingAccess(actor);
  await assertPoolPreferenceExists(data.poolPreference);

  const created = await prisma.lead.create({
    data: {
      ...toLeadCreateData(data, data.source),
      activities: {
        create: {
          actorId: actor.id,
          type: 'SYSTEM',
          title: 'Lead diterima',
          description: `Lead dibuat manual oleh ${actor.name} melalui dashboard Marketing.`,
        },
      },
    },
    select: { id: true },
  });

  return getLeadById(created.id);
}

export async function createPublicLead(data) {
  // Respons dibuat generik untuk honeypot agar bot tidak mengetahui bahwa
  // submisi palsunya ditolak.
  if (data.website) return { id: null, accepted: true, duplicate: false };

  await assertPoolPreferenceExists(data.poolPreference);

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const duplicate = await prisma.lead.findFirst({
    where: {
      createdAt: { gte: since },
      parentPhone: { in: phoneVariants(data.parentPhone) },
      studentName: data.studentName,
    },
    select: { id: true },
  });

  if (duplicate) return { id: duplicate.id, accepted: true, duplicate: true };

  const created = await prisma.lead.create({
    data: {
      ...toLeadCreateData(data, 'LANDING_PAGE'),
      activities: {
        create: {
          type: 'SYSTEM',
          title: 'Lead diterima dari landing page',
          description: 'Orang tua mengisi formulir pendaftaran pada landing page publik.',
        },
      },
    },
    select: { id: true },
  });

  return { id: created.id, accepted: true, duplicate: false };
}

async function assertAssigneeExists(assignedToId) {
  if (!assignedToId) return null;

  const assignee = await prisma.user.findUnique({
    where: { id: assignedToId },
    select: { id: true, name: true, role: true, isActive: true },
  });

  if (!assignee || !assignee.isActive || !ASSIGNEE_ROLES.includes(assignee.role)) {
    throw new ApiError(
      400,
      'INVALID_ASSIGNEE',
      'Penanggung jawab lead harus akun Superadmin, Owner, atau Admin yang aktif.'
    );
  }

  return assignee;
}

export async function updateLead(id, data, actor) {
  assertMarketingAccess(actor);

  const existing = await prisma.lead.findUnique({
    where: { id },
    include: { assignedTo: { select: { id: true, name: true } } },
  });

  if (!existing) throw new ApiError(404, 'NOT_FOUND', 'Lead tidak ditemukan.');

  const nextAssignee =
    data.assignedToId !== undefined
      ? await assertAssigneeExists(data.assignedToId)
      : null;

  const writeData = {};
  if (data.status !== undefined) writeData.status = data.status;
  if (data.priority !== undefined) writeData.priority = data.priority;
  if (data.assignedToId !== undefined) writeData.assignedToId = data.assignedToId;
  if (data.nextFollowUpAt !== undefined) writeData.nextFollowUpAt = data.nextFollowUpAt;
  if (data.trialScheduledAt !== undefined) {
    writeData.trialScheduledAt = data.trialScheduledAt;
  }
  if (data.internalNotes !== undefined) writeData.internalNotes = data.internalNotes;

  if (
    data.status &&
    data.status !== existing.status &&
    CONTACTED_STATUSES.has(data.status)
  ) {
    writeData.lastContactedAt = new Date();
  }

  const activities = [];

  if (data.status && data.status !== existing.status) {
    activities.push({
      actorId: actor.id,
      type: 'STATUS',
      title: 'Status lead diperbarui',
      description: `Status berubah dari ${existing.status} menjadi ${data.status} oleh ${actor.name}.`,
    });
  }

  if (
    data.assignedToId !== undefined &&
    data.assignedToId !== existing.assignedToId
  ) {
    activities.push({
      actorId: actor.id,
      type: 'ASSIGNMENT',
      title: 'Penanggung jawab diperbarui',
      description: nextAssignee
        ? `Lead ditugaskan kepada ${nextAssignee.name}.`
        : 'Penanggung jawab lead dikosongkan.',
    });
  }

  await prisma.$transaction(async (tx) => {
    await tx.lead.update({ where: { id }, data: writeData });

    if (activities.length) {
      await tx.leadActivity.createMany({
        data: activities.map((activity) => ({ ...activity, leadId: id })),
      });
    }
  });

  return getLeadById(id);
}

export async function addLeadActivity(id, note, actor) {
  assertMarketingAccess(actor);

  const existing = await prisma.lead.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) throw new ApiError(404, 'NOT_FOUND', 'Lead tidak ditemukan.');

  await prisma.$transaction([
    prisma.leadActivity.create({
      data: {
        leadId: id,
        actorId: actor.id,
        type: 'NOTE',
        title: 'Catatan follow-up',
        description: note,
      },
    }),
    prisma.lead.update({
      where: { id },
      data: { lastContactedAt: new Date() },
    }),
  ]);

  return getLeadById(id);
}
