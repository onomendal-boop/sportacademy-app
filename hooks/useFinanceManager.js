"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    FINANCE_TABS,
    PAYMENT_METHOD_LABELS,
    REPORT_PERIOD_OPTIONS,
    TRANSACTION_TYPE_LABELS,
} from "@/lib/finance/constants";
import { subscriptionApi, transactionApi } from "@/lib/finance/financeClient";
import {
    addDaysToDateKey,
    buildWhatsAppReminderUrl,
    escapeCsvCell,
    escapeHtml,
    formatCurrency,
    formatDateKey,
    getLocalTodayKey,
    getSubscriptionDueState,
    getTransactionDateKey,
} from "@/lib/finance/financeUtils";
import {
    PROGRAM_CONFIG,
    getProgramOptionsForScope,
} from "@/lib/operational/constants";
import {
    getFinanceFieldErrors,
    subscriptionSchema,
    transactionCreateSchema,
    transactionUpdateSchema,
} from "@/lib/validations/finance";

const EMPTY_PAYMENT_FORM = {
    studentId: "",
    packageId: "",
    subscriptionId: "",
    trainingVenueId: "",
    type: "SUBSCRIPTION_PAYMENT",
    description: "",
    amount: "",
    paymentMethod: "TRANSFER",
    status: "PAID",
    referenceNumber: "",
    paymentDate: "",
    startDate: "",
    autoRenew: false,
    notes: "",
};

const EMPTY_SUBSCRIPTION_FORM = {
    studentId: "",
    packageId: "",
    trainingVenueId: "",
    packageName: "",
    program: "AAA",
    price: "",
    startsAt: "",
    expiresAt: "",
    totalSessions: "",
    remainingSessions: "",
    status: "ACTIVE",
    autoRenew: false,
    notes: "",
};

