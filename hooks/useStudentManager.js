'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { STUDENT_STATUS_LABELS } from '@/lib/data-master/constants';
import { studentApi } from '@/lib/data-master/dataMasterClient';
import {
  getValidationFieldErrors,
  studentSchema,
} from '@/lib/validations/dataMaster';

const EMPTY_FORM = {
  name: '',
  dateOfBirth: '',
  age: '',
  parentContact: '',
  healthHistory: '',
  level: 'AAA',
  status: 'PENDING',
};

function normalize(value) {
  return String(value ?? '').toLowerCase();
}

/**
 * Hitung usia dari date-key tanggal lahir berdasarkan tanggal lokal browser.
 * Dipakai untuk mengisi field Usia otomatis saat Tanggal Lahir dipilih.
 */
function calculateAgeFromDateKey(dateKey) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return null;

  const [year, month, day] = dateKey.split('-').map(Number);
  const today = new Date();
  let age = today.getFullYear() - year;
  const monthDifference = today.getMonth() + 1 - month;

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < day)
  ) {
    age -= 1;
  }

  return age;
}

export default function useStudentManager(
  initialStudents = [],
  canManage = false,
  canDelete = false
) {
  const [students, setStudents] = useState(initialStudents);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredStudents = useMemo(() => {
    const keyword = normalize(search).trim();

    return students.filter((student) => {
      const matchesSearch =
        !keyword ||
        [
          student.name,
          student.parentContact,
          student.level,
          student.account?.username,
        ]
          .map(normalize)
          .some((value) => value.includes(keyword));

      const matchesLevel =
        levelFilter === 'ALL' || student.level === levelFilter;
      const matchesStatus =
        statusFilter === 'ALL' || student.status === statusFilter;

      return matchesSearch && matchesLevel && matchesStatus;
    });
  }, [students, search, levelFilter, statusFilter]);

  const stats = useMemo(
    () => ({
      total: students.length,
      active: students.filter((student) => student.status === 'ACTIVE').length,
      pending: students.filter((student) => student.status === 'PENDING')
        .length,
      AAA: students.filter((student) => student.level === 'AAA').length,
      A3: students.filter((student) => student.level === 'A3').length,
      SWDC: students.filter((student) => student.level === 'SWDC').length,
      withHealthNotes: students.filter((student) =>
        Boolean(student.healthHistory?.trim())
      ).length,
    }),
    [students]
  );

  function updateField(name, value) {
    setFormData((current) => {
      const next = { ...current, [name]: value };

      if (name === 'dateOfBirth' && value) {
        const calculatedAge = calculateAgeFromDateKey(value);

        if (calculatedAge !== null && calculatedAge >= 0) {
          next.age = String(calculatedAge);
        }
      }

      return next;
    });
    setFormErrors((current) => ({
      ...current,
      [name]: undefined,
      ...(name === 'dateOfBirth' ? { age: undefined } : {}),
    }));
  }

  function openCreate() {
    if (!canManage) return;
    setEditingStudent(null);
    setFormData(EMPTY_FORM);
    setFormErrors({});
    setIsFormOpen(true);
  }

  function openEdit(student) {
    if (!canManage) return;
    setEditingStudent(student);
    setFormData({
      name: student.name ?? '',
      dateOfBirth: student.dateOfBirth ?? '',
      age: student.age ? String(student.age) : '',
      parentContact: student.parentContact ?? '',
      healthHistory: student.healthHistory ?? '',
      level: student.level ?? 'AAA',
      status: student.status ?? 'PENDING',
    });
    setFormErrors({});
    setIsFormOpen(true);
  }

  function closeForm() {
    if (isSaving) return;
    setIsFormOpen(false);
    setEditingStudent(null);
    setFormErrors({});
  }

  async function submitForm(event) {
    event.preventDefault();
    if (!canManage || isSaving) return;

    const parsed = studentSchema.safeParse(formData);

    if (!parsed.success) {
      setFormErrors(getValidationFieldErrors(parsed.error));
      return;
    }

    setIsSaving(true);

    try {
      if (editingStudent) {
        const updated = await studentApi.update(editingStudent.id, parsed.data);
        setStudents((current) =>
          current.map((student) =>
            student.id === updated.id ? updated : student
          )
        );
        toast.success(`Data ${updated.name} berhasil diperbarui.`);
      } else {
        const created = await studentApi.create(parsed.data);
        setStudents((current) => [created, ...current]);
        toast.success(
          `Siswa ${created.name} berhasil ditambahkan dengan status ${STUDENT_STATUS_LABELS[created.status] ?? created.status}.`
        );
      }

      setIsFormOpen(false);
      setEditingStudent(null);
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
      toast.error(error?.message ?? 'Gagal menyimpan data siswa.');
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmDelete() {
    if (!canDelete || !deleteTarget || isDeleting) return;

    setIsDeleting(true);

    try {
      await studentApi.remove(deleteTarget.id);
      setStudents((current) =>
        current.filter((student) => student.id !== deleteTarget.id)
      );
      toast.success(`Siswa ${deleteTarget.name} berhasil dihapus.`);
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error?.message ?? 'Gagal menghapus data siswa.');
    } finally {
      setIsDeleting(false);
    }
  }

  return {
    students,
    filteredStudents,
    stats,
    search,
    levelFilter,
    statusFilter,
    isFormOpen,
    editingStudent,
    formData,
    formErrors,
    isSaving,
    deleteTarget,
    isDeleting,
    onSearchChange: setSearch,
    onLevelFilterChange: setLevelFilter,
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
