"use client";

import {
    BadgeCheck,
    BarChart3,
    BellRing,
    Building2,
    CalendarClock,
    CheckCircle2,
    Clock3,
    CreditCard,
    Download,
    Landmark,
    Loader2,
    Package,
    Pencil,
    Plus,
    ReceiptText,
    RefreshCw,
    Trash2,
    TrendingUp,
    Users,
    Wallet,
} from "lucide-react";
import {
    Avatar,
    DataMasterToolbar,
    EmptyState,
    StatCard,
    StatusBadge,
} from "@/components/data-master/DataMasterUI";
import {
    PAYMENT_METHOD_OPTIONS,
    REPORT_PERIOD_OPTIONS,
    SUBSCRIPTION_DUE_FILTER_OPTIONS,
    TRANSACTION_PERIOD_OPTIONS,
    TRANSACTION_STATUS_OPTIONS,
} from "@/lib/finance/constants";
import {
    formatCurrency,
    formatDateKey,
    formatTransactionDateTime,
    getTransactionDateKey,
} from "@/lib/finance/financeUtils";
import { cn } from "@/lib/utils";
import {
    PaymentMethodLabel,
    ProgramBadge,
    ReportGroupCard,
    SubscriptionDueBadge,
    TransactionStatusBadge,
    VenueLabel,
    getFinanceProgramLabel,
} from "./FinanceUI";

