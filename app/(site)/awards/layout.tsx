import { LiveTickerSlot } from "@/components/live/LiveTickerSlot";

export default function AwardsLayout({ children }: LayoutProps<"/awards">) {
  return (
    <>
      <LiveTickerSlot />
      {children}
    </>
  );
}
