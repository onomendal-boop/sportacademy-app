'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { coachApi } from '@/lib/data-master/dataMasterClient';
import {
  coachCreateSchema,
  coachUpdateSchema,
  getValidationFieldErrors,
} from '@/lib/validations/dataMaster';

const EMPTY_FORM = {
  name: '',
  username: '',
  email: '',
  password: '',
  specialization: 'AAA Sport Academy',
  profileImage: '',
  status: 'ACTIVE',
};

function normalize(value) {
  return String(value ?? '').toLowerCase();
}

export default function useCoachManager(initialCoaches = [], canManage = false, canDelete = false, initialSearch = '') {
  const [coaches, setCoaches] = useState(initialCoaches);
  const [search, setSearch] = useState(initialSearch);
  const [specializationFilter, setSpecializationFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCoach, setEditingCoach] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredCoaches = useMemo(() => {
    const keyword = normalize(search).trim();

    return coaches.filter((coach) => {
      const matchesSearch =
        !keyword ||
        [coach.name, coach.username, coach.email, coach.specialization]
          .map(normalize)
          .some((value) => value.includes(keyword));

      const matchesSpecialization =
        specializationFilter === 'ALL' ||
        coach.specialization === specializationFilter;

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' ? coach.isActive : !coach.isActive);

      return matchesSearch && matchesSpecialization && matchesStatus;
    });
  }, [coaches, search, specializationFilter, statusFilter]);

  const stats = useMemo(
    () => ({
      total: coaches.length,
      active: coaches.filter((coach) => coach.isActive).length,
      inactive: coaches.filter((coach) => !coach.isActive).length,
      assignments: coaches.reduce(
        (total, coach) => total + (coach.assignmentCount ?? 0),
        0
      ),
    }),
    [coaches]
  );

  function updateField(name, value) {
    setFormData((current) => ({ ...current, [name]: value }));
    setFormErrors((current) => ({ ...current, [name]: undefined }));
  }

  function openCreate() {
    if (!canManage) return;
    setEditingCoach(null);
    setFormData(EMPTY_FORM);
    setFormErrors({});
    setIsFormOpen(true);
  }

  function openEdit(coach) {
    if (!canManage) return;
    setEditingCoach(coach);
    setFormData({
      name: coach.name ?? '',
      username: coach.username ?? '',
      email: coach.email ?? '',
      password: '',
      specialization: coach.specialization ?? 'AAA Sport Academy',
      profileImage: coach.profileImage ?? '',
      status: coach.isActive ? 'ACTIVE' : 'INACTIVE',
    });
    setFormErrors({});
    setIsFormOpen(true);
  }

  function closeForm() {
    if (isSaving) return;
    setIsFormOpen(false);
    setEditingCoach(null);
    setFormErrors({});
  }

  async function submitForm(event) {
    event.preventDefault();
    if (!canManage || isSaving) return;

    const payload = {
      name: formData.name,
      username: formData.username,
      email: formData.email,
      password: formData.password,
      specialization: formData.specialization,
      profileImage: formData.profileImage,
      isActive: formData.status === 'ACTIVE',
    };

    const schema = editingCoach ? coachUpdateSchema : coachCreateSchema;
    const parsed = schema.safeParse(payload);

    if (!parsed.success) {
      setFormErrors(getValidationFieldErrors(parsed.error));
      return;
    }

    setIsSaving(true);

    try {
      if (editingCoach) {
        const updated = await coachApi.update(editingCoach.id, parsed.data);
        setCoaches((current) =>
          current.map((coach) => (coach.id === updated.id ? updated : coach))
        );
        toast.success(`Data pelatih ${updated.name} berhasil diperbarui.`);
      } else {
        const created = await coachApi.create(parsed.data);
        setCoaches((current) => [created, ...current]);
        toast.success(`Pelatih ${created.name} berhasil ditambahkan.`);
      }

      setIsFormOpen(false);
      setEditingCoach(null);
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
      toast.error(error?.message ?? 'Gagal menyimpan data pelatih.');
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmDelete() {
    if (!canDelete || !deleteTarget || isDeleting) return;

    setIsDeleting(true);

    try {
      await coachApi.remove(deleteTarget.id);
      setCoaches((current) =>
        current.filter((coach) => coach.id !== deleteTarget.id)
      );
      toast.success(`Pelatih ${deleteTarget.name} berhasil dihapus.`);
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error?.message ?? 'Gagal menghapus data pelatih.');
    } finally {
      setIsDeleting(false);
    }
  }

  return {
    coaches,
    filteredCoaches,
    stats,
    search,
    specializationFilter,
    statusFilter,
    isFormOpen,
    editingCoach,
    formData,
    formErrors,
    isSaving,
    deleteTarget,
    isDeleting,
    onSearchChange: setSearch,
    onSpecializationFilterChange: setSpecializationFilter,
    onStatusFilterChange: setStatusFilter,
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
