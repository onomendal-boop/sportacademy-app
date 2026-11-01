"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PACKAGE_DURATION_PRESETS } from "@/lib/finance/constants";
import { packageCatalogApi } from "@/lib/marketing/marketingClient";
import { PROGRAM_OPTIONS, PROGRAM_CONFIG } from "@/lib/operational/constants";
import {
    getFinanceFieldErrors,
    packageSchema,
} from "@/lib/validations/finance";

const EMPTY_PACKAGE_FORM = {
    name: "",
    description: "",
    program: "AAA",
    price: "",
    durationLabel: "1 Bulan",
    durationDays: "30",
    totalSessions: "8",
    defaultTrainingVenueId: "",
    isActive: true,
};

function normalize(value) {
    return String(value ?? "").toLowerCase();
}

function mapApiFieldErrors(error) {
    if (!error?.fieldErrors) return {};

    return Object.fromEntries(
        Object.entries(error.fieldErrors).map(([field, messages]) => [
            field,
            Array.isArray(messages) ? messages[0] : messages,
        ]),
    );
}

function sortPackages(first, second) {
    if (first.isActive !== second.isActive) return first.isActive ? -1 : 1;
    if (first.program !== second.program) {
        return first.program.localeCompare(second.program);
    }
    if (first.price !== second.price) return first.price - second.price;
    return first.name.localeCompare(second.name);
}

function upsertPackage(items, nextItem) {
    const exists = items.some((item) => item.id === nextItem.id);
    const nextItems = exists
        ? items.map((item) => (item.id === nextItem.id ? nextItem : item))
        : [nextItem, ...items];

    return [...nextItems].sort(sortPackages);
}

function getProgramLabel(program) {
    return PROGRAM_CONFIG[program]?.title ?? program ?? "Tanpa Program";
}

function toPackagePayload(pkg) {
    return {
        name: pkg.name,
        description: pkg.description ?? "",
        program: pkg.program,
        price: pkg.price,
        durationLabel: pkg.durationLabel,
        durationDays: pkg.durationDays,
        totalSessions: pkg.totalSessions ?? "",
        defaultTrainingVenueId: pkg.defaultTrainingVenueId ?? "",
        isActive: pkg.isActive,
    };
}

