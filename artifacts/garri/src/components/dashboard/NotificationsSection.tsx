import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Package, CreditCard, Info, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { getMyNotifications, markNotificationRead, markAllNotificationsRead } from "@/lib/notifications/api";
import type { AdminNotification, NotificationType } from "@/lib/notifications/types";
import { apiErrorMessage } from "@/lib/api/errors";
import { EmptyState, PageHeading, Panel, btn } from "@/components/storefront/ui";
import { cn } from "@/lib/utils";

const TYPE_ICON: Record<NotificationType, typeof Package> = {
  ORDER_STATUS: Package,
  PAYMENT: CreditCard,
  SYSTEM: Info,
};

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString("en-NG", { dateStyle: "medium" });
}

export function NotificationsSection() {
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const { data: notifications, isLoading } = useQuery({ queryKey: ["my-notifications"], queryFn: getMyNotifications });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["my-notifications"] });
    queryClient.invalidateQueries({ queryKey: ["unread-notification-count"] });
  };

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: invalidate,
    onError: (err) => toast.error(apiErrorMessage(err, "Couldn't update notification")),
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      invalidate();
      toast.success("All notifications marked as read");
    },
    onError: (err) => toast.error(apiErrorMessage(err, "Couldn't mark all as read")),
  });

  const handleClick = (n: AdminNotification) => {
    if (!n.isRead) markReadMutation.mutate(n.id);
    if (n.orderId) navigate(`/orders/${n.orderId}`);
  };

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  return (
    <div className="space-y-8">
      <PageHeading
        title="Notifications"
        description={unreadCount > 0 ? `${unreadCount} unread` : "Updates about your orders and payments."}
        action={
          unreadCount > 0 && (
            <button
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className={cn(btn.secondary, btn.sm)}
            >
              <CheckCheck className="size-4" /> Mark all as read
            </button>
          )
        }
      />

      {isLoading ? (
        <Panel className="h-48 animate-pulse" />
      ) : !notifications || notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications yet" description="Order and payment updates will show up here." />
      ) : (
        <Panel className="divide-y divide-border">
          {notifications.map((n) => {
            const Icon = TYPE_ICON[n.type];
            return (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={cn(
                  "flex w-full items-start gap-4 px-4 py-4 text-left transition-colors hover:bg-accent/60 sm:px-5",
                  !n.isRead && "bg-brand-muted/40",
                )}
              >
                <div
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-full",
                    n.isRead ? "bg-secondary text-muted-foreground" : "bg-brand text-brand-foreground",
                  )}
                >
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className={cn("text-sm text-foreground", n.isRead ? "font-medium" : "font-bold")}>{n.title}</p>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{timeAgo(n.createdAt)}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
                </div>
                {!n.isRead && <span className="mt-2 size-2 shrink-0 rounded-full bg-terracotta" aria-label="Unread" />}
              </button>
            );
          })}
        </Panel>
      )}
    </div>
  );
}
