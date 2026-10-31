'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { staffApi } from '@/lib/data-master/dataMasterClient';
import {
  getValidationFieldErrors,
  staffSchema,
} from '@/lib/validations/dataMaster';

const EMPTY_FORM = {
  name: '',
  position: '',
  department: '',
  email: '',
  phone: '',
  profileImage: '',
  status: 'ACTIVE',
  joinedAt: '',
};

function normalize(value) {
  return String(value ?? '').toLowerCase();
}

export default function useStaffManager(initialStaff = [], canManage = false, canDelete = false) {
  const [staff, setStaff] = useState(initialStaff);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [positionFilter, setPositionFilter] = useState('ALL');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredStaff = useMemo(() => {
    const keyword = normalize(search).trim();

    return staff.filter((item) => {
      const matchesSearch =
        !keyword ||
        [item.name, item.position, item.department, item.email, item.phone]
          .map(normalize)
          .some((value) => value.includes(keyword));

      const matchesStatus =
        statusFilter === 'ALL' || item.status === statusFilter;
      const matchesPosition =
        positionFilter === 'ALL' || item.position === positionFilter;

      return matchesSearch && matchesStatus && matchesPosition;
    });
  }, [staff, search, statusFilter, positionFilter]);

  const stats = useMemo(
    () => ({
      total: staff.length,
      active: staff.filter((item) => item.status === 'ACTIVE').length,
      onLeave: staff.filter((item) => item.status === 'ON_LEAVE').length,
      inactive: staff.filter((item) => item.status === 'INACTIVE').length,
    }),
    [staff]
  );

  function updateField(name, value) {
    setFormData((current) => ({ ...current, [name]: value }));
    setFormErrors((current) => ({ ...current, [name]: undefined }));
  }

  function openCreate() {
    if (!canManage) return;
    setEditingStaff(null);
    setFormData(EMPTY_FORM);
    setFormErrors({});
    setIsFormOpen(true);
  }

  function openEdit(item) {
    if (!canManage) return;
    setEditingStaff(item);
    setFormData({
      name: item.name ?? '',
      position: item.position ?? '',
      department: item.department ?? '',
      email: item.email ?? '',
      phone: item.phone ?? '',
      profileImage: item.profileImage ?? '',
      status: item.status ?? 'ACTIVE',
      joinedAt: item.joinedAt ?? '',
    });
    setFormErrors({});
    setIsFormOpen(true);
  }

  function closeForm() {
    if (isSaving) return;
    setIsFormOpen(false);
    setEditingStaff(null);
    setFormErrors({});
  }

  async function submitForm(event) {
    event.preventDefault();
    if (!canManage || isSaving) return;

    const parsed = staffSchema.safeParse(formData);

    if (!parsed.success) {
      setFormErrors(getValidationFieldErrors(parsed.error));
      return;
    }

    setIsSaving(true);

    try {
      if (editingStaff) {
        const updated = await staffApi.update(editingStaff.id, parsed.data);
        setStaff((current) =>
          current.map((item) => (item.id === updated.id ? updated : item))
        );
        toast.success(`Data ${updated.name} berhasil diperbarui.`);
      } else {
        const created = await staffApi.create(parsed.data);
        setStaff((current) => [created, ...current]);
        toast.success(`Staff ${created.name} berhasil ditambahkan.`);
      }

      setIsFormOpen(false);
      setEditingStaff(null);
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
      toast.error(error?.message ?? 'Gagal menyimpan data staff.');
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmDelete() {
    if (!canDelete || !deleteTarget || isDeleting) return;

    setIsDeleting(true);

    try {
      await staffApi.remove(deleteTarget.id);
      setStaff((current) => current.filter((item) => item.id !== deleteTarget.id));
      toast.success(`Staff ${deleteTarget.name} berhasil dihapus.`);
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error?.message ?? 'Gagal menghapus data staff.');
    } finally {
      setIsDeleting(false);
    }
  }

  return {
    staff,
    filteredStaff,
    stats,
    search,
    statusFilter,
    positionFilter,
    isFormOpen,
    editingStaff,
    formData,
    formErrors,
    isSaving,
    deleteTarget,
    isDeleting,
    onSearchChange: setSearch,
    onStatusFilterChange: setStatusFilter,
    onPositionFilterChange: setPositionFilter,
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
