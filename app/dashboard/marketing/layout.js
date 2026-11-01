import { Suspense } from "react";
import { requireFeatureAccess } from "@/lib/auth/authService";

// Guard role Marketing diletakkan pada layout segment ini, lalu setiap
// halaman Server Component membaca data Package/Promotion/Article/Lead
// langsung dari database dan meneruskannya ke manager client masing-masing.
async function MarketingGuard({ children }) {
    await requireFeatureAccess("marketing", "/dashboard/marketing/campaign");
    return children;
}

function MarketingFallback() {
    return (
        <div className="space-y-4" aria-busy="true">
            <div className="h-8 w-56 animate-pulse rounded-xl bg-slate-200/70" />
            <div className="h-64 animate-pulse rounded-3xl bg-slate-200/60" />
        </div>
    );
}

export default function MarketingLayout({ children }) {
    return (
        <Suspense fallback={<MarketingFallback />}>
            <MarketingGuard>{children}</MarketingGuard>
        </Suspense>
    );
}