export default function usePackageCatalogManager({
    initialPackages = [],
    venues = [],
    canManage = false,
    canDelete = false,
    initialSearch = "",
} = {}) {
    const [packages, setPackages] = useState(() =>
        [...initialPackages].sort(sortPackages),
    );
    const [search, setSearch] = useState(initialSearch);
    const [programFilter, setProgramFilter] = useState("ALL");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState(null);
    const [formData, setFormData] = useState(EMPTY_PACKAGE_FORM);
    const [formErrors, setFormErrors] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [togglingPackageId, setTogglingPackageId] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const filteredPackages = useMemo(() => {
        const keyword = normalize(search).trim();

        return packages.filter((pkg) => {
            const matchesSearch =
                !keyword ||
                [
                    pkg.name,
                    pkg.description,
                    pkg.poolName,
                    getProgramLabel(pkg.program),
                ]
                    .map(normalize)
                    .some((value) => value.includes(keyword));
            const matchesProgram =
                programFilter === "ALL" || pkg.program === programFilter;
            const matchesStatus =
                statusFilter === "ALL" ||
                (statusFilter === "ACTIVE" ? pkg.isActive : !pkg.isActive);

            return matchesSearch && matchesProgram && matchesStatus;
        });
    }, [packages, search, programFilter, statusFilter]);

    const stats = useMemo(
        () => ({
            total: packages.length,
            active: packages.filter((pkg) => pkg.isActive).length,
            inactive: packages.filter((pkg) => !pkg.isActive).length,
            subscriptionCount: packages.reduce(
                (total, pkg) => total + (pkg.subscriptionCount ?? 0),
                0,
            ),
            transactionCount: packages.reduce(
                (total, pkg) => total + (pkg.transactionCount ?? 0),
                0,
            ),
        }),
        [packages],
    );

    function updateField(name, value) {
        setFormData((current) => {
            const next = { ...current, [name]: value };

            if (name === "durationDays") {
                const preset = PACKAGE_DURATION_PRESETS.find(
                    (item) => String(item.durationDays) === String(value),
                );

                if (preset) next.durationLabel = preset.durationLabel;
            }

            if (
                name === "program" &&
                value === "PRIVATE" &&
                !current.totalSessions
            ) {
                next.totalSessions = "4";
            }

            return next;
        });
        setFormErrors((current) => ({ ...current, [name]: undefined }));
    }

    function openCreate() {
        if (!canManage) return;
        setEditingPackage(null);
        setFormData(EMPTY_PACKAGE_FORM);
        setFormErrors({});
        setIsFormOpen(true);
    }

    function openEdit(pkg) {
        if (!canManage) return;
        setEditingPackage(pkg);
        setFormData({
            ...toPackagePayload(pkg),
            price: String(pkg.price),
            durationDays: String(pkg.durationDays),
            totalSessions:
                pkg.totalSessions === null ? "" : String(pkg.totalSessions),
            defaultTrainingVenueId: pkg.defaultTrainingVenueId ?? "",
        });
        setFormErrors({});
        setIsFormOpen(true);
    }

    function closeForm() {
        if (isSaving) return;
        setIsFormOpen(false);
        setEditingPackage(null);
        setFormErrors({});
    }

    async function submitForm(event) {
        event.preventDefault();
        if (!canManage || isSaving) return;

        const parsed = packageSchema.safeParse(formData);

        if (!parsed.success) {
            setFormErrors(getFinanceFieldErrors(parsed.error));
            return;
        }

        setIsSaving(true);

        try {
            if (editingPackage) {
                const updated = await packageCatalogApi.update(
                    editingPackage.id,
                    parsed.data,
                );
                setPackages((current) => upsertPackage(current, updated));
                toast.success(`Paket ${updated.name} berhasil diperbarui.`);
            } else {
                const created = await packageCatalogApi.create(parsed.data);
                setPackages((current) => upsertPackage(current, created));
                toast.success(`Paket ${created.name} berhasil ditambahkan.`);
            }

            setIsFormOpen(false);
            setEditingPackage(null);
            setFormData(EMPTY_PACKAGE_FORM);
            setFormErrors({});
        } catch (error) {
            setFormErrors(mapApiFieldErrors(error));
            toast.error(error?.message ?? "Gagal menyimpan paket.");
        } finally {
            setIsSaving(false);
        }
    }

    async function toggleActive(pkg) {
        if (!canManage || togglingPackageId) return;

        const parsed = packageSchema.safeParse({
            ...toPackagePayload(pkg),
            isActive: !pkg.isActive,
        });

        if (!parsed.success) {
            toast.error("Data paket belum valid untuk diubah statusnya.");
            return;
        }

        setTogglingPackageId(pkg.id);

        try {
            const updated = await packageCatalogApi.update(pkg.id, parsed.data);
            setPackages((current) => upsertPackage(current, updated));
            toast.success(
                `Paket ${updated.name} ${
                    updated.isActive ? "diaktifkan" : "dinonaktifkan"
                }.`,
            );
        } catch (error) {
            toast.error(error?.message ?? "Gagal mengubah status paket.");
        } finally {
            setTogglingPackageId(null);
        }
    }

    function requestDelete(pkg) {
        if (!canDelete) return;
        setDeleteTarget(pkg);
    }

    function cancelDelete() {
        if (!isDeleting) setDeleteTarget(null);
    }

    async function confirmDelete() {
        if (!canDelete || !deleteTarget || isDeleting) return;

        setIsDeleting(true);

        try {
            await packageCatalogApi.remove(deleteTarget.id);
            setPackages((current) =>
                current.filter((pkg) => pkg.id !== deleteTarget.id),
            );
            toast.success(`Paket ${deleteTarget.name} berhasil dihapus.`);
            setDeleteTarget(null);
        } catch (error) {
            toast.error(error?.message ?? "Gagal menghapus paket.");
        } finally {
            setIsDeleting(false);
        }
    }

    return {
        canManage,
        canDelete,
        packages,
        filteredPackages,
        stats,
        venues,
        programOptions: PROGRAM_OPTIONS,
        search,
        programFilter,
        statusFilter,
        onSearchChange: setSearch,
        onProgramFilterChange: setProgramFilter,
        onStatusFilterChange: setStatusFilter,
        isFormOpen,
        editingPackage,
        formData,
        formErrors,
        isSaving,
        togglingPackageId,
        openCreate,
        openEdit,
        closeForm,
        updateField,
        submitForm,
        toggleActive,
        deleteTarget,
        isDeleting,
        requestDelete,
        cancelDelete,
        confirmDelete,
    };
}
