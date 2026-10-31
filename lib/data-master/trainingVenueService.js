import { prisma } from '@/lib/db/prisma';

// Istilah UI adalah "Tempat Latihan".
// Model database yang sudah ada tetap bernama Pool agar tidak memerlukan
// migrasi rename tabel/model yang berisiko untuk data yang sudah diseed.

const venueSelect = {
  id: true,
  name: true,
  location: true,
  depth: true,
  capacity: true,
  status: true,
  imageUrl: true,
  createdAt: true,
  updatedAt: true,
};

export function mapTrainingVenue(venue) {
  return {
    id: venue.id,
    name: venue.name,
    location: venue.location,
    depth: venue.depth,
    capacity: venue.capacity,
    status: venue.status,
    imageUrl: venue.imageUrl ?? '',
    createdAt: venue.createdAt.toISOString(),
    updatedAt: venue.updatedAt.toISOString(),
  };
}

function toVenueWriteData(data) {
  return {
    name: data.name,
    location: data.location,
    depth: data.depth,
    capacity: data.capacity,
    status: data.status,
    imageUrl: data.imageUrl,
  };
}

export async function getTrainingVenues() {
  const venues = await prisma.pool.findMany({
    select: venueSelect,
    orderBy: [{ status: 'asc' }, { name: 'asc' }, { location: 'asc' }],
  });

  return venues.map(mapTrainingVenue);
}

export async function createTrainingVenue(data) {
  const venue = await prisma.pool.create({
    data: toVenueWriteData(data),
    select: venueSelect,
  });

  return mapTrainingVenue(venue);
}

export async function updateTrainingVenue(id, data) {
  const venue = await prisma.pool.update({
    where: { id },
    data: toVenueWriteData(data),
    select: venueSelect,
  });

  return mapTrainingVenue(venue);
}

export async function deleteTrainingVenue(id) {
  await prisma.pool.delete({ where: { id } });
  return { ok: true };
}
