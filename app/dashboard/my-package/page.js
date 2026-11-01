import { Suspense } from "react";
import FinanceSkeleton from "@/components/finance/FinanceSkeleton";
import MyPackageManager from "@/components/finance/MyPackageManager";
import { requireFeatureAccess } from "@/lib/auth/authService";
import { getMyStudentProfile } from "@/lib/auth/profileService";
import { getPackages } from "@/lib/finance/packageService";
import { getSubscriptionsByStudentId } from "@/lib/finance/subscriptionService";
import { getTransactionsByStudentId } from "@/lib/finance/transactionService";

export const metadata = {
    title: "Paket Saya | AAA Sport Academy",
    description:
        "Lihat langganan aktif dan ajukan perpanjangan paket latihan AAA Sport Academy.",
};

async function MyPackageContent() {
    const user = await requireFeatureAccess(
        "myPackage",
        "/dashboard/my-package",
    );
    const profile = await getMyStudentProfile(user.id);

    if (!profile) {
        return <MyPackageManager profile={null} />;
    }

    const [packages, subscriptions, transactions] = await Promise.all([
        getPackages(),
        getSubscriptionsByStudentId(profile.id, user),
        getTransactionsByStudentId(profile.id, user),
    ]);

    return (
        <MyPackageManager
            profile={profile}
            initialSubscriptions={subscriptions}
            initialTransactions={transactions}
            packages={packages.filter((pkg) => pkg.isActive)}
        />
    );
}

export default function MyPackagePage() {
    return (
        <Suspense fallback={<FinanceSkeleton />}>
            <MyPackageContent />
        </Suspense>
    );
}