const DUE_PRIORITY = {
    OVERDUE: 0,
    DUE_SOON: 1,
    PENDING: 2,
    ACTIVE: 3,
    INACTIVE: 4,
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

function sortTransactions(first, second) {
    const firstDate = first.transactionDate ?? first.createdAt ?? "";
    const secondDate = second.transactionDate ?? second.createdAt ?? "";

    if (firstDate !== secondDate) return secondDate.localeCompare(firstDate);
    return String(second.invoiceNumber).localeCompare(
        String(first.invoiceNumber),
    );
}

function sortSubscriptions(first, second) {
    const priorityDifference =
        (DUE_PRIORITY[first.dueState?.key] ?? 5) -
        (DUE_PRIORITY[second.dueState?.key] ?? 5);

    if (priorityDifference !== 0) return priorityDifference;
    if (first.expiresAt !== second.expiresAt) {
        return String(first.expiresAt).localeCompare(String(second.expiresAt));
    }
    return String(first.student?.name ?? "").localeCompare(
        String(second.student?.name ?? ""),
    );
}

function upsertById(items, nextItem, sortFunction) {
    const exists = items.some((item) => item.id === nextItem.id);
    const nextItems = exists
        ? items.map((item) => (item.id === nextItem.id ? nextItem : item))
        : [nextItem, ...items];

    return sortFunction ? [...nextItems].sort(sortFunction) : nextItems;
}

function getProgramLabel(program) {
    return PROGRAM_CONFIG[program]?.title ?? program ?? "Tanpa Program";
}

function groupPaidTransactions(transactions, getLabel) {
    const groups = new Map();
    const total = transactions.reduce(
        (sum, transaction) => sum + transaction.amount,
        0,
    );

    for (const transaction of transactions) {
        const label = getLabel(transaction) || "Tidak Diisi";
        const current = groups.get(label) ?? { label, amount: 0, count: 0 };
        current.amount += transaction.amount;
        current.count += 1;
        groups.set(label, current);
    }

    return [...groups.values()]
        .map((group) => ({
            ...group,
            percentage: total > 0 ? (group.amount / total) * 100 : 0,
        }))
        .sort((first, second) => second.amount - first.amount);
}

export default function useFinanceManager({
    packageOptions = [],
    initialSubscriptions = [],
    initialTransactions = [],
    students: initialStudents = [],
    venues = [],
    canManage = false,
    canDelete = false,
    programScope = null,
    initialTab = "transactions",
    initialSearch = "",
    initialSearchTarget = "transactions",
    reminderSettings = null,
} = {}) {
    const router = useRouter();
    const scopedEmptySubscriptionForm = {
        ...EMPTY_SUBSCRIPTION_FORM,
        program: programScope ?? EMPTY_SUBSCRIPTION_FORM.program,
    };
    const programOptions = getProgramOptionsForScope(programScope, {
        includePrivate: true,
    });
    const subscriptionProgramOptions = programOptions;
    const validInitialTab = FINANCE_TABS.includes(initialTab)
        ? initialTab
        : "transactions";

    // Katalog bersifat read-only di Finance. Data ini hanya menjadi opsi
    // pada form transaksi/langganan; CRUD paket berada di Marketing.
    const packages = useMemo(
        () => [...packageOptions].sort(sortPackages),
        [packageOptions],
    );
    const [subscriptions, setSubscriptions] = useState(initialSubscriptions);
    const [transactions, setTransactions] = useState(() =>
        [...initialTransactions].sort(sortTransactions),
    );
    const [studentOptions, setStudentOptions] = useState(initialStudents);
    const [activeTab, setActiveTab] = useState(validInitialTab);
    const [todayKey, setTodayKey] = useState("");

    const [transactionSearch, setTransactionSearch] = useState(
        initialSearchTarget === "transactions" ? initialSearch : "",
    );
    const [transactionPeriod, setTransactionPeriod] = useState("ALL");
    const [transactionStatusFilter, setTransactionStatusFilter] =
        useState("ALL");
    const [transactionMethodFilter, setTransactionMethodFilter] =
        useState("ALL");
    const [transactionProgramFilter, setTransactionProgramFilter] =
        useState("ALL");
    const [transactionVenueFilter, setTransactionVenueFilter] = useState("ALL");

    const [subscriptionSearch, setSubscriptionSearch] = useState(
        initialSearchTarget === "subscriptions" ? initialSearch : "",
    );
    const [subscriptionDueFilter, setSubscriptionDueFilter] = useState("ALL");
    const [subscriptionProgramFilter, setSubscriptionProgramFilter] =
        useState("ALL");
    const [reportPeriod, setReportPeriod] = useState("7");

    const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [paymentFormData, setPaymentFormData] = useState(EMPTY_PAYMENT_FORM);
    const [paymentFormErrors, setPaymentFormErrors] = useState({});
    const [isSavingPayment, setIsSavingPayment] = useState(false);
    const [markingPaidId, setMarkingPaidId] = useState(null);
    const [receiptTransaction, setReceiptTransaction] = useState(null);

    const [isSubscriptionFormOpen, setIsSubscriptionFormOpen] = useState(false);
    const [editingSubscription, setEditingSubscription] = useState(null);
    const [subscriptionFormData, setSubscriptionFormData] = useState(
        scopedEmptySubscriptionForm,
    );
    const [subscriptionFormErrors, setSubscriptionFormErrors] = useState({});
    const [isSavingSubscription, setIsSavingSubscription] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        setTodayKey(getLocalTodayKey());
    }, []);

    useEffect(() => {
        setActiveTab(validInitialTab);
    }, [validInitialTab]);

    const studentById = useMemo(
        () =>
            Object.fromEntries(
                studentOptions.map((student) => [student.id, student]),
            ),
        [studentOptions],
    );

    const packageById = useMemo(
        () => Object.fromEntries(packages.map((pkg) => [pkg.id, pkg])),
        [packages],
    );

    const venueById = useMemo(
        () => Object.fromEntries(venues.map((venue) => [venue.id, venue])),
        [venues],
    );

    const activePackages = useMemo(
        () => packages.filter((pkg) => pkg.isActive),
        [packages],
    );

    const enrichedSubscriptions = useMemo(
        () =>
            subscriptions
                .map((subscription) => ({
                    ...subscription,
                    dueState: getSubscriptionDueState(subscription, todayKey),
                }))
                .sort(sortSubscriptions),
        [subscriptions, todayKey],
    );

    const subscriptionStats = useMemo(
        () => ({
            total: enrichedSubscriptions.length,
            active: enrichedSubscriptions.filter((item) =>
                ["ACTIVE", "DUE_SOON"].includes(item.dueState.key),
            ).length,
            dueSoon: enrichedSubscriptions.filter(
                (item) => item.dueState.key === "DUE_SOON",
            ).length,
            overdue: enrichedSubscriptions.filter(
                (item) => item.dueState.key === "OVERDUE",
            ).length,
            pending: enrichedSubscriptions.filter(
                (item) => item.dueState.key === "PENDING",
            ).length,
        }),
        [enrichedSubscriptions],
    );

    const transactionStats = useMemo(() => {
        const todayTransactions = todayKey
            ? transactions.filter(
                  (transaction) =>
                      getTransactionDateKey(transaction) === todayKey,
              )
            : [];
        const todayPaid = todayTransactions.filter(
            (transaction) => transaction.status === "PAID",
        );
        const pending = transactions.filter(
            (transaction) => transaction.status === "PENDING",
        );

        return {
            todayRevenue: todayPaid.reduce(
                (total, transaction) => total + transaction.amount,
                0,
            ),
            todayCount: todayTransactions.length,
            todayPaidCount: todayPaid.length,
            pendingCount: pending.length,
            pendingAmount: pending.reduce(
                (total, transaction) => total + transaction.amount,
                0,
            ),
            totalRevenue: transactions
                .filter((transaction) => transaction.status === "PAID")
                .reduce((total, transaction) => total + transaction.amount, 0),
        };
    }, [transactions, todayKey]);

    const transactionVenueOptions = useMemo(
        () =>
            [
                ...new Set(
                    transactions
                        .map((transaction) => transaction.poolName)
                        .filter(Boolean),
                ),
            ].sort(),
        [transactions],
    );

    const filteredTransactions = useMemo(() => {
        const keyword = normalize(transactionSearch).trim();
        let periodStart = "";

        if (todayKey && transactionPeriod === "TODAY") periodStart = todayKey;
        if (todayKey && transactionPeriod === "7") {
            periodStart = addDaysToDateKey(todayKey, -6);
        }
        if (todayKey && transactionPeriod === "30") {
            periodStart = addDaysToDateKey(todayKey, -29);
        }

        return transactions.filter((transaction) => {
            const transactionDate = getTransactionDateKey(transaction);
            const matchesPeriod =
                transactionPeriod === "ALL" ||
                !todayKey ||
                (transactionPeriod === "TODAY"
                    ? transactionDate === todayKey
                    : transactionDate >= periodStart &&
                      transactionDate <= todayKey);
            const matchesStatus =
                transactionStatusFilter === "ALL" ||
                transaction.status === transactionStatusFilter;
            const matchesMethod =
                transactionMethodFilter === "ALL" ||
                transaction.paymentMethod === transactionMethodFilter;
            const matchesProgram =
                transactionProgramFilter === "ALL" ||
                transaction.program === transactionProgramFilter;
            const matchesVenue =
                transactionVenueFilter === "ALL" ||
                transaction.poolName === transactionVenueFilter;
            const matchesSearch =
                !keyword ||
                [
                    transaction.invoiceNumber,
                    transaction.student?.name,
                    transaction.description,
                    transaction.package?.name,
                    transaction.subscription?.packageName,
                    transaction.poolName,
                    transaction.referenceNumber,
                ]
                    .map(normalize)
                    .some((value) => value.includes(keyword));

            return (
                matchesPeriod &&
                matchesStatus &&
                matchesMethod &&
                matchesProgram &&
                matchesVenue &&
                matchesSearch
            );
        });
    }, [
        transactions,
        transactionSearch,
        transactionPeriod,
        transactionStatusFilter,
        transactionMethodFilter,
        transactionProgramFilter,
        transactionVenueFilter,
        todayKey,
    ]);

    const filteredSubscriptions = useMemo(() => {
        const keyword = normalize(subscriptionSearch).trim();

        return enrichedSubscriptions.filter((subscription) => {
            const matchesSearch =
                !keyword ||
                [
                    subscription.student?.name,
                    subscription.packageName,
                    subscription.poolName,
                    getProgramLabel(subscription.program),
                    subscription.latestTransaction?.invoiceNumber,
                ]
                    .map(normalize)
                    .some((value) => value.includes(keyword));
            const matchesDue =
                subscriptionDueFilter === "ALL" ||
                subscription.dueState.key === subscriptionDueFilter;
            const matchesProgram =
                subscriptionProgramFilter === "ALL" ||
                subscription.program === subscriptionProgramFilter;

            return matchesSearch && matchesDue && matchesProgram;
        });
    }, [
        enrichedSubscriptions,
        subscriptionSearch,
        subscriptionDueFilter,
        subscriptionProgramFilter,
    ]);

    const report = useMemo(() => {
        const periodOption =
            REPORT_PERIOD_OPTIONS.find((item) => item.value === reportPeriod) ??
            REPORT_PERIOD_OPTIONS[0];
        const cutoffKey =
            todayKey && periodOption.days
                ? addDaysToDateKey(todayKey, -(periodOption.days - 1))
                : "";
        const periodTransactions = transactions.filter((transaction) => {
            if (!periodOption.days) return true;
            if (!todayKey) return true;

            const dateKey = getTransactionDateKey(transaction);
            return dateKey >= cutoffKey && dateKey <= todayKey;
        });
        const paidTransactions = periodTransactions.filter(
            (transaction) => transaction.status === "PAID",
        );
        const pendingTransactions = periodTransactions.filter(
            (transaction) => transaction.status === "PENDING",
        );
        const totalRevenue = paidTransactions.reduce(
            (total, transaction) => total + transaction.amount,
            0,
        );
        const dailySeries = todayKey
            ? Array.from({ length: 7 }, (_, index) => {
                  const dateKey = addDaysToDateKey(todayKey, index - 6);
                  const dayTransactions = transactions.filter(
                      (transaction) =>
                          transaction.status === "PAID" &&
                          getTransactionDateKey(transaction) === dateKey,
                  );

                  return {
                      dateKey,
                      label: formatDateKey(dateKey, { weekday: "short" }),
                      dateLabel: formatDateKey(dateKey, {
                          day: "numeric",
                          month: "short",
                      }),
                      amount: dayTransactions.reduce(
                          (total, transaction) => total + transaction.amount,
                          0,
                      ),
                      count: dayTransactions.length,
                  };
              })
            : [];

        return {
            periodLabel: periodOption.label,
            transactions: periodTransactions,
            paidTransactions,
            totalRevenue,
            paidCount: paidTransactions.length,
            averageTransaction:
                paidTransactions.length > 0
                    ? Math.round(totalRevenue / paidTransactions.length)
                    : 0,
            pendingCount: pendingTransactions.length,
            pendingAmount: pendingTransactions.reduce(
                (total, transaction) => total + transaction.amount,
                0,
            ),
            refundedAmount: periodTransactions
                .filter((transaction) => transaction.status === "REFUNDED")
                .reduce((total, transaction) => total + transaction.amount, 0),
            dailySeries,
            maxDailyAmount: Math.max(
                ...dailySeries.map((item) => item.amount),
                0,
            ),
            byVenue: groupPaidTransactions(
                paidTransactions,
                (transaction) => transaction.poolName || "Tanpa Tempat Latihan",
            ),
            byProgram: groupPaidTransactions(paidTransactions, (transaction) =>
                getProgramLabel(transaction.program),
            ),
            byMethod: groupPaidTransactions(
                paidTransactions,
                (transaction) =>
                    PAYMENT_METHOD_LABELS[transaction.paymentMethod],
            ),
            byPackage: groupPaidTransactions(
                paidTransactions,
                (transaction) =>
                    transaction.package?.name ??
                    transaction.subscription?.packageName ??
                    transaction.description,
            ),
            byType: groupPaidTransactions(
                paidTransactions,
                (transaction) => TRANSACTION_TYPE_LABELS[transaction.type],
            ),
        };
    }, [reportPeriod, todayKey, transactions]);

    function changeTab(tab) {
        if (!FINANCE_TABS.includes(tab)) return;

        setActiveTab(tab);
        router.replace(`/dashboard/finance?tab=${tab}`, { scroll: false });
    }

    function applyTransactionResult(result) {
        if (result?.transaction) {
            setTransactions((current) =>
                upsertById(current, result.transaction, sortTransactions),
            );

            if (
                result.transaction.status === "PAID" &&
                result.transaction.studentId
            ) {
                setStudentOptions((current) =>
                    current.map((student) =>
                        student.id === result.transaction.studentId
                            ? { ...student, status: "ACTIVE" }
                            : student,
                    ),
                );
            }
        }

        if (result?.subscription) {
            setSubscriptions((current) =>
                upsertById(current, result.subscription, (first, second) =>
                    String(first.expiresAt).localeCompare(
                        String(second.expiresAt),
                    ),
                ),
            );
        }

        if (result?.deletedSubscriptionId) {
            setSubscriptions((current) =>
                current.filter(
                    (subscription) =>
                        subscription.id !== result.deletedSubscriptionId,
                ),
            );
        }
    }

    function openCreatePayment(prefill = {}) {
        if (!canManage) return;

        const today = getLocalTodayKey();
        setEditingTransaction(null);
        setPaymentFormData({
            ...EMPTY_PAYMENT_FORM,
            paymentDate: today,
            startDate: today,
            ...prefill,
        });
        setPaymentFormErrors({});
        setIsPaymentFormOpen(true);
    }

    function openSubscriptionPayment(subscription) {
        if (!canManage) return;

        const today = getLocalTodayKey();
        const pkg =
            packageById[subscription.packageId] ??
            packages.find((item) => item.name === subscription.packageName) ??
            null;
        const venue = venues.find(
            (item) => item.name === subscription.poolName,
        );
        const isPending = subscription.status === "PENDING";
        const startDate = isPending
            ? subscription.startsAt || today
            : subscription.expiresAt >= today
              ? addDaysToDateKey(subscription.expiresAt, 1)
              : today;

        openCreatePayment({
            studentId: subscription.studentId,
            packageId: pkg?.id ?? subscription.packageId ?? "",
            subscriptionId: subscription.id,
            trainingVenueId: pkg?.defaultTrainingVenueId ?? venue?.id ?? "",
            type:
                subscription.program === "PRIVATE"
                    ? "PRIVATE_VOUCHER"
                    : "SUBSCRIPTION_PAYMENT",
            description: isPending
                ? `Pembayaran ${subscription.packageName}`
                : `Perpanjangan ${subscription.packageName}`,
            amount: String(pkg?.price ?? subscription.price),
            paymentDate: today,
            startDate,
            autoRenew: subscription.autoRenew,
        });
    }

    function openEditTransaction(transaction) {
        if (!canManage) return;

        setEditingTransaction(transaction);
        setPaymentFormData({
            studentId: transaction.studentId ?? "",
            packageId: transaction.packageId ?? "",
            subscriptionId: transaction.subscriptionId ?? "",
            trainingVenueId:
                transaction.package?.defaultTrainingVenueId ??
                venues.find((venue) => venue.name === transaction.poolName)
                    ?.id ??
                "",
            type: transaction.type,
            description: transaction.description ?? "",
            amount: String(transaction.amount),
            paymentMethod: transaction.paymentMethod,
            status: transaction.status,
            referenceNumber: transaction.referenceNumber ?? "",
            paymentDate:
                getTransactionDateKey(transaction) || getLocalTodayKey(),
            startDate: transaction.subscription?.startsAt ?? "",
            autoRenew: false,
            notes: transaction.notes ?? "",
        });
        setPaymentFormErrors({});
        setIsPaymentFormOpen(true);
    }

    function closePaymentForm() {
        if (isSavingPayment) return;
        setIsPaymentFormOpen(false);
        setEditingTransaction(null);
        setPaymentFormErrors({});
    }

    function updatePaymentField(name, value) {
        setPaymentFormData((current) => {
            const next = { ...current, [name]: value };

            if (name === "packageId" && !editingTransaction) {
                const pkg = packageById[value];

                if (pkg) {
                    next.amount = String(pkg.price);
                    next.trainingVenueId =
                        pkg.defaultTrainingVenueId ?? current.trainingVenueId;
                    next.type =
                        pkg.program === "PRIVATE"
                            ? "PRIVATE_VOUCHER"
                            : "SUBSCRIPTION_PAYMENT";
                    next.description = current.subscriptionId
                        ? `Perpanjangan ${pkg.name}`
                        : `Pembayaran ${pkg.name}`;
                }
            }

            if (name === "studentId" && current.subscriptionId) {
                const linkedSubscription = subscriptions.find(
                    (item) => item.id === current.subscriptionId,
                );

                if (
                    linkedSubscription &&
                    linkedSubscription.studentId !== value
                ) {
                    next.subscriptionId = "";
                }
            }

            if (
                name === "type" &&
                ["REGISTRATION", "OTHER"].includes(value) &&
                !editingTransaction
            ) {
                next.packageId = "";
                next.subscriptionId = "";
            }

            if (
                name === "paymentDate" &&
                (!current.startDate ||
                    current.startDate === current.paymentDate)
            ) {
                next.startDate = value;
            }

            return next;
        });
        setPaymentFormErrors((current) => ({ ...current, [name]: undefined }));
    }

    async function submitPaymentForm(event) {
        event.preventDefault();
        if (!canManage || isSavingPayment) return;

        const parsed = editingTransaction
            ? transactionUpdateSchema.safeParse({
                  description: paymentFormData.description,
                  amount: paymentFormData.amount,
                  paymentMethod: paymentFormData.paymentMethod,
                  status: paymentFormData.status,
                  referenceNumber: paymentFormData.referenceNumber,
                  paymentDate: paymentFormData.paymentDate,
                  notes: paymentFormData.notes,
              })
            : transactionCreateSchema.safeParse(paymentFormData);

        if (!parsed.success) {
            setPaymentFormErrors(getFinanceFieldErrors(parsed.error));
            return;
        }

        setIsSavingPayment(true);

        try {
            const result = editingTransaction
                ? await transactionApi.update(
                      editingTransaction.id,
                      parsed.data,
                  )
                : await transactionApi.create(parsed.data);

            applyTransactionResult(result);
            setIsPaymentFormOpen(false);
            setEditingTransaction(null);
            setPaymentFormData(EMPTY_PAYMENT_FORM);
            setPaymentFormErrors({});

            if (result.transaction.status === "PAID") {
                setReceiptTransaction(result.transaction);
                toast.success(
                    `Pembayaran ${result.transaction.invoiceNumber} berhasil dicatat.`,
                );
            } else {
                toast.success(
                    `Transaksi ${result.transaction.invoiceNumber} berhasil disimpan.`,
                );
            }
        } catch (error) {
            setPaymentFormErrors(mapApiFieldErrors(error));
            toast.error(error?.message ?? "Gagal menyimpan transaksi.");
        } finally {
            setIsSavingPayment(false);
        }
    }

    async function markTransactionPaid(transaction) {
        if (!canManage || markingPaidId) return;

        if (
            transaction.paymentMethod !== "CASH" &&
            !transaction.referenceNumber
        ) {
            openEditTransaction(transaction);
            setPaymentFormData((current) => ({ ...current, status: "PAID" }));
            toast.info(
                "Lengkapi nomor referensi sebelum mengonfirmasi pembayaran.",
            );
            return;
        }

        const parsed = transactionUpdateSchema.safeParse({
            description: transaction.description,
            amount: transaction.amount,
            paymentMethod: transaction.paymentMethod,
            status: "PAID",
            referenceNumber: transaction.referenceNumber,
            paymentDate: getLocalTodayKey(),
            notes: transaction.notes,
        });

        if (!parsed.success) {
            toast.error(
                "Data transaksi belum lengkap untuk dikonfirmasi lunas.",
            );
            return;
        }

        setMarkingPaidId(transaction.id);

        try {
            const result = await transactionApi.update(
                transaction.id,
                parsed.data,
            );
            applyTransactionResult(result);
            setReceiptTransaction(result.transaction);
            toast.success(
                `Transaksi ${result.transaction.invoiceNumber} dikonfirmasi lunas.`,
            );
        } catch (error) {
            toast.error(error?.message ?? "Gagal mengonfirmasi pembayaran.");
        } finally {
            setMarkingPaidId(null);
        }
    }

    function updateSubscriptionField(name, value) {
        setSubscriptionFormData((current) => {
            const next = { ...current, [name]: value };

            if (name === "packageId") {
                const pkg = packageById[value];

                if (pkg) {
                    next.packageName = pkg.name;
                    next.program = pkg.program;
                    next.price = String(pkg.price);
                    next.trainingVenueId =
                        pkg.defaultTrainingVenueId ?? current.trainingVenueId;
                    next.totalSessions =
                        pkg.totalSessions === null
                            ? ""
                            : String(pkg.totalSessions);
                    next.remainingSessions = next.totalSessions;

                    if (current.startsAt) {
                        next.expiresAt = addDaysToDateKey(
                            current.startsAt,
                            pkg.durationDays,
                        );
                    }
                }
            }

            if (name === "startsAt" && current.packageId) {
                const pkg = packageById[current.packageId];

                if (pkg && value) {
                    next.expiresAt = addDaysToDateKey(value, pkg.durationDays);
                }
            }

            if (name === "totalSessions" && !current.remainingSessions) {
                next.remainingSessions = value;
            }

            return next;
        });
        setSubscriptionFormErrors((current) => ({
            ...current,
            [name]: undefined,
        }));
    }

    function openCreateSubscription() {
        if (!canManage) return;

        const today = getLocalTodayKey();
        setEditingSubscription(null);
        setSubscriptionFormData({
            ...scopedEmptySubscriptionForm,
            startsAt: today,
            expiresAt: addDaysToDateKey(today, 30),
        });
        setSubscriptionFormErrors({});
        setIsSubscriptionFormOpen(true);
    }

    function openEditSubscription(subscription) {
        if (!canManage) return;

        const venue = venues.find(
            (item) => item.name === subscription.poolName,
        );

        setEditingSubscription(subscription);
        setSubscriptionFormData({
            studentId: subscription.studentId,
            packageId: subscription.packageId ?? "",
            trainingVenueId:
                subscription.package?.defaultTrainingVenueId ?? venue?.id ?? "",
            packageName: subscription.packageName,
            program: subscription.program,
            price: String(subscription.price),
            startsAt: subscription.startsAt,
            expiresAt: subscription.expiresAt,
            totalSessions:
                subscription.totalSessions === null
                    ? ""
                    : String(subscription.totalSessions),
            remainingSessions:
                subscription.remainingSessions === null
                    ? ""
                    : String(subscription.remainingSessions),
            status: subscription.status,
            autoRenew: subscription.autoRenew,
            notes: subscription.notes ?? "",
        });
        setSubscriptionFormErrors({});
        setIsSubscriptionFormOpen(true);
    }

    function closeSubscriptionForm() {
        if (isSavingSubscription) return;
        setIsSubscriptionFormOpen(false);
        setEditingSubscription(null);
        setSubscriptionFormErrors({});
    }

    async function submitSubscriptionForm(event) {
        event.preventDefault();
        if (!canManage || isSavingSubscription) return;

        const parsed = subscriptionSchema.safeParse(subscriptionFormData);

        if (!parsed.success) {
            setSubscriptionFormErrors(getFinanceFieldErrors(parsed.error));
            return;
        }

        setIsSavingSubscription(true);

        try {
            if (editingSubscription) {
                const updated = await subscriptionApi.update(
                    editingSubscription.id,
                    parsed.data,
                );
                setSubscriptions((current) => upsertById(current, updated));
                toast.success("Langganan berhasil diperbarui.");
            } else {
                const created = await subscriptionApi.create(parsed.data);
                setSubscriptions((current) => upsertById(current, created));
                toast.success("Langganan manual berhasil ditambahkan.");
            }

            setIsSubscriptionFormOpen(false);
            setEditingSubscription(null);
            setSubscriptionFormData(scopedEmptySubscriptionForm);
            setSubscriptionFormErrors({});
        } catch (error) {
            setSubscriptionFormErrors(mapApiFieldErrors(error));
            toast.error(error?.message ?? "Gagal menyimpan langganan.");
        } finally {
            setIsSavingSubscription(false);
        }
    }

    function requestDelete(kind, item) {
        if (!canDelete) return;
        setDeleteTarget({ kind, item });
    }

    function cancelDelete() {
        if (!isDeleting) setDeleteTarget(null);
    }

    async function confirmDelete() {
        if (!canDelete || !deleteTarget || isDeleting) return;

        setIsDeleting(true);

        try {
            if (deleteTarget.kind === "subscription") {
                await subscriptionApi.remove(deleteTarget.item.id);
                setSubscriptions((current) =>
                    current.filter(
                        (subscription) =>
                            subscription.id !== deleteTarget.item.id,
                    ),
                );
                toast.success("Langganan berhasil dihapus.");
            } else {
                const result = await transactionApi.remove(
                    deleteTarget.item.id,
                );
                setTransactions((current) =>
                    current.filter(
                        (transaction) =>
                            transaction.id !== deleteTarget.item.id,
                    ),
                );
                applyTransactionResult(result);
                toast.success(
                    `Transaksi ${deleteTarget.item.invoiceNumber} berhasil dihapus.`,
                );
            }

            setDeleteTarget(null);
        } catch (error) {
            toast.error(error?.message ?? "Gagal menghapus data keuangan.");
        } finally {
            setIsDeleting(false);
        }
    }

    function remindSubscription(subscription) {
        const url = buildWhatsAppReminderUrl(subscription, reminderSettings);

        if (!url) {
            toast.error("Nomor WhatsApp orang tua/wali belum tersedia.");
            return;
        }

        window.open(url, "_blank", "noopener,noreferrer");
        toast.success("WhatsApp pengingat dibuka di tab baru.");
    }

    function printReceipt(transaction = receiptTransaction) {
        if (!transaction) return;

        const studentName = escapeHtml(transaction.student?.name ?? "-");
        const packageName = escapeHtml(
            transaction.package?.name ??
                transaction.subscription?.packageName ??
                transaction.description,
        );
        const html = `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>Kwitansi ${escapeHtml(transaction.invoiceNumber)}</title>
  <style>
    body{font-family:Arial,sans-serif;color:#0f172a;margin:0;padding:32px;background:#f8fafc}
    .card{max-width:720px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:20px;padding:32px}
    .brand{color:#0066CC;font-size:24px;font-weight:800;margin:0}
    .muted{color:#64748b;font-size:13px}.row{display:flex;justify-content:space-between;gap:24px;padding:11px 0;border-bottom:1px dashed #e2e8f0;font-size:14px}
    .total{font-size:24px;font-weight:800;color:#0066CC}.badge{display:inline-block;padding:5px 10px;border-radius:999px;background:#ecfdf5;color:#047857;font-weight:700;font-size:12px}
    @media print{body{background:#fff;padding:0}.card{border:none;box-shadow:none}}
  </style>
</head>
<body>
  <section class="card">
    <p class="brand">AAA Sport Academy</p>
    <p class="muted">Kwitansi pembayaran • ${escapeHtml(transaction.invoiceNumber)}</p>
    <div class="row"><span>Status</span><span class="badge">${escapeHtml(transaction.status)}</span></div>
    <div class="row"><span>Siswa</span><strong>${studentName}</strong></div>
    <div class="row"><span>Paket / Keterangan</span><strong>${packageName}</strong></div>
    <div class="row"><span>Program</span><strong>${escapeHtml(getProgramLabel(transaction.program))}</strong></div>
    <div class="row"><span>Tempat Latihan</span><strong>${escapeHtml(transaction.poolName || "-")}</strong></div>
    <div class="row"><span>Metode</span><strong>${escapeHtml(PAYMENT_METHOD_LABELS[transaction.paymentMethod] ?? transaction.paymentMethod)}</strong></div>
    <div class="row"><span>Referensi</span><strong>${escapeHtml(transaction.referenceNumber || "-")}</strong></div>
    <div class="row"><span>Tanggal</span><strong>${escapeHtml(formatDateKey(getTransactionDateKey(transaction), { weekday: "long", day: "numeric", month: "long", year: "numeric" }))}</strong></div>
    <div class="row"><span>Total Bayar</span><span class="total">${escapeHtml(formatCurrency(transaction.amount))}</span></div>
    <p class="muted">Terima kasih telah berlatih bersama AAA Sport Academy.</p>
  </section>
  <script>window.onload=function(){window.print();};</script>
</body>
</html>`;

        // window.open(..., 'noopener') selalu mengembalikan null walaupun
        // tab berhasil dibuka, sehingga null tidak bisa dipakai untuk
        // mendeteksi popup blocker. Buka tab kosong terlebih dahulu agar
        // kegagalan membuka tab dapat dideteksi, lalu putuskan opener
        // sebelum tab dinavigasikan ke dokumen blob.
        const printWindow = window.open("", "_blank");

        if (!printWindow) {
            toast.error(
                "Popup cetak diblokir browser. Izinkan popup lalu coba lagi.",
            );
            return;
        }

        const blob = new Blob([html], { type: "text/html" });
        const url = URL.createObjectURL(blob);

        printWindow.opener = null;
        printWindow.location.replace(url);

        window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    }

    function exportTransactionsCsv() {
        const rows = [
            [
                "Tanggal",
                "Invoice",
                "Siswa",
                "Keterangan",
                "Paket",
                "Program",
                "Tempat Latihan",
                "Jenis",
                "Metode",
                "Status",
                "Referensi",
                "Nominal",
            ],
            ...report.transactions.map((transaction) => [
                getTransactionDateKey(transaction),
                transaction.invoiceNumber,
                transaction.student?.name ?? "Siswa Terhapus",
                transaction.description,
                transaction.package?.name ??
                    transaction.subscription?.packageName ??
                    "",
                getProgramLabel(transaction.program),
                transaction.poolName,
                TRANSACTION_TYPE_LABELS[transaction.type] ?? transaction.type,
                PAYMENT_METHOD_LABELS[transaction.paymentMethod] ??
                    transaction.paymentMethod,
                transaction.status,
                transaction.referenceNumber,
                transaction.amount,
            ]),
        ];

        const csv = rows
            .map((row) => row.map(escapeCsvCell).join(","))
            .join("\n");
        const blob = new Blob([`\ufeff${csv}`], {
            type: "text/csv;charset=utf-8",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `laporan-finance-${reportPeriod.toLowerCase()}-${todayKey || getLocalTodayKey()}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        toast.success("Laporan transaksi berhasil diexport ke CSV.");
    }

    const selectedPaymentPackage =
        packageById[paymentFormData.packageId] ?? null;
    const selectedPaymentStudent =
        studentById[paymentFormData.studentId] ?? null;
    const selectedSubscriptionPackage =
        packageById[subscriptionFormData.packageId] ?? null;

    return {
        canManage,
        canDelete,
        programScope,
        programOptions,
        subscriptionProgramOptions,
        todayKey,
        activeTab,
        changeTab,
        packages,
        activePackages,
        subscriptions: enrichedSubscriptions,
        transactions,
        students: studentOptions,
        venues,
        studentById,
        packageById,
        venueById,

        transactionSearch,
        transactionPeriod,
        transactionStatusFilter,
        transactionMethodFilter,
        transactionProgramFilter,
        transactionVenueFilter,
        transactionVenueOptions,
        filteredTransactions,
        transactionStats,
        onTransactionSearchChange: setTransactionSearch,
        onTransactionPeriodChange: setTransactionPeriod,
        onTransactionStatusFilterChange: setTransactionStatusFilter,
        onTransactionMethodFilterChange: setTransactionMethodFilter,
        onTransactionProgramFilterChange: setTransactionProgramFilter,
        onTransactionVenueFilterChange: setTransactionVenueFilter,

        subscriptionSearch,
        subscriptionDueFilter,
        subscriptionProgramFilter,
        filteredSubscriptions,
        subscriptionStats,
        onSubscriptionSearchChange: setSubscriptionSearch,
        onSubscriptionDueFilterChange: setSubscriptionDueFilter,
        onSubscriptionProgramFilterChange: setSubscriptionProgramFilter,

        reportPeriod,
        report,
        onReportPeriodChange: setReportPeriod,
        exportTransactionsCsv,

        isPaymentFormOpen,
        editingTransaction,
        paymentFormData,
        paymentFormErrors,
        isSavingPayment,
        markingPaidId,
        receiptTransaction,
        selectedPaymentPackage,
        selectedPaymentStudent,
        openCreatePayment,
        openSubscriptionPayment,
        openEditTransaction,
        closePaymentForm,
        updatePaymentField,
        submitPaymentForm,
        markTransactionPaid,
        setReceiptTransaction,
        closeReceipt: () => setReceiptTransaction(null),
        printReceipt,

        isSubscriptionFormOpen,
        editingSubscription,
        subscriptionFormData,
        subscriptionFormErrors,
        isSavingSubscription,
        selectedSubscriptionPackage,
        openCreateSubscription,
        openEditSubscription,
        closeSubscriptionForm,
        updateSubscriptionField,
        submitSubscriptionForm,

        deleteTarget,
        isDeleting,
        requestDelete,
        cancelDelete,
        confirmDelete,
        remindSubscription,
    };
}
