import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, ShoppingCart, CreditCard, Info, CheckCheck, MessageSquareWarning, X, Send } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@workspace/api-client-react";
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getAllComplaintsAdmin,
  updateComplaintAdmin,
} from "@/lib/notifications/api";
import type { AdminComplaint, AdminNotification, ComplaintStatus, NotificationType } from "@/lib/notifications/types";

function apiErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

const notificationIcon: Record<NotificationType, React.ReactNode> = {
  ORDER_STATUS: <ShoppingCart className="w-4 h-4" />,
  PAYMENT: <CreditCard className="w-4 h-4" />,
  SYSTEM: <Info className="w-4 h-4" />,
};

const notificationColor: Record<NotificationType, string> = {
  ORDER_STATUS: "bg-blue-50 text-blue-600",
  PAYMENT: "bg-amber-50 text-amber-600",
  SYSTEM: "bg-slate-100 text-slate-500",
};

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min${mins !== 1 ? "s" : ""} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days !== 1 ? "s" : ""} ago`;
}

const complaintStatusBadge: Record<ComplaintStatus, string> = {
  OPEN: "bg-red-50 text-red-600",
  IN_PROGRESS: "bg-amber-50 text-amber-700",
  RESOLVED: "bg-green-50 text-green-700",
  CLOSED: "bg-slate-100 text-slate-500",
};

export function NotificationsSection() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"notifications" | "complaints">("notifications");
  const [respondTarget, setRespondTarget] = useState<AdminComplaint | null>(null);
  const [responseText, setResponseText] = useState("");

  const { data: notifications, isLoading: notifLoading, isError: notifError } = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: getMyNotifications,
  });

  const { data: complaints, isLoading: complaintsLoading, isError: complaintsError } = useQuery({
    queryKey: ["admin-complaints"],
    queryFn: getAllComplaintsAdmin,
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-notifications"] }),
    onError: (error) => toast.error(apiErrorMessage(error, "Couldn't mark as read")),
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      toast.success("All notifications marked as read");
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Couldn't mark all as read")),
  });

  const updateComplaintMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { status?: ComplaintStatus; adminResponse?: string } }) =>
      updateComplaintAdmin(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-complaints"] });
      toast.success("Complaint updated");
      setRespondTarget(null);
      setResponseText("");
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Couldn't update this complaint")),
  });

  const notificationList = notifications ?? [];
  const complaintList = complaints ?? [];
  const unreadCount = notificationList.filter((n) => !n.isRead).length;
  const openComplaints = complaintList.filter((c) => c.status === "OPEN").length;

  return (
    <div className="space-y-4">
      {/* Respond modal */}
      {respondTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4" onClick={() => setRespondTarget(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Respond to Complaint</h3>
              <button onClick={() => setRespondTarget(null)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 space-y-1">
              <p className="text-sm font-semibold text-slate-800">{respondTarget.subject}</p>
              <p className="text-xs text-slate-500">{respondTarget.customer?.firstName} {respondTarget.customer?.lastName}{respondTarget.order ? ` · ${respondTarget.order.orderNumber}` : ""}</p>
              <p className="text-xs text-slate-600 mt-2">{respondTarget.message}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Your response</label>
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                rows={3}
                placeholder="Let the customer know how this was resolved..."
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500/20 resize-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Mark as</label>
              <div className="flex gap-2 flex-wrap">
                {(["IN_PROGRESS", "RESOLVED", "CLOSED"] as ComplaintStatus[]).map((s) => (
                  <button
                    key={s}
                    onClick={() =>
                      updateComplaintMutation.mutate({
                        id: respondTarget.id,
                        payload: { status: s, ...(responseText.trim() ? { adminResponse: responseText.trim() } : {}) },
                      })
                    }
                    disabled={updateComplaintMutation.isPending}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${complaintStatusBadge[s]}`}
                  >
                    {s.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => setTab("notifications")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
            tab === "notifications" ? "bg-green-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
          }`}
        >
          <Bell className="w-3.5 h-3.5" /> Notifications
          {unreadCount > 0 && <span className={`text-[10px] font-bold px-1.5 rounded-full ${tab === "notifications" ? "bg-white/20" : "bg-red-500 text-white"}`}>{unreadCount}</span>}
        </button>
        <button
          onClick={() => setTab("complaints")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
            tab === "complaints" ? "bg-green-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
          }`}
        >
          <MessageSquareWarning className="w-3.5 h-3.5" /> Complaints
          {openComplaints > 0 && <span className={`text-[10px] font-bold px-1.5 rounded-full ${tab === "complaints" ? "bg-white/20" : "bg-red-500 text-white"}`}>{openComplaints}</span>}
        </button>
      </div>

      {tab === "notifications" && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="text-slate-900 font-semibold text-sm">System Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
                className="flex items-center gap-1.5 text-xs font-medium text-green-600 hover:text-green-700 transition disabled:opacity-50"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>
          <div className="divide-y divide-slate-50">
            {notifLoading && <p className="text-center py-12 text-slate-400 text-sm">Loading notifications...</p>}
            {notifError && <p className="text-center py-12 text-red-400 text-sm">Couldn't load notifications.</p>}
            {!notifLoading && !notifError && notificationList.length === 0 && (
              <p className="text-center py-12 text-slate-400 text-sm">No notifications yet — you'll see new orders and payments here as they come in.</p>
            )}
            {notificationList.map((n: AdminNotification) => (
              <button
                key={n.id}
                onClick={() => !n.isRead && markReadMutation.mutate(n.id)}
                className={`w-full flex items-start gap-3 px-5 py-3.5 text-left hover:bg-slate-50 transition-colors ${!n.isRead ? "bg-green-50/40" : ""}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${notificationColor[n.type]}`}>
                  {notificationIcon[n.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm ${!n.isRead ? "font-semibold text-slate-900" : "text-slate-700"}`}>{n.title}</p>
                    {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === "complaints" && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-slate-900 font-semibold text-sm">Customer Complaints</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {complaintsLoading && <p className="text-center py-12 text-slate-400 text-sm">Loading complaints...</p>}
            {complaintsError && <p className="text-center py-12 text-red-400 text-sm">Couldn't load complaints.</p>}
            {!complaintsLoading && !complaintsError && complaintList.length === 0 && (
              <p className="text-center py-12 text-slate-400 text-sm">No complaints filed yet.</p>
            )}
            {complaintList.map((c) => (
              <div key={c.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800">{c.subject}</p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${complaintStatusBadge[c.status]}`}>
                        {c.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {c.customer?.firstName} {c.customer?.lastName}{c.order ? ` · ${c.order.orderNumber}` : ""} · {timeAgo(c.createdAt)}
                    </p>
                    <p className="text-sm text-slate-600 mt-2">{c.message}</p>
                    {c.adminResponse && (
                      <div className="mt-2 bg-green-50 rounded-lg px-3 py-2">
                        <p className="text-[11px] font-semibold text-green-700">Your response</p>
                        <p className="text-xs text-green-800 mt-0.5">{c.adminResponse}</p>
                      </div>
                    )}
                  </div>
                  {c.status !== "RESOLVED" && c.status !== "CLOSED" && (
                    <button
                      onClick={() => { setRespondTarget(c); setResponseText(c.adminResponse ?? ""); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors shrink-0"
                    >
                      <Send className="w-3.5 h-3.5 text-green-600" /> Respond
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}