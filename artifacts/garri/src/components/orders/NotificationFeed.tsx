import { type Notification } from "@/lib/order-data";
import { Panel } from "@/components/storefront/ui";
import { cn } from "@/lib/utils";

/** The order's real status history, newest first. */
export function NotificationFeed({ notifications }: { notifications: Notification[] }) {
  if (notifications.length === 0) return null;

  return (
    <Panel>
      <div className="border-b border-border px-5 py-4">
        <h2 className="font-display text-lg text-foreground">History</h2>
      </div>
      <ol className="px-5 py-4">
        {[...notifications].reverse().map((n, i) => (
          <li key={n.id} className="relative flex gap-3 pb-4 last:pb-0">
            <span
              className={cn(
                "mt-1.5 size-2 shrink-0 rounded-full",
                i === 0 ? "bg-terracotta" : n.type === "warning" ? "bg-destructive" : "bg-border",
              )}
            />
            <div className="min-w-0 flex-1">
              <p className={cn("text-sm", i === 0 ? "font-semibold text-foreground" : "text-muted-foreground")}>{n.message}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{n.time}</p>
            </div>
          </li>
        ))}
      </ol>
    </Panel>
  );
}
