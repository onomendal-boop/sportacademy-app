import { Suspense } from "react";
import Link from "next/link";
import {
    ArrowRight,
    CalendarDays,
    ClipboardList,
    Clock3,
    FileText,
    GraduationCap,
    MapPin,
    Package,
    ReceiptText,
    TrendingUp,
    UserRound,
    UsersRound,
    Wallet,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { requireFeatureAccess } from "@/lib/auth/authService";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import { getDashboardOverview } from "@/lib/dashboard/overviewService";

export const metadata = {
    title: "Ringkasan Dashboard | AAA Sport Academy",
    description:
        "Ringkasan aktivitas AAA Sport Academy berdasarkan data database.",
};

const PROGRAM_SLUGS = {
    AAA: "aaa",
    A3: "a3",
    SWDC: "swdc",
    PRIVATE: "private",
};

const currencyFormatter = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
});

function formatCurrency(value) {
    return currencyFormatter.format(Number(value ?? 0));
}

function formatDate(value, options = {}) {
    if (!value) return "-";

    return new Intl.DateTimeFormat("id-ID", {
        timeZone: "Asia/Jakarta",
        day: "numeric",
        month: "short",
        year: "numeric",
        ...options,
    }).format(new Date(value));
}

function formatDateOnly(value) {
    if (!value) return "-";

    return new Intl.DateTimeFormat("id-ID", {
        timeZone: "UTC",
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(new Date(value));
}

function formatSlotDateTime(value) {
    if (!value) return "-";

    // Slot Operasional menyimpan tanggal + jam dinding sebagai UTC. Format UTC
    // menjaga jam yang tampil sama dengan Schedule.startTime/endTime di DB.
    return `${new Intl.DateTimeFormat("id-ID", {
        timeZone: "UTC",
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value))} WIB`;
}

function daysUntil(dateValue, todayKey) {
    const today = new Date(`${todayKey}T00:00:00.000Z`);
    const target = new Date(`${String(dateValue).slice(0, 10)}T00:00:00.000Z`);
    return Math.round((target - today) / 86_400_000);
}

function KpiCard({ icon: Icon, label, value, helper, href }) {
    const content = (
        <>
            <div className="flex items-start justify-between gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[#0066CC]">
                    <Icon className="h-5 w-5" />
                </span>
                {href ? (
                    <ArrowRight className="h-4 w-4 text-slate-300" />
                ) : null}
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-500">{label}</p>
            <p className="mt-1 break-words text-2xl font-extrabold tracking-tight text-slate-900">
                {value}
            </p>
            {helper ? (
                <p className="mt-1 text-sm leading-relaxed text-slate-500">
                    {helper}
                </p>
            ) : null}
        </>
    );

    if (!href) {
        return <Card padded>{content}</Card>;
    }

    return (
        <Link href={href} className="block">
            <Card padded hover className="h-full">
                {content}
            </Card>
        </Link>
    );
}

function EmptyState({ title, description }) {
    return (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
            <p className="font-bold text-slate-900">{title}</p>
            <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-slate-500">
                {description}
            </p>
        </div>
    );
}

function ScheduleList({ schedules, emptyDescription }) {
    if (!schedules.length) {
        return (
            <EmptyState
                title="Tidak ada jadwal aktif hari ini"
                description={emptyDescription}
            />
        );
    }

    return (
        <ul className="divide-y divide-slate-100">
            {schedules.map((schedule) => (
                <li key={schedule.id}>
                    <Link
                        href={`/dashboard/schedule/${PROGRAM_SLUGS[schedule.program] ?? "private"}`}
                        className="group flex gap-4 py-4 first:pt-0 last:pb-0"
                    >
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#0066CC]">
                            <CalendarDays className="h-5 w-5" />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-2">
                                <span className="font-bold text-slate-900 group-hover:text-[#0066CC]">
                                    {schedule.title}
                                </span>
                                <Badge status="completed" size="sm" dot={false}>
                                    {schedule.programLabel}
                                </Badge>
                            </span>
                            <span className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                                <span className="inline-flex items-center gap-1.5">
                                    <Clock3 className="h-4 w-4" />
                                    {schedule.startTime}–{schedule.endTime} WIB
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <MapPin className="h-4 w-4" />
                                    {schedule.poolName}
                                    {schedule.lane ? ` • ${schedule.lane}` : ""}
                                </span>
                                <span>Kapasitas {schedule.capacity}</span>
                            </span>
                            {schedule.coaches.length ? (
                                <span className="mt-1 block text-sm text-slate-500">
                                    Pelatih: {schedule.coaches.join(", ")}
                                </span>
                            ) : null}
                        </span>
                        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#0066CC]" />
                    </Link>
                </li>
            ))}
        </ul>
    );
}

function BusinessOverview({ overview }) {
    const business = overview.business;
    const maxRevenue = Math.max(
        ...business.revenueTrend.map((item) => item.amount),
        1,
    );
    const kpis = [
        {
            icon: GraduationCap,
            label: "Siswa Aktif",
            value: business.stats.activeStudentCount.toLocaleString("id-ID"),
            helper: `${business.stats.pendingStudentCount} siswa menunggu aktivasi`,
            href: "/dashboard/students",
        },
        {
            icon: Wallet,
            label: "Pendapatan Bulan Ini",
            value: formatCurrency(business.stats.monthlyRevenue),
            helper: `Hari ini ${formatCurrency(business.stats.todayRevenue)}`,
            href: "/dashboard/finance?tab=reports",
        },
        {
            icon: ReceiptText,
            label: "Pembayaran Pending",
            value: business.stats.pendingPaymentCount.toLocaleString("id-ID"),
            helper: formatCurrency(business.stats.pendingPaymentAmount),
            href: "/dashboard/finance?tab=transactions",
        },
        {
            icon: Package,
            label: "Langganan Segera Berakhir",
            value: business.stats.expiringSubscriptionCount.toLocaleString(
                "id-ID",
            ),
            helper: "Dalam 7 hari ke depan",
            href: "/dashboard/finance?tab=subscriptions",
        },
    ];

    if (business.stats.pendingCount !== null) {
        kpis.push({
            icon: UserRound,
            label: "Lead Baru",
            value: business.stats.pendingCount.toLocaleString("id-ID"),
            helper: "Belum ditindaklanjuti tim Marketing",
            href: "/dashboard/marketing/leads",
        });
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {kpis.map((kpi) => (
                    <KpiCard key={kpi.label} {...kpi} />
                ))}
            </section>

            <section className="grid items-start gap-4 xl:grid-cols-5">
                <Card
                    title="Pendapatan 7 Hari Terakhir"
                    description={`Transaksi lunas berdasarkan tanggal pembayaran${business.scope ? ` • ${business.scopeLabel}` : ""}.`}
                    className="xl:col-span-3"
                    action={
                        <Button
                            href="/dashboard/finance?tab=reports"
                            size="sm"
                            variant="secondary"
                        >
                            Lihat Laporan
                        </Button>
                    }
                >
                    <div
                        className="flex h-56 items-end gap-2 sm:gap-3"
                        aria-label="Grafik pendapatan tujuh hari terakhir"
                    >
                        {business.revenueTrend.map((item) => (
                            <div
                                key={item.dateKey}
                                className="flex min-w-0 flex-1 flex-col items-center gap-2"
                            >
                                <span className="max-w-full truncate text-[11px] font-bold text-slate-500">
                                    {item.amount
                                        ? formatCurrency(item.amount).replace(
                                              "Rp ",
                                              "",
                                          )
                                        : "0"}
                                </span>
                                <div className="flex h-36 w-full items-end rounded-2xl bg-blue-50 px-1.5 py-1.5">
                                    <div
                                        className="w-full rounded-xl bg-gradient-to-t from-[#0066CC] to-cyan-400"
                                        style={{
                                            height: `${item.amount ? Math.max(8, (item.amount / maxRevenue) * 100) : 3}%`,
                                        }}
                                    />
                                </div>
                                <span className="text-xs font-bold text-slate-500">
                                    {item.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card
                    title="Siswa Aktif per Program"
                    description="Dihitung langsung dari level siswa berstatus ACTIVE."
                    className="xl:col-span-2"
                >
                    <ul className="space-y-4">
                        {business.studentsByLevel.map((item) => {
                            const percentage = business.stats.activeStudentCount
                                ? (item.count /
                                      business.stats.activeStudentCount) *
                                  100
                                : 0;

                            return (
                                <li key={item.level}>
                                    <div className="flex items-center justify-between gap-3 text-sm">
                                        <span className="font-bold text-slate-800">
                                            {item.label}
                                        </span>
                                        <span className="font-extrabold text-slate-900">
                                            {item.count}
                                        </span>
                                    </div>
                                    <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
                                        <div
                                            className="h-full rounded-full bg-[#0066CC]"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </Card>
            </section>

            <section className="grid items-start gap-4 xl:grid-cols-2">
                <Card
                    title="Jadwal Hari Ini"
                    description={formatDateOnly(
                        `${overview.dateKey}T00:00:00.000Z`,
                    )}
                    action={
                        <Button
                            href="/dashboard/operasional/jadwal"
                            size="sm"
                            variant="secondary"
                        >
                            Semua Jadwal
                        </Button>
                    }
                >
                    <ScheduleList
                        schedules={business.todaySchedules}
                        emptyDescription="Jadwal aktif yang dibuat di Operasional akan tampil otomatis pada hari yang sesuai."
                    />
                </Card>

                <Card
                    title="Langganan Perlu Perpanjangan"
                    description="Langganan aktif/pending yang berakhir dalam tujuh hari."
                    action={
                        <Button
                            href="/dashboard/finance?tab=subscriptions"
                            size="sm"
                            variant="secondary"
                        >
                            Kelola Langganan
                        </Button>
                    }
                >
                    {business.expiringSubscriptions.length ? (
                        <ul className="divide-y divide-slate-100">
                            {business.expiringSubscriptions.map(
                                (subscription) => {
                                    const remainingDays = daysUntil(
                                        subscription.expiresAt,
                                        overview.dateKey,
                                    );

                                    return (
                                        <li
                                            key={subscription.id}
                                            className="flex gap-3 py-4 first:pt-0 last:pb-0"
                                        >
                                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                                                <Package className="h-5 w-5" />
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate font-bold text-slate-900">
                                                    {subscription.studentName}
                                                </span>
                                                <span className="mt-0.5 block text-sm text-slate-500">
                                                    {subscription.packageName} •{" "}
                                                    {subscription.programLabel}
                                                </span>
                                                <span className="mt-1 block text-xs text-slate-400">
                                                    Berakhir{" "}
                                                    {formatDateOnly(
                                                        subscription.expiresAt,
                                                    )}
                                                    {subscription.remainingSessions !==
                                                    null
                                                        ? ` • Sisa ${subscription.remainingSessions} sesi`
                                                        : ""}
                                                </span>
                                            </span>
                                            <Badge
                                                status={
                                                    remainingDays <= 0
                                                        ? "cancelled"
                                                        : "pending"
                                                }
                                                size="sm"
                                            >
                                                {remainingDays <= 0
                                                    ? "Hari ini"
                                                    : `H-${remainingDays}`}
                                            </Badge>
                                        </li>
                                    );
                                },
                            )}
                        </ul>
                    ) : (
                        <EmptyState
                            title="Tidak ada paket yang segera berakhir"
                            description="Daftar ini otomatis terisi ketika ada langganan yang masa berlakunya tersisa tujuh hari atau kurang."
                        />
                    )}
                </Card>
            </section>

            <section className="grid items-start gap-4 xl:grid-cols-2">
                <Card
                    title="Transaksi Terbaru"
                    description="Aktivitas pembayaran terakhir dari Finance."
                    action={
                        <Button
                            href="/dashboard/finance?tab=transactions"
                            size="sm"
                            variant="secondary"
                        >
                            Semua Transaksi
                        </Button>
                    }
                >
                    {business.recentTransactions.length ? (
                        <ul className="divide-y divide-slate-100">
                            {business.recentTransactions.map((transaction) => (
                                <li
                                    key={transaction.id}
                                    className="flex gap-3 py-4 first:pt-0 last:pb-0"
                                >
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate font-bold text-slate-900">
                                            {transaction.description}
                                        </span>
                                        <span className="mt-0.5 block text-sm text-slate-500">
                                            {transaction.studentName} •{" "}
                                            {transaction.invoiceNumber}
                                        </span>
                                        <span className="mt-1 block text-xs text-slate-400">
                                            {formatDate(transaction.occurredAt)}{" "}
                                            • {transaction.paymentMethodLabel}
                                        </span>
                                    </span>
                                    <span className="text-right">
                                        <span className="block font-extrabold text-slate-900">
                                            {formatCurrency(transaction.amount)}
                                        </span>
                                        <Badge
                                            status={
                                                transaction.status === "PAID"
                                                    ? "completed"
                                                    : transaction.status
                                            }
                                            size="sm"
                                            className="mt-1"
                                        >
                                            {transaction.status === "PAID"
                                                ? "Lunas"
                                                : transaction.status}
                                        </Badge>
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <EmptyState
                            title="Belum ada transaksi"
                            description="Transaksi yang dicatat melalui Finance akan muncul di sini."
                        />
                    )}
                </Card>

                <Card
                    title="Siswa Terbaru"
                    description="Pendaftaran siswa terakhir yang tercatat di Data Master."
                    action={
                        <Button
                            href="/dashboard/students"
                            size="sm"
                            variant="secondary"
                        >
                            Data Siswa
                        </Button>
                    }
                >
                    {business.latestStudents.length ? (
                        <ul className="divide-y divide-slate-100">
                            {business.latestStudents.map((student) => (
                                <li
                                    key={student.id}
                                    className="flex items-center gap-3 py-4 first:pt-0 last:pb-0"
                                >
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-extrabold text-[#0066CC]">
                                        {student.name.slice(0, 1).toUpperCase()}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate font-bold text-slate-900">
                                            {student.name}
                                        </span>
                                        <span className="text-sm text-slate-500">
                                            {student.age} tahun •{" "}
                                            {student.levelLabel} •{" "}
                                            {formatDate(student.createdAt)}
                                        </span>
                                    </span>
                                    <Badge status={student.status} size="sm">
                                        {student.status}
                                    </Badge>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <EmptyState
                            title="Belum ada siswa"
                            description="Tambahkan siswa melalui Data Master untuk mulai melihat ringkasan operasional."
                        />
                    )}
                </Card>
            </section>
        </div>
    );
}

function CoachOverview({ overview }) {
    const coach = overview.coach;

    return (
        <div className="space-y-4 sm:space-y-6">
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                    icon={CalendarDays}
                    label="Kelas Hari Ini"
                    value={coach.stats.classesToday}
                    helper={formatDateOnly(`${overview.dateKey}T00:00:00.000Z`)}
                    href="/dashboard/operasional/jadwal"
                />
                <KpiCard
                    icon={UsersRound}
                    label="Penugasan Aktif"
                    value={coach.stats.activeAssignmentCount}
                    helper="Jadwal berulang yang ditugaskan kepada Anda"
                />
                <KpiCard
                    icon={FileText}
                    label="Draf Raport"
                    value={coach.stats.draftReportCount}
                    helper="Raport yang masih perlu dilengkapi"
                    href="/dashboard/operasional/raport"
                />
                <KpiCard
                    icon={Clock3}
                    label="Private Mendatang"
                    value={coach.stats.upcomingPrivateCount}
                    helper="Booking terkonfirmasi dalam 30 hari"
                    href="/dashboard/schedule/private"
                />
            </section>

            <section className="grid items-start gap-4 xl:grid-cols-2">
                <Card
                    title="Jadwal Mengajar Hari Ini"
                    description="Berdasarkan CoachAssignment aktif pada akun Anda."
                >
                    <ScheduleList
                        schedules={coach.todaySchedules}
                        emptyDescription="Tidak ada penugasan kelas untuk hari ini. Penugasan baru dari Operasional akan tampil otomatis."
                    />
                </Card>

                <Card
                    title="Draf Raport Saya"
                    description="Lanjutkan penilaian yang belum diterbitkan."
                    action={
                        <Button
                            href="/dashboard/operasional/raport"
                            size="sm"
                            variant="secondary"
                        >
                            Buka Raport
                        </Button>
                    }
                >
                    {coach.draftReports.length ? (
                        <ul className="divide-y divide-slate-100">
                            {coach.draftReports.map((report) => (
                                <li
                                    key={report.id}
                                    className="py-4 first:pt-0 last:pb-0"
                                >
                                    <p className="font-bold text-slate-900">
                                        {report.studentName}
                                    </p>
                                    <p className="mt-1 text-sm text-slate-500">
                                        {report.periodLabel} •{" "}
                                        {report.levelLabel} • Diperbarui{" "}
                                        {formatDate(report.updatedAt)}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <EmptyState
                            title="Tidak ada draf raport"
                            description="Semua raport yang Anda buat sudah diterbitkan atau belum ada raport baru yang dimulai."
                        />
                    )}
                </Card>
            </section>

            <Card
                title="Sesi Private Mendatang"
                description="Booking Private terkonfirmasi dengan penugasan efektif kepada Anda."
            >
                {coach.upcomingPrivateSessions.length ? (
                    <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {coach.upcomingPrivateSessions.map((session) => (
                            <li
                                key={session.id}
                                className="rounded-2xl bg-blue-50 px-4 py-4"
                            >
                                <p className="font-bold text-slate-900">
                                    {session.studentName}
                                </p>
                                <p className="mt-1 text-sm text-slate-600">
                                    {session.title}
                                </p>
                                <p className="mt-2 text-sm text-slate-500">
                                    {formatSlotDateTime(session.startsAt)}
                                </p>
                                <p className="text-sm text-slate-500">
                                    {session.poolName}
                                </p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <EmptyState
                        title="Belum ada booking Private"
                        description="Booking terkonfirmasi yang ditugaskan kepada Anda akan tampil di sini."
                    />
                )}
            </Card>
        </div>
    );
}

function StudentOverview({ overview }) {
    const student = overview.student;

    if (!student.profile) {
        return (
            <Card
                title="Profil Siswa Belum Terhubung"
                description="Akun login Anda belum terhubung ke record siswa."
            >
                <EmptyState
                    title="Hubungi admin untuk menghubungkan akun"
                    description="Setelah User.studentProfile terhubung, paket, booking Private, jadwal level, dan raport Anda akan tampil otomatis dari database."
                />
            </Card>
        );
    }

    const subscription = student.activeSubscription;

    return (
        <div className="space-y-4 sm:space-y-6">
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                    icon={GraduationCap}
                    label="Level Saat Ini"
                    value={student.profile.levelLabel}
                    helper={`Status siswa ${student.profile.status}`}
                />
                <KpiCard
                    icon={Package}
                    label="Paket Terakhir/Aktif"
                    value={
                        subscription ? subscription.packageName : "Belum ada"
                    }
                    helper={
                        subscription
                            ? `Berlaku sampai ${formatDateOnly(subscription.expiresAt)}`
                            : "Hubungi admin untuk aktivasi paket"
                    }
                    href="/dashboard/my-package"
                />
                <KpiCard
                    icon={CalendarDays}
                    label="Booking Private"
                    value={student.stats.upcomingBookingCount}
                    helper="Booking terkonfirmasi mulai hari ini"
                    href="/dashboard/schedule/private"
                />
                <KpiCard
                    icon={FileText}
                    label="Raport Terbit"
                    value={student.stats.publishedReportCount}
                    helper={
                        student.latestReport
                            ? `Terbaru: ${student.latestReport.periodLabel}`
                            : "Belum ada raport terbit"
                    }
                    href="/dashboard/operasional/raport"
                />
            </section>

            <section className="grid items-start gap-4 xl:grid-cols-2">
                <Card
                    title="Paket Saya"
                    description="Langganan aktif/pending terakhir dari Finance."
                    action={
                        <Button
                            href="/dashboard/my-package"
                            size="sm"
                            variant="secondary"
                        >
                            Detail Paket
                        </Button>
                    }
                >
                    {subscription ? (
                        <dl className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <dt className="text-sm font-semibold text-slate-500">
                                    Paket
                                </dt>
                                <dd className="mt-1 font-bold text-slate-900">
                                    {subscription.packageName}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-semibold text-slate-500">
                                    Program
                                </dt>
                                <dd className="mt-1 font-bold text-slate-900">
                                    {subscription.programLabel}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-semibold text-slate-500">
                                    Masa Berlaku
                                </dt>
                                <dd className="mt-1 font-bold text-slate-900">
                                    {formatDateOnly(subscription.startsAt)} –{" "}
                                    {formatDateOnly(subscription.expiresAt)}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-semibold text-slate-500">
                                    Sisa Sesi
                                </dt>
                                <dd className="mt-1 font-bold text-slate-900">
                                    {subscription.remainingSessions ??
                                        "Berdasarkan masa berlaku"}
                                </dd>
                            </div>
                        </dl>
                    ) : (
                        <EmptyState
                            title="Belum ada paket aktif"
                            description="Paket yang diaktifkan admin melalui pembayaran lunas akan muncul di sini."
                        />
                    )}
                </Card>

                <Card
                    title="Booking Private Mendatang"
                    description="Booking terkonfirmasi milik akun Anda."
                >
                    {student.upcomingBookings.length ? (
                        <ul className="divide-y divide-slate-100">
                            {student.upcomingBookings.map((booking) => (
                                <li
                                    key={booking.id}
                                    className="py-4 first:pt-0 last:pb-0"
                                >
                                    <p className="font-bold text-slate-900">
                                        {booking.title}
                                    </p>
                                    <p className="mt-1 text-sm text-slate-500">
                                        {formatSlotDateTime(booking.startsAt)} •{" "}
                                        {booking.poolName}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <EmptyState
                            title="Belum ada booking mendatang"
                            description="Gunakan jadwal Private untuk membuat booking apabila paket Anda aktif."
                        />
                    )}
                </Card>
            </section>

            <section className="grid items-start gap-4 xl:grid-cols-2">
                <Card
                    title="Jadwal Level Hari Ini"
                    description={`Jadwal berulang aktif untuk level ${student.profile.levelLabel}.`}
                >
                    <ScheduleList
                        schedules={student.levelSchedulesToday}
                        emptyDescription="Tidak ada jadwal berulang aktif untuk level Anda pada hari ini."
                    />
                </Card>

                <Card
                    title="Tagihan Pending"
                    description="Invoice Anda yang masih menunggu pembayaran/verifikasi."
                >
                    {student.pendingTransactions.length ? (
                        <ul className="divide-y divide-slate-100">
                            {student.pendingTransactions.map((transaction) => (
                                <li
                                    key={transaction.id}
                                    className="flex gap-3 py-4 first:pt-0 last:pb-0"
                                >
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate font-bold text-slate-900">
                                            {transaction.description}
                                        </span>
                                        <span className="mt-1 block text-sm text-slate-500">
                                            {transaction.invoiceNumber} •{" "}
                                            {formatDate(transaction.createdAt)}
                                        </span>
                                    </span>
                                    <span className="font-extrabold text-slate-900">
                                        {formatCurrency(transaction.amount)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <EmptyState
                            title="Tidak ada tagihan pending"
                            description="Invoice pending yang dibuat untuk akun siswa Anda akan tampil di sini."
                        />
                    )}
                </Card>
            </section>
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div
            role="status"
            aria-label="Memuat ringkasan dashboard"
            className="space-y-4 sm:space-y-6"
        >
            <span className="sr-only">Memuat ringkasan dari database...</span>
            <div className="h-24 animate-pulse rounded-3xl bg-slate-200" />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div
                        key={index}
                        className="h-40 animate-pulse rounded-2xl bg-slate-200"
                    />
                ))}
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
                <div className="h-80 animate-pulse rounded-2xl bg-slate-200" />
                <div className="h-80 animate-pulse rounded-2xl bg-slate-200" />
            </div>
        </div>
    );
}

async function DashboardContent() {
    const currentUser = await requireFeatureAccess("dashboard", "/dashboard");
    const overview = await getDashboardOverview(currentUser);
    const roleLabel = ROLE_LABELS[currentUser.role] ?? currentUser.role;
    const scopeLabel = overview.business?.scopeLabel;

    return (
        <div className="space-y-4 sm:space-y-6">
            <section className="overflow-hidden rounded-3xl bg-slate-950 px-5 py-6 text-white shadow-xl shadow-blue-950/10 sm:px-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <p className="text-sm font-bold uppercase tracking-[0.16em] text-cyan-300">
                            {roleLabel}
                            {scopeLabel ? ` • ${scopeLabel}` : ""}
                        </p>
                        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
                            Halo, {currentUser.name}
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
                            Ringkasan ini dihitung langsung dari database sesuai
                            role dan cakupan program akun Anda pada{" "}
                            {formatDateOnly(
                                `${overview.dateKey}T00:00:00.000Z`,
                            )}
                            .
                        </p>
                    </div>
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-cyan-100 ring-1 ring-white/15">
                        <TrendingUp className="h-4 w-4" />
                        Data real-time dari database
                    </span>
                </div>
            </section>

            {overview.business ? (
                <BusinessOverview overview={overview} />
            ) : null}
            {overview.coach ? <CoachOverview overview={overview} /> : null}
            {overview.student ? <StudentOverview overview={overview} /> : null}
        </div>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<DashboardSkeleton />}>
            <DashboardContent />
        </Suspense>
    );
}
