import { SubscriptionBanner } from "./SubscriptionBanner";
import { AppLayout } from "./AppLayout";

export function BrokerLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppLayout>
      <SubscriptionBanner />
      {children}
    </AppLayout>
  );
}
