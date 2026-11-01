"use client";

import {
    BadgeCheck,
    Loader2,
    MapPin,
    Package,
    PackageX,
    Pencil,
    Plus,
    Trash2,
    Users,
} from "lucide-react";
import {
    DataMasterToolbar,
    EmptyState,
    StatCard,
    StatusBadge,
} from "@/components/data-master/DataMasterUI";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import usePackageCatalogManager from "@/hooks/usePackageCatalogManager";
import { formatCurrency } from "@/lib/finance/financeUtils";
import { PROGRAM_CONFIG } from "@/lib/operational/constants";
import { cn } from "@/lib/utils";
import { PackageDeleteModal, PackageFormModal } from "./PackageCatalogModals";

function FilterSelect({ label, value, onChange, children }) {
    return (
        <label className="block min-w-0">
            <span className="sr-only">{label}</span>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#0066CC] focus:ring-4 focus:ring-blue-600/10 lg:w-44"
            >
                {children}
            </select>
        </label>
    );
}

function ActionButton({
    label,
    icon: Icon,
    onClick,
    disabled = false,
    tone = "slate",
}) {
    const tones = {
        slate: "text-slate-500 hover:bg-slate-100 hover:text-slate-800",
        red: "text-red-600 hover:bg-red-50",
    };

    return (
        <button
            type="button"
            title={label}
            aria-label={label}
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl transition disabled:cursor-not-allowed disabled:opacity-50",
                tones[tone] ?? tones.slate,
            )}
        >
            <Icon className="h-4 w-4" aria-hidden="true" />
        </button>
    );
}

function ProgramBadge({ program }) {
    return (
        <StatusBadge
            label={PROGRAM_CONFIG[program]?.title ?? program ?? "Tanpa Program"}
            tone="blue"
        />
    );
}

function VenueLabel({ venueName, location }) {
    if (!venueName)
        return (
            <span className="text-slate-400">
                Tempat dipilih saat pembayaran
            </span>
        );

    return (
        <span className="inline-flex min-w-0 items-start gap-1.5">
            <MapPin
                className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
                aria-hidden="true"
            />
            <span className="min-w-0">
                <span className="block truncate font-semibold text-slate-700">
                    {venueName}
                </span>
                {location ? (
                    <span className="block truncate text-xs text-slate-400">
                        {location}
                    </span>
                ) : null}
            </span>
        </span>
    );
}

