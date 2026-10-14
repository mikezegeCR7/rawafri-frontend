import { useParams } from "wouter";
import { AccountLayout, ACCOUNT_NAV, type AccountNavKey } from "@/components/account/AccountLayout";
import { OverviewSection } from "@/components/dashboard/OverviewSection";
import { CartSection } from "@/components/dashboard/CartSection";
import { AddressesSection } from "@/components/dashboard/AddressesSection";
import { PaymentsSection } from "@/components/dashboard/PaymentsSection";
import { NotificationsSection } from "@/components/dashboard/NotificationsSection";
import { RecommendedSection } from "@/components/dashboard/RecommendedSection";
import { RecentlyViewedSection } from "@/components/dashboard/RecentlyViewedSection";
import { WishlistSection } from "@/components/dashboard/WishlistSection";
import { ProfileSection } from "@/components/dashboard/ProfileSection";

function SectionContent({ section }: { section: AccountNavKey }) {
  switch (section) {
    case "cart":          return <CartSection />;
    case "addresses":     return <AddressesSection />;
    case "payments":      return <PaymentsSection />;
    case "notifications": return <NotificationsSection />;
    case "recommended":   return <RecommendedSection />;
    case "recent":        return <RecentlyViewedSection />;
    case "wishlist":      return <WishlistSection />;
    case "profile":       return <ProfileSection />;
    default:              return <OverviewSection />;
  }
}

export default function Dashboard() {
  const params = useParams<{ section?: string }>();
  // Orders lives at its own URL (/orders); anything unknown falls back to the overview.
  const known = ACCOUNT_NAV.some((i) => i.key === params.section && i.key !== "orders");
  const active: AccountNavKey = known ? (params.section as AccountNavKey) : "overview";

  return (
    <AccountLayout active={active}>
      <div key={active}>
        <SectionContent section={active} />
      </div>
    </AccountLayout>
  );
}