function FilterSelect({
    label,
    value,
    onChange,
    children,
    className = "lg:w-44",
}) {
    return (
        <label className="block min-w-0">
            <span className="sr-only">{label}</span>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className={cn(
                    "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#0066CC] focus:ring-4 focus:ring-blue-600/10",
                    className,
                )}
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
        blue: "text-[#0066CC] hover:bg-blue-50",
        green: "text-emerald-600 hover:bg-emerald-50",
        red: "text-red-600 hover:bg-red-50",
        amber: "text-amber-600 hover:bg-amber-50",
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

export function TransactionsSection({ finance }) {
    const { transactionStats: stats, subscriptionStats } = finance;

    return (
        <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    icon={Wallet}
                    label="Pendapatan Hari Ini"
                    value={formatCurrency(stats.todayRevenue)}
                    description={
                        finance.todayKey
                            ? `${formatDateKey(finance.todayKey, { weekday: "long", day: "numeric", month: "long" })} • ${stats.todayPaidCount} pembayaran lunas`
                            : "Memuat tanggal hari ini..."
                    }
                    tone="blue"
                />
                <StatCard
                    icon={ReceiptText}
                    label="Transaksi Hari Ini"
                    value={stats.todayCount}
                    description="Seluruh status transaksi yang tercatat hari ini."
                    tone="violet"
                />
                <StatCard
                    icon={Clock3}
                    label="Menunggu Pembayaran"
                    value={stats.pendingCount}
                    description={`${formatCurrency(stats.pendingAmount)} belum dikonfirmasi.`}
                    tone="amber"
                />
                <StatCard
                    icon={Users}
                    label="Langganan Aktif"
                    value={subscriptionStats.active}
                    description={`${subscriptionStats.dueSoon} segera jatuh tempo • ${subscriptionStats.overdue} lewat tempo.`}
                    tone="green"
                />
            </div>

            <DataMasterToolbar
                searchValue={finance.transactionSearch}
                onSearchChange={finance.onTransactionSearchChange}
                searchPlaceholder="Cari invoice, siswa, paket, referensi..."
            >
                <FilterSelect
                    label="Periode transaksi"
                    value={finance.transactionPeriod}
                    onChange={finance.onTransactionPeriodChange}
                >
                    {TRANSACTION_PERIOD_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </FilterSelect>

                <FilterSelect
                    label="Status transaksi"
                    value={finance.transactionStatusFilter}
                    onChange={finance.onTransactionStatusFilterChange}
                >
                    <option value="ALL">Semua Status</option>
                    {TRANSACTION_STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </FilterSelect>

                <FilterSelect
                    label="Metode pembayaran"
                    value={finance.transactionMethodFilter}
                    onChange={finance.onTransactionMethodFilterChange}
                >
                    <option value="ALL">Semua Metode</option>
                    {PAYMENT_METHOD_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </FilterSelect>

                <FilterSelect
                    label="Program transaksi"
                    value={finance.transactionProgramFilter}
                    onChange={finance.onTransactionProgramFilterChange}
                >
                    <option value="ALL">Semua Program</option>
                    {finance.programOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </FilterSelect>

                <FilterSelect
                    label="Tempat latihan transaksi"
                    value={finance.transactionVenueFilter}
                    onChange={finance.onTransactionVenueFilterChange}
                >
                    <option value="ALL">Semua Tempat</option>
                    {finance.transactionVenueOptions.map((venueName) => (
                        <option key={venueName} value={venueName}>
                            {venueName}
                        </option>
                    ))}
                </FilterSelect>
            </DataMasterToolbar>

            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.02]">
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <div>
                        <h3 className="font-heading text-lg font-extrabold text-slate-900">
                            Daftar Transaksi
                        </h3>
                        <p className="mt-0.5 text-sm text-slate-500">
                            Menampilkan {finance.filteredTransactions.length}{" "}
                            dari {finance.transactions.length} transaksi
                            database.
                        </p>
                    </div>
                    <StatusBadge
                        label={`Total lunas: ${formatCurrency(stats.totalRevenue)}`}
                        tone="green"
                    />
                </div>

                {finance.filteredTransactions.length > 0 ? (
                    <div className="overflow-x-auto border-t border-slate-100">
                        <table className="w-full min-w-[920px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                                <tr>
                                    <th className="px-5 py-3 font-extrabold">
                                        Invoice
                                    </th>
                                    <th className="px-5 py-3 font-extrabold">
                                        Siswa / Keterangan
                                    </th>
                                    <th className="px-5 py-3 font-extrabold">
                                        Paket / Tempat
                                    </th>
                                    <th className="px-5 py-3 font-extrabold">
                                        Metode
                                    </th>
                                    <th className="px-5 py-3 font-extrabold">
                                        Jumlah
                                    </th>
                                    <th className="px-5 py-3 font-extrabold">
                                        Status
                                    </th>
                                    <th className="px-5 py-3 text-right font-extrabold">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {finance.filteredTransactions.map(
                                    (transaction) => {
                                        const canDelete = ![
                                            "PAID",
                                            "REFUNDED",
                                        ].includes(transaction.status);

                                        return (
                                            <tr
                                                key={transaction.id}
                                                className="align-top hover:bg-slate-50/60"
                                            >
                                                <td className="px-5 py-4">
                                                    <p className="whitespace-nowrap font-extrabold text-slate-900">
                                                        {
                                                            transaction.invoiceNumber
                                                        }
                                                    </p>
                                                    <p className="mt-1 whitespace-nowrap text-xs text-slate-400">
                                                        {formatTransactionDateTime(
                                                            transaction.transactionDate,
                                                        )}
                                                    </p>
                                                    <p className="mt-1 text-xs text-slate-400">
                                                        {formatDateKey(
                                                            getTransactionDateKey(
                                                                transaction,
                                                            ),
                                                        )}
                                                    </p>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="flex min-w-0 items-center gap-3">
                                                        <Avatar
                                                            name={
                                                                transaction
                                                                    .student
                                                                    ?.name ??
                                                                "Siswa"
                                                            }
                                                            className="h-10 w-10 text-[11px]"
                                                        />
                                                        <div className="min-w-0">
                                                            <p className="truncate font-bold text-slate-900">
                                                                {transaction
                                                                    .student
                                                                    ?.name ??
                                                                    "Siswa Terhapus"}
                                                            </p>
                                                            <p className="mt-0.5 line-clamp-2 max-w-[260px] text-xs leading-relaxed text-slate-500">
                                                                {
                                                                    transaction.description
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <p className="max-w-[220px] truncate font-bold text-slate-700">
                                                        {transaction.package
                                                            ?.name ??
                                                            transaction
                                                                .subscription
                                                                ?.packageName ??
                                                            "-"}
                                                    </p>
                                                    <div className="mt-1">
                                                        <ProgramBadge
                                                            program={
                                                                transaction.program
                                                            }
                                                        />
                                                    </div>
                                                    <div className="mt-2 max-w-[220px] text-xs">
                                                        <VenueLabel
                                                            venueName={
                                                                transaction.poolName
                                                            }
                                                        />
                                                    </div>
                                                </td>

                                                <td className="whitespace-nowrap px-5 py-4">
                                                    <PaymentMethodLabel
                                                        method={
                                                            transaction.paymentMethod
                                                        }
                                                    />
                                                    {transaction.referenceNumber ? (
                                                        <p className="mt-1 max-w-[150px] truncate text-xs text-slate-400">
                                                            Ref:{" "}
                                                            {
                                                                transaction.referenceNumber
                                                            }
                                                        </p>
                                                    ) : null}
                                                </td>

                                                <td className="whitespace-nowrap px-5 py-4 font-extrabold text-slate-900">
                                                    {formatCurrency(
                                                        transaction.amount,
                                                    )}
                                                </td>

                                                <td className="whitespace-nowrap px-5 py-4">
                                                    <TransactionStatusBadge
                                                        status={
                                                            transaction.status
                                                        }
                                                    />
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <ActionButton
                                                            label="Lihat kwitansi"
                                                            icon={ReceiptText}
                                                            tone="blue"
                                                            onClick={() =>
                                                                finance.setReceiptTransaction(
                                                                    transaction,
                                                                )
                                                            }
                                                        />

                                                        {finance.canManage &&
                                                        transaction.status ===
                                                            "PENDING" ? (
                                                            <ActionButton
                                                                label="Konfirmasi lunas"
                                                                icon={
                                                                    finance.markingPaidId ===
                                                                    transaction.id
                                                                        ? Loader2
                                                                        : CheckCircle2
                                                                }
                                                                tone="green"
                                                                disabled={
                                                                    finance.markingPaidId ===
                                                                    transaction.id
                                                                }
                                                                onClick={() =>
                                                                    finance.markTransactionPaid(
                                                                        transaction,
                                                                    )
                                                                }
                                                            />
                                                        ) : null}

                                                        {finance.canManage ? (
                                                            <ActionButton
                                                                label="Ubah transaksi"
                                                                icon={Pencil}
                                                                onClick={() =>
                                                                    finance.openEditTransaction(
                                                                        transaction,
                                                                    )
                                                                }
                                                            />
                                                        ) : null}

                                                        {finance.canDelete &&
                                                        canDelete ? (
                                                            <ActionButton
                                                                label="Hapus transaksi"
                                                                icon={Trash2}
                                                                tone="red"
                                                                onClick={() =>
                                                                    finance.requestDelete(
                                                                        "transaction",
                                                                        transaction,
                                                                    )
                                                                }
                                                            />
                                                        ) : null}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    },
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-5">
                        <EmptyState
                            icon={ReceiptText}
                            title="Transaksi tidak ditemukan"
                            description="Belum ada transaksi pada filter ini. Catat pembayaran baru atau longgarkan filter transaksi."
                        />
                    </div>
                )}
            </section>
        </div>
    );
}

export function SubscriptionsSection({ finance }) {
    const stats = finance.subscriptionStats;

    return (
        <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    icon={Package}
                    label="Total Langganan"
                    value={stats.total}
                    description="Seluruh langganan siswa dalam cakupan akses Anda."
                    tone="blue"
                />
                <StatCard
                    icon={BadgeCheck}
                    label="Langganan Aktif"
                    value={stats.active}
                    description="Termasuk langganan yang akan jatuh tempo dalam tujuh hari."
                    tone="green"
                />
                <StatCard
                    icon={CalendarClock}
                    label="Segera Jatuh Tempo"
                    value={stats.dueSoon}
                    description="Masa berlaku tersisa maksimal tujuh hari."
                    tone="amber"
                />
                <StatCard
                    icon={BellRing}
                    label="Perlu Ditindaklanjuti"
                    value={stats.overdue + stats.pending}
                    description={`${stats.overdue} lewat tempo • ${stats.pending} menunggu pembayaran.`}
                    tone="violet"
                />
            </div>

            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.02]">
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <div>
                        <h3 className="font-heading text-lg font-extrabold text-slate-900">
                            Langganan Siswa
                        </h3>
                        <p className="mt-0.5 text-sm text-slate-500">
                            Diurutkan dari yang paling mendesak berdasarkan
                            jatuh tempo.
                        </p>
                    </div>

                    {finance.canManage ? (
                        <button
                            type="button"
                            onClick={finance.openCreateSubscription}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 text-sm font-bold text-[#0066CC] transition hover:bg-blue-100"
                        >
                            <Plus className="h-4 w-4" aria-hidden="true" />
                            Langganan Manual
                        </button>
                    ) : null}
                </div>

                <div className="border-t border-slate-100 px-5 py-4">
                    <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px]">
                        <input
                            type="search"
                            value={finance.subscriptionSearch}
                            onChange={(event) =>
                                finance.onSubscriptionSearchChange(
                                    event.target.value,
                                )
                            }
                            placeholder="Cari siswa, paket, invoice terakhir..."
                            className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#0066CC] focus:bg-white focus:ring-4 focus:ring-blue-600/10"
                        />
                        <FilterSelect
                            label="Kondisi langganan"
                            value={finance.subscriptionDueFilter}
                            onChange={finance.onSubscriptionDueFilterChange}
                            className="lg:w-full"
                        >
                            {SUBSCRIPTION_DUE_FILTER_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </FilterSelect>
                        <FilterSelect
                            label="Program langganan"
                            value={finance.subscriptionProgramFilter}
                            onChange={finance.onSubscriptionProgramFilterChange}
                            className="lg:w-full"
                        >
                            <option value="ALL">Semua Program</option>
                            {finance.programOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </FilterSelect>
                    </div>
                </div>

                {finance.filteredSubscriptions.length > 0 ? (
                    <div className="overflow-x-auto border-t border-slate-100">
                        <table className="w-full min-w-[980px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                                <tr>
                                    <th className="px-5 py-3 font-extrabold">
                                        Siswa
                                    </th>
                                    <th className="px-5 py-3 font-extrabold">
                                        Paket / Tempat
                                    </th>
                                    <th className="px-5 py-3 font-extrabold">
                                        Periode
                                    </th>
                                    <th className="px-5 py-3 font-extrabold">
                                        Sesi
                                    </th>
                                    <th className="px-5 py-3 font-extrabold">
                                        Kondisi
                                    </th>
                                    <th className="px-5 py-3 text-right font-extrabold">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {finance.filteredSubscriptions.map(
                                    (subscription) => {
                                        const usedPercentage =
                                            subscription.totalSessions &&
                                            subscription.remainingSessions !==
                                                null
                                                ? Math.min(
                                                      100,
                                                      Math.max(
                                                          0,
                                                          ((subscription.totalSessions -
                                                              subscription.remainingSessions) /
                                                              subscription.totalSessions) *
                                                              100,
                                                      ),
                                                  )
                                                : null;
                                        const showReminder = [
                                            "DUE_SOON",
                                            "OVERDUE",
                                            "PENDING",
                                        ].includes(subscription.dueState.key);
                                        const canPay =
                                            finance.canManage &&
                                            subscription.status !== "CANCELLED";

                                        return (
                                            <tr
                                                key={subscription.id}
                                                className="align-top hover:bg-slate-50/60"
                                            >
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar
                                                            name={
                                                                subscription
                                                                    .student
                                                                    ?.name ??
                                                                "Siswa"
                                                            }
                                                            className="h-10 w-10 text-[11px]"
                                                        />
                                                        <div>
                                                            <p className="font-bold text-slate-900">
                                                                {subscription
                                                                    .student
                                                                    ?.name ??
                                                                    "Siswa Terhapus"}
                                                            </p>
                                                            <p className="mt-0.5 text-xs text-slate-400">
                                                                {getFinanceProgramLabel(
                                                                    subscription
                                                                        .student
                                                                        ?.level,
                                                                )}
                                                                {subscription
                                                                    .student
                                                                    ?.age
                                                                    ? ` • ${subscription.student.age} tahun`
                                                                    : ""}
                                                            </p>
                                                            {subscription.latestTransaction ? (
                                                                <p className="mt-1 text-xs font-semibold text-[#0066CC]">
                                                                    {
                                                                        subscription
                                                                            .latestTransaction
                                                                            .invoiceNumber
                                                                    }
                                                                </p>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <p className="max-w-[230px] truncate font-bold text-slate-800">
                                                        {
                                                            subscription.packageName
                                                        }
                                                    </p>
                                                    <div className="mt-1.5">
                                                        <ProgramBadge
                                                            program={
                                                                subscription.program
                                                            }
                                                        />
                                                    </div>
                                                    <div className="mt-2 max-w-[230px] text-xs">
                                                        <VenueLabel
                                                            venueName={
                                                                subscription.poolName
                                                            }
                                                        />
                                                    </div>
                                                    <p className="mt-2 font-bold text-slate-700">
                                                        {formatCurrency(
                                                            subscription.price,
                                                        )}
                                                    </p>
                                                </td>

                                                <td className="whitespace-nowrap px-5 py-4">
                                                    <p className="font-semibold text-slate-700">
                                                        {formatDateKey(
                                                            subscription.startsAt,
                                                        )}
                                                    </p>
                                                    <p className="mt-1 text-slate-400">
                                                        sampai
                                                    </p>
                                                    <p className="mt-1 font-semibold text-slate-700">
                                                        {formatDateKey(
                                                            subscription.expiresAt,
                                                        )}
                                                    </p>
                                                    {subscription.autoRenew ? (
                                                        <p className="mt-2 text-xs font-bold text-[#0066CC]">
                                                            Auto-renew aktif
                                                        </p>
                                                    ) : null}
                                                </td>

                                                <td className="min-w-[150px] px-5 py-4">
                                                    {subscription.totalSessions ? (
                                                        <>
                                                            <p className="font-bold text-slate-700">
                                                                Sisa{" "}
                                                                {subscription.remainingSessions ??
                                                                    0}
                                                                /
                                                                {
                                                                    subscription.totalSessions
                                                                }
                                                            </p>
                                                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                                                                <div
                                                                    className="h-full rounded-full bg-[#0066CC]"
                                                                    style={{
                                                                        width: `${usedPercentage ?? 0}%`,
                                                                    }}
                                                                />
                                                            </div>
                                                            <p className="mt-1 text-xs text-slate-400">
                                                                {(
                                                                    usedPercentage ??
                                                                    0
                                                                ).toFixed(0)}
                                                                % terpakai
                                                            </p>
                                                        </>
                                                    ) : (
                                                        <p className="font-semibold text-slate-500">
                                                            Berbasis masa
                                                            berlaku
                                                        </p>
                                                    )}
                                                </td>

                                                <td className="min-w-[190px] px-5 py-4">
                                                    <SubscriptionDueBadge
                                                        dueState={
                                                            subscription.dueState
                                                        }
                                                    />
                                                    <p className="mt-2 max-w-[220px] text-xs leading-relaxed text-slate-500">
                                                        {
                                                            subscription
                                                                .dueState
                                                                .description
                                                        }
                                                    </p>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {showReminder ? (
                                                            <ActionButton
                                                                label="Kirim pengingat WhatsApp"
                                                                icon={BellRing}
                                                                tone="amber"
                                                                onClick={() =>
                                                                    finance.remindSubscription(
                                                                        subscription,
                                                                    )
                                                                }
                                                            />
                                                        ) : null}

                                                        {canPay ? (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    finance.openSubscriptionPayment(
                                                                        subscription,
                                                                    )
                                                                }
                                                                className="inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-blue-50 px-3 text-xs font-extrabold text-[#0066CC] transition hover:bg-blue-100"
                                                            >
                                                                {subscription.status ===
                                                                "PENDING" ? (
                                                                    <CreditCard
                                                                        className="h-4 w-4"
                                                                        aria-hidden="true"
                                                                    />
                                                                ) : (
                                                                    <RefreshCw
                                                                        className="h-4 w-4"
                                                                        aria-hidden="true"
                                                                    />
                                                                )}
                                                                {subscription.status ===
                                                                "PENDING"
                                                                    ? "Bayar"
                                                                    : "Perpanjang"}
                                                            </button>
                                                        ) : null}

                                                        {finance.canManage ? (
                                                            <>
                                                                <ActionButton
                                                                    label="Ubah langganan"
                                                                    icon={
                                                                        Pencil
                                                                    }
                                                                    onClick={() =>
                                                                        finance.openEditSubscription(
                                                                            subscription,
                                                                        )
                                                                    }
                                                                />
                                                                {finance.canDelete ? (
                                                                    <ActionButton
                                                                        label="Hapus langganan"
                                                                        icon={
                                                                            Trash2
                                                                        }
                                                                        tone="red"
                                                                        onClick={() =>
                                                                            finance.requestDelete(
                                                                                "subscription",
                                                                                subscription,
                                                                            )
                                                                        }
                                                                    />
                                                                ) : null}
                                                            </>
                                                        ) : null}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    },
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-5">
                        <EmptyState
                            icon={Users}
                            title="Langganan tidak ditemukan"
                            description="Belum ada langganan yang cocok dengan filter. Pembayaran paket yang lunas/menunggu akan membuat langganan otomatis."
                        />
                    </div>
                )}
            </section>
        </div>
    );
}

export function ReportsSection({ finance }) {
    const report = finance.report;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/[0.02] md:flex-row md:items-center md:justify-between">
                <div className="grid gap-2 sm:grid-cols-3">
                    {REPORT_PERIOD_OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() =>
                                finance.onReportPeriodChange(option.value)
                            }
                            className={cn(
                                "h-10 rounded-xl px-3 text-sm font-bold transition",
                                finance.reportPeriod === option.value
                                    ? "bg-[#0066CC] text-white"
                                    : "bg-slate-50 text-slate-600 hover:bg-slate-100",
                            )}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>

                <button
                    type="button"
                    onClick={finance.exportTransactionsCsv}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white transition hover:bg-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-900/15"
                >
                    <Download className="h-4 w-4" aria-hidden="true" />
                    Export CSV
                </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    icon={TrendingUp}
                    label={`Pendapatan • ${report.periodLabel}`}
                    value={formatCurrency(report.totalRevenue)}
                    description="Hanya transaksi berstatus Lunas yang dihitung."
                    tone="blue"
                />
                <StatCard
                    icon={ReceiptText}
                    label="Transaksi Lunas"
                    value={report.paidCount}
                    description={`Dari ${report.transactions.length} transaksi pada periode.`}
                    tone="green"
                />
                <StatCard
                    icon={Wallet}
                    label="Rata-rata Transaksi"
                    value={formatCurrency(report.averageTransaction)}
                    description="Rata-rata nominal pembayaran lunas."
                    tone="violet"
                />
                <StatCard
                    icon={Clock3}
                    label="Pending Periode"
                    value={report.pendingCount}
                    description={`${formatCurrency(report.pendingAmount)} menunggu • refund ${formatCurrency(report.refundedAmount)}.`}
                    tone="amber"
                />
            </div>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.02]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h3 className="font-heading text-lg font-extrabold text-slate-900">
                            Tren Pendapatan 7 Hari Terakhir
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                            Total transaksi lunas per hari berdasarkan tanggal
                            pembayaran.
                        </p>
                    </div>
                    <StatusBadge
                        label={`Terbesar: ${formatCurrency(report.maxDailyAmount, { compact: true })}`}
                        tone="blue"
                    />
                </div>

                {report.dailySeries.length > 0 ? (
                    <>
                        <div className="mt-6 grid grid-cols-7 items-end gap-2 sm:gap-3">
                            {report.dailySeries.map((item) => {
                                const height =
                                    report.maxDailyAmount > 0
                                        ? Math.max(
                                              5,
                                              (item.amount /
                                                  report.maxDailyAmount) *
                                                  100,
                                          )
                                        : 5;

                                return (
                                    <div
                                        key={item.dateKey}
                                        className="min-w-0 text-center"
                                    >
                                        <p className="mb-2 truncate text-[11px] font-extrabold text-slate-600">
                                            {formatCurrency(item.amount, {
                                                compact: true,
                                            })}
                                        </p>
                                        <div className="flex h-44 items-end rounded-2xl bg-slate-50 px-1.5 py-2">
                                            <div
                                                title={`${item.dateLabel}: ${formatCurrency(item.amount)} dari ${item.count} transaksi`}
                                                className="w-full rounded-xl bg-[#0066CC]"
                                                style={{ height: `${height}%` }}
                                            />
                                        </div>
                                        <p className="mt-2 text-xs font-extrabold text-slate-700">
                                            {item.label}
                                        </p>
                                        <p className="truncate text-[11px] text-slate-400">
                                            {item.dateLabel}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-100">
                            <table className="w-full min-w-[620px] text-left text-sm">
                                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                                    <tr>
                                        <th className="px-4 py-3 font-extrabold">
                                            Tanggal
                                        </th>
                                        <th className="px-4 py-3 font-extrabold">
                                            Transaksi Lunas
                                        </th>
                                        <th className="px-4 py-3 text-right font-extrabold">
                                            Pendapatan
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {[...report.dailySeries]
                                        .reverse()
                                        .map((item) => (
                                            <tr key={item.dateKey}>
                                                <td className="px-4 py-3 font-semibold text-slate-700">
                                                    {formatDateKey(
                                                        item.dateKey,
                                                        {
                                                            weekday: "long",
                                                            day: "numeric",
                                                            month: "long",
                                                            year: "numeric",
                                                        },
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-slate-500">
                                                    {item.count}
                                                </td>
                                                <td className="px-4 py-3 text-right font-extrabold text-slate-900">
                                                    {formatCurrency(
                                                        item.amount,
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : (
                    <div className="mt-5 h-48 animate-pulse rounded-3xl bg-slate-50" />
                )}
            </section>

            <div className="grid gap-4 xl:grid-cols-2">
                <ReportGroupCard
                    title="Pendapatan per Tempat Latihan"
                    icon={Building2}
                    groups={report.byVenue}
                />
                <ReportGroupCard
                    title="Pendapatan per Program / Level"
                    icon={BarChart3}
                    groups={report.byProgram}
                />
                <ReportGroupCard
                    title="Pendapatan per Metode Pembayaran"
                    icon={Landmark}
                    groups={report.byMethod}
                />
                <ReportGroupCard
                    title="Pendapatan per Paket"
                    icon={Package}
                    groups={report.byPackage}
                />
            </div>

            <div className="rounded-3xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm leading-relaxed text-blue-900">
                <strong>Catatan laporan:</strong> Pendapatan dihitung dari
                transaksi
                <strong> Lunas</strong>. Transaksi pending, gagal, dibatalkan,
                dan refund tidak masuk total pendapatan, tetapi tetap disertakan
                pada file CSV untuk kebutuhan audit.
            </div>
        </div>
    );
}