export default function PackageCatalogManager({
    initialPackages = [],
    venues = [],
    canManage = false,
    canDelete = false,
    initialSearch = "",
}) {
    const catalog = usePackageCatalogManager({
        initialPackages,
        venues,
        canManage,
        canDelete,
        initialSearch,
    });

    return (
        <div className="space-y-4 sm:space-y-6">
            <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <Badge status="active">Marketing</Badge>
                    <h2 className="mt-3 font-heading text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                        Katalog Paket
                    </h2>
                    <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-500 sm:text-base">
                        Marketing membuat dan mengelola paket yang dijual
                        academy. Paket aktif akan tersedia sebagai pilihan pada
                        transaksi dan langganan di Finance, serta menjadi dasar
                        harga program di halaman publik.
                    </p>
                </div>

                {catalog.canManage ? (
                    <Button
                        onClick={catalog.openCreate}
                        leftIcon={
                            <Plus className="h-4 w-4" aria-hidden="true" />
                        }
                        className="shrink-0"
                    >
                        Paket Baru
                    </Button>
                ) : null}
            </section>

            {!catalog.canManage ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                    Mode lihat saja: akun Anda tidak memiliki izin untuk
                    mengubah katalog paket Marketing.
                </div>
            ) : null}

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    icon={Package}
                    label="Total Paket"
                    value={catalog.stats.total}
                    description="Seluruh paket pada katalog Marketing."
                    tone="blue"
                />
                <StatCard
                    icon={BadgeCheck}
                    label="Paket Aktif"
                    value={catalog.stats.active}
                    description="Dapat dipilih Finance dan ditawarkan ke calon siswa."
                    tone="green"
                />
                <StatCard
                    icon={PackageX}
                    label="Paket Nonaktif"
                    value={catalog.stats.inactive}
                    description="Tidak dapat dijual sampai diaktifkan kembali."
                    tone="amber"
                />
                <StatCard
                    icon={Users}
                    label="Langganan Terkait"
                    value={catalog.stats.subscriptionCount}
                    description={`${catalog.stats.transactionCount} transaksi tercatat pada katalog ini.`}
                    tone="violet"
                />
            </section>

            <DataMasterToolbar
                searchValue={catalog.search}
                onSearchChange={catalog.onSearchChange}
                searchPlaceholder="Cari nama paket, program, tempat latihan..."
            >
                <FilterSelect
                    label="Program paket"
                    value={catalog.programFilter}
                    onChange={catalog.onProgramFilterChange}
                >
                    <option value="ALL">Semua Program</option>
                    {catalog.programOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </FilterSelect>

                <FilterSelect
                    label="Status paket"
                    value={catalog.statusFilter}
                    onChange={catalog.onStatusFilterChange}
                >
                    <option value="ALL">Semua Status</option>
                    <option value="ACTIVE">Aktif</option>
                    <option value="INACTIVE">Nonaktif</option>
                </FilterSelect>
            </DataMasterToolbar>

            {catalog.filteredPackages.length > 0 ? (
                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {catalog.filteredPackages.map((pkg) => (
                        <article
                            key={pkg.id}
                            className="flex flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.02]"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[#0066CC] ring-1 ring-blue-100">
                                    <Package
                                        className="h-5 w-5"
                                        aria-hidden="true"
                                    />
                                </span>
                                <StatusBadge
                                    label={pkg.isActive ? "Aktif" : "Nonaktif"}
                                    tone={pkg.isActive ? "green" : "slate"}
                                />
                            </div>

                            <h3 className="mt-4 font-heading text-lg font-extrabold leading-tight text-slate-900">
                                {pkg.name}
                            </h3>
                            <div className="mt-2">
                                <ProgramBadge program={pkg.program} />
                            </div>
                            {pkg.description ? (
                                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-500">
                                    {pkg.description}
                                </p>
                            ) : null}

                            <p className="mt-4 font-heading text-2xl font-extrabold text-[#0066CC]">
                                {formatCurrency(pkg.price)}
                            </p>

                            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                                <div className="rounded-2xl bg-slate-50 px-3 py-2.5">
                                    <dt className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
                                        Masa Berlaku
                                    </dt>
                                    <dd className="mt-1 font-bold text-slate-700">
                                        {pkg.durationLabel} • {pkg.durationDays}{" "}
                                        hari
                                    </dd>
                                </div>
                                <div className="rounded-2xl bg-slate-50 px-3 py-2.5">
                                    <dt className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
                                        Kuota Sesi
                                    </dt>
                                    <dd className="mt-1 font-bold text-slate-700">
                                        {pkg.totalSessions
                                            ? `${pkg.totalSessions} sesi`
                                            : "Berbasis waktu"}
                                    </dd>
                                </div>
                            </dl>

                            <div className="mt-4 text-sm">
                                <VenueLabel
                                    venueName={pkg.poolName}
                                    location={
                                        pkg.defaultTrainingVenue?.location
                                    }
                                />
                            </div>

                            <p className="mt-3 text-xs text-slate-400">
                                {pkg.subscriptionCount} langganan •{" "}
                                {pkg.transactionCount} transaksi
                            </p>

                            {catalog.canManage ? (
                                <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                                    <ActionButton
                                        label="Ubah paket"
                                        icon={Pencil}
                                        onClick={() => catalog.openEdit(pkg)}
                                    />
                                    <button
                                        type="button"
                                        disabled={
                                            catalog.togglingPackageId === pkg.id
                                        }
                                        onClick={() =>
                                            catalog.toggleActive(pkg)
                                        }
                                        className={cn(
                                            "inline-flex h-10 flex-1 items-center justify-center rounded-xl px-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60",
                                            pkg.isActive
                                                ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                                                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
                                        )}
                                    >
                                        {catalog.togglingPackageId ===
                                        pkg.id ? (
                                            <Loader2
                                                className="mr-2 h-4 w-4 animate-spin"
                                                aria-hidden="true"
                                            />
                                        ) : null}
                                        {pkg.isActive
                                            ? "Nonaktifkan"
                                            : "Aktifkan"}
                                    </button>
                                    {catalog.canDelete ? (
                                        <ActionButton
                                            label="Hapus paket"
                                            icon={Trash2}
                                            tone="red"
                                            onClick={() =>
                                                catalog.requestDelete(pkg)
                                            }
                                        />
                                    ) : null}
                                </div>
                            ) : null}
                        </article>
                    ))}
                </section>
            ) : (
                <EmptyState
                    icon={Package}
                    title="Paket tidak ditemukan"
                    description="Belum ada katalog paket yang cocok dengan filter. Buat paket baru agar Finance dapat menerima pembayaran dan membuat langganan."
                />
            )}

            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-relaxed text-slate-600">
                Perubahan harga atau isi katalog hanya berlaku untuk pembelian
                berikutnya. Langganan dan transaksi lama tetap memakai snapshot
                nama, harga, masa berlaku, dan kuota sesi saat dibuat.
            </div>

            <PackageFormModal catalog={catalog} />
            <PackageDeleteModal catalog={catalog} />
        </div>
    );
}
