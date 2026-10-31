'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { trainingVenueApi } from '@/lib/data-master/dataMasterClient';
import {
  getValidationFieldErrors,
  trainingVenueSchema,
} from '@/lib/validations/dataMaster';

const EMPTY_FORM = {
  name: '',
  location: '',
  depth: '',
  capacity: '',
  status: 'ACTIVE',
  imageUrl: '',
};

function normalize(value) {
  return String(value ?? '').toLowerCase();
}

export default function useTrainingVenueManager(
  initialVenues = [],
  canManage = false,
  canDelete = false
) {
  const [venues, setVenues] = useState(initialVenues);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [locationFilter, setLocationFilter] = useState('ALL');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const locations = useMemo(
    () => [...new Set(venues.map((venue) => venue.location).filter(Boolean))].sort(),
    [venues]
  );

  const filteredVenues = useMemo(() => {
    const keyword = normalize(search).trim();

    return venues.filter((venue) => {
      const matchesSearch =
        !keyword ||
        [venue.name, venue.location]
          .map(normalize)
          .some((value) => value.includes(keyword));

      const matchesStatus =
        statusFilter === 'ALL' || venue.status === statusFilter;
      const matchesLocation =
        locationFilter === 'ALL' || venue.location === locationFilter;

      return matchesSearch && matchesStatus && matchesLocation;
    });
  }, [venues, search, statusFilter, locationFilter]);

  const stats = useMemo(
    () => ({
      total: venues.length,
      active: venues.filter((venue) => venue.status === 'ACTIVE').length,
      maintenance: venues.filter(
        (venue) => venue.status === 'MAINTENANCE'
      ).length,
      capacity: venues.reduce(
        (total, venue) => total + (Number(venue.capacity) || 0),
        0
      ),
    }),
    [venues]
  );

  function updateField(name, value) {
    setFormData((current) => ({ ...current, [name]: value }));
    setFormErrors((current) => ({ ...current, [name]: undefined }));
  }

  function openCreate() {
    if (!canManage) return;
    setEditingVenue(null);
    setFormData(EMPTY_FORM);
    setFormErrors({});
    setIsFormOpen(true);
  }

  function openEdit(venue) {
    if (!canManage) return;
    setEditingVenue(venue);
    setFormData({
      name: venue.name ?? '',
      location: venue.location ?? '',
      depth: venue.depth ? String(venue.depth) : '',
      capacity: venue.capacity ? String(venue.capacity) : '',
      status: venue.status ?? 'ACTIVE',
      imageUrl: venue.imageUrl ?? '',
    });
    setFormErrors({});
    setIsFormOpen(true);
  }

  function closeForm() {
    if (isSaving) return;
    setIsFormOpen(false);
    setEditingVenue(null);
    setFormErrors({});
  }

  async function submitForm(event) {
    event.preventDefault();
    if (!canManage || isSaving) return;

    const parsed = trainingVenueSchema.safeParse(formData);

    if (!parsed.success) {
      setFormErrors(getValidationFieldErrors(parsed.error));
      return;
    }

    setIsSaving(true);

    try {
      if (editingVenue) {
        const updated = await trainingVenueApi.update(
          editingVenue.id,
          parsed.data
        );
        setVenues((current) =>
          current.map((venue) => (venue.id === updated.id ? updated : venue))
        );
        toast.success(`Tempat latihan ${updated.name} berhasil diperbarui.`);
      } else {
        const created = await trainingVenueApi.create(parsed.data);
        setVenues((current) => [created, ...current]);
        toast.success(`Tempat latihan ${created.name} berhasil ditambahkan.`);
      }

      setIsFormOpen(false);
      setEditingVenue(null);
      setFormData(EMPTY_FORM);
      setFormErrors({});
    } catch (error) {
      if (error?.fieldErrors) {
        setFormErrors(
          Object.fromEntries(
            Object.entries(error.fieldErrors).map(([field, messages]) => [
              field,
              Array.isArray(messages) ? messages[0] : messages,
            ])
          )
        );
      }
      toast.error(error?.message ?? 'Gagal menyimpan tempat latihan.');
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmDelete() {
    if (!canDelete || !deleteTarget || isDeleting) return;

    setIsDeleting(true);

    try {
      await trainingVenueApi.remove(deleteTarget.id);
      setVenues((current) =>
        current.filter((venue) => venue.id !== deleteTarget.id)
      );
      toast.success(`Tempat latihan ${deleteTarget.name} berhasil dihapus.`);
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error?.message ?? 'Gagal menghapus tempat latihan.');
    } finally {
      setIsDeleting(false);
    }
  }

  return {
    venues,
    filteredVenues,
    locations,
    stats,
    search,
    statusFilter,
    locationFilter,
    isFormOpen,
    editingVenue,
    formData,
    formErrors,
    isSaving,
    deleteTarget,
    isDeleting,
    onSearchChange: setSearch,
    onStatusFilterChange: setStatusFilter,
    onLocationFilterChange: setLocationFilter,
    onFieldChange: updateField,
    onCreate: openCreate,
    onEdit: openEdit,
    onCloseForm: closeForm,
    onSubmit: submitForm,
    onDeleteRequest: setDeleteTarget,
    onDeleteCancel: () => !isDeleting && setDeleteTarget(null),
    onDeleteConfirm: confirmDelete,
  };
}
