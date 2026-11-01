"use client";

import useFinanceManager from "@/hooks/useFinanceManager";
import { PROGRAM_CONFIG } from "@/lib/operational/constants";
import {
    FinanceDeleteModal,
    PaymentFormModal,
    ReceiptModal,
    SubscriptionFormModal,
} from "./FinanceModals";
import {
    ReportsSection,
    SubscriptionsSection,
    TransactionsSection,
} from "./FinanceSections";
import { FinanceHeader, FinanceReadOnlyNotice, FinanceTabs } from "./FinanceUI";

export default function FinanceManager({
    packageOptions = [],
    initialSubscriptions = [],
    initialTransactions = [],
    students = [],
    venues = [],
    canManage = false,
    canDelete = false,
    programScope = null,
    initialTab = "transactions",
    initialSearch = "",
    initialSearchTarget = "transactions",
    reminderSettings = null,
}) {
    const finance = useFinanceManager({
        packageOptions,
        initialSubscriptions,
        initialTransactions,
        students,
        venues,
        canManage,
        canDelete,
        programScope,
        initialTab,
        initialSearch,
        initialSearchTarget,
        reminderSettings,
    });

    return (
        <div className="space-y-6">
            <FinanceHeader
                canManage={finance.canManage}
                onCreatePayment={finance.openCreatePayment}
            />

            {!finance.canManage ? <FinanceReadOnlyNotice /> : null}

            {programScope ? (
                <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-relaxed text-slate-600">
                    Menampilkan Finance program{" "}
                    <strong className="text-slate-900">
                        {PROGRAM_CONFIG[programScope].title}
                    </strong>
                    . Transaksi, langganan, dan laporan Private hanya mencakup
                    siswa pada program ini.
                </div>
            ) : null}

            <FinanceTabs
                activeTab={finance.activeTab}
                onChange={finance.changeTab}
                counts={{
                    transactions: finance.transactions.length,
                    subscriptions: finance.subscriptions.length,
                    reports: finance.report.paidCount,
                }}
            />

            {finance.activeTab === "transactions" ? (
                <TransactionsSection finance={finance} />
            ) : null}

            {finance.activeTab === "subscriptions" ? (
                <SubscriptionsSection finance={finance} />
            ) : null}

            {finance.activeTab === "reports" ? (
                <ReportsSection finance={finance} />
            ) : null}

            <PaymentFormModal finance={finance} />
            <SubscriptionFormModal finance={finance} />
            <ReceiptModal finance={finance} />
            <FinanceDeleteModal finance={finance} />
        </div>
    );
}
