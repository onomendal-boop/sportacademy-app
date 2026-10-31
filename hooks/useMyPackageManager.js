'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { renewalApi } from '@/lib/finance/financeClient';
import {
  differenceInDays,
  getLocalTodayKey,
} from '@/lib/finance/financeUtils';

// State halaman Paket Saya (siswa): langganan milik sendiri, katalog
// paket, dan pengajuan perpanjangan (transaksi PENDING untuk admin).

export default function useMyPackageManager({
  initialSubscriptions = [],
  initialTransactions = [],
  packages = [],
} = {}) {
  const [subscriptions, setSubscriptions] = useState(initialSubscriptions);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('TRANSFER');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeSubscription = useMemo(() => {
    const actives = subscriptions
      .filter((subscription) => subscription.status === 'ACTIVE')
      .sort((a, b) => String(b.expiresAt).localeCompare(String(a.expiresAt)));
    return actives[0] ?? null;
  }, [subscriptions]);

  const pendingRequest = useMemo(
    () =>
      transactions.find(
        (transaction) =>
          transaction.type === 'SUBSCRIPTION_PAYMENT' &&
          transaction.status === 'PENDING'
      ) ?? null,
    [transactions]
  );

  const activeDaysLeft = activeSubscription
    ? differenceInDays(getLocalTodayKey(), activeSubscription.expiresAt)
    : null;

  function openRenewal(pkg) {
    if (pendingRequest) {
      toast.error(
        `Pengajuan ${pendingRequest.invoiceNumber} masih menunggu konfirmasi admin.`
      );
      return;
    }
    setSelectedPackage(pkg);
    setPaymentMethod('TRANSFER');
  }

  function closeRenewal() {
    if (isSubmitting) return;
    setSelectedPackage(null);
  }

  async function submitRenewal(event) {
    event.preventDefault();
    if (!selectedPackage || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const result = await renewalApi.create({
        packageId: selectedPackage.id,
        paymentMethod,
      });

      if (result?.transaction) {
        setTransactions((current) => [result.transaction, ...current]);
      }

      if (result?.subscription) {
        setSubscriptions((current) => {
          const exists = current.some(
            (subscription) => subscription.id === result.subscription.id
          );
          return exists
            ? current.map((subscription) =>
                subscription.id === result.subscription.id
                  ? result.subscription
                  : subscription
              )
            : [result.subscription, ...current];
        });
      }

      toast.success(
        `Pengajuan perpanjangan ${result?.transaction?.invoiceNumber ?? ''} terkirim. Selesaikan pembayaran, admin akan mengonfirmasi dan paket Anda langsung diperpanjang.`
      );
      setSelectedPackage(null);
    } catch (error) {
      toast.error(error?.message ?? 'Gagal mengajukan perpanjangan paket.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    packages,
    subscriptions,
    transactions,
    activeSubscription,
    activeDaysLeft,
    pendingRequest,
    selectedPackage,
    paymentMethod,
    isSubmitting,
    onPaymentMethodChange: setPaymentMethod,
    onOpenRenewal: openRenewal,
    onCloseRenewal: closeRenewal,
    onSubmitRenewal: submitRenewal,
  };
}
