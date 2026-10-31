'use client';

import useFinanceManager from '@/hooks/useFinanceManager';
import {
  FinanceDeleteModal,
  PackageFormModal,
  PaymentFormModal,
  ReceiptModal,
  SubscriptionFormModal,
} from './FinanceModals';
import {
  PackagesSubscriptionsSection,
  ReportsSection,
  TransactionsSection,
} from './FinanceSections';
import {
  FinanceHeader,
  FinanceReadOnlyNotice,
  FinanceTabs,
} from './FinanceUI';

export default function FinanceManager({
  initialPackages = [],
  initialSubscriptions = [],
  initialTransactions = [],
  students = [],
  venues = [],
  canManage = false,
  canDelete = false,
  initialTab = 'transactions',
}) {
  const finance = useFinanceManager({
    initialPackages,
    initialSubscriptions,
    initialTransactions,
    students,
    venues,
    canManage,
    canDelete,
    initialTab,
  });

  return (
    <div className="space-y-6">
      <FinanceHeader
        canManage={finance.canManage}
        onCreatePayment={finance.openCreatePayment}
      />

      {!finance.canManage ? <FinanceReadOnlyNotice /> : null}

      <FinanceTabs
        activeTab={finance.activeTab}
        onChange={finance.changeTab}
        counts={{
          transactions: finance.transactions.length,
          subscriptions: finance.subscriptions.length,
          reports: finance.report.paidCount,
        }}
      />

      {finance.activeTab === 'transactions' ? (
        <TransactionsSection finance={finance} />
      ) : null}

      {finance.activeTab === 'subscriptions' ? (
        <PackagesSubscriptionsSection finance={finance} />
      ) : null}

      {finance.activeTab === 'reports' ? (
        <ReportsSection finance={finance} />
      ) : null}

      <PackageFormModal finance={finance} />
      <PaymentFormModal finance={finance} />
      <SubscriptionFormModal finance={finance} />
      <ReceiptModal finance={finance} />
      <FinanceDeleteModal finance={finance} />
    </div>
  );
}
