import { prisma } from '@/lib/db/prisma';
import { DataMasterError } from './routeHelpers';

const staffSelect = {
  id: true,
  userId: true,
  name: true,
  position: true,
  department: true,
  email: true,
  phone: true,
  profileImage: true,
  status: true,
  joinedAt: true,
  createdAt: true,
  updatedAt: true,
};

function toDateOnly(value) {
  if (!value) return null;
  return new Date(`${value}T00:00:00.000Z`);
}

export function mapStaff(staff) {
  return {
    id: staff.id,
    userId: staff.userId ?? null,
    name: staff.name,
    position: staff.position,
    department: staff.department ?? '',
    email: staff.email ?? '',
    phone: staff.phone,
    profileImage: staff.profileImage ?? '',
    status: staff.status,
    joinedAt: staff.joinedAt
      ? staff.joinedAt.toISOString().slice(0, 10)
      : '',
    createdAt: staff.createdAt.toISOString(),
    updatedAt: staff.updatedAt.toISOString(),
  };
}

function toStaffWriteData(data) {
  return {
    name: data.name,
    position: data.position,
    department: data.department,
    email: data.email,
    phone: data.phone,
    profileImage: data.profileImage,
    status: data.status,
    joinedAt: toDateOnly(data.joinedAt),
  };
}

export async function getStaff() {
  const staff = await prisma.staff.findMany({
    select: staffSelect,
    orderBy: [{ status: 'asc' }, { name: 'asc' }],
  });

  return staff.map(mapStaff);
}

export async function createStaff(data) {
  const staff = await prisma.staff.create({
    data: toStaffWriteData(data),
    select: staffSelect,
  });

  return mapStaff(staff);
}

export async function updateStaff(id, data) {
  const staff = await prisma.staff.update({
    where: { id },
    data: toStaffWriteData(data),
    select: staffSelect,
  });

  return mapStaff(staff);
}

export async function deleteStaff(id) {
  await prisma.staff.delete({ where: { id } });
  return { ok: true };
}

export async function assertStaffExists(id) {
  const staff = await prisma.staff.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!staff) {
    throw new DataMasterError(404, 'NOT_FOUND', 'Staff tidak ditemukan.');
  }
}
