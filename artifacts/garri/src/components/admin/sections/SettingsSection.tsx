import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ShieldAlert, ShieldCheck, UserMinus } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@workspace/api-client-react";
import { getSettings, updateSettings } from "@/lib/settings/api";
import { getAdmins, demoteToCustomer } from "@/lib/customers/api";
import { cn } from "@/lib/utils";

export function SettingsSection() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["platform-settings"],
    queryFn: getSettings,
  });

  const { data: admins, isLoading: adminsLoading } = useQuery({
    queryKey: ["admins-list"],
    queryFn: getAdmins,
  });

  const maintenanceMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: (updated) => {
      queryClient.setQueryData(["platform-settings"], updated);
      toast.success(
        updated.maintenanceMode
          ? "Maintenance mode enabled — customers will see a maintenance notice."
          : "Maintenance mode disabled — RawAfri is live again.",
      );
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "Couldn't update settings");
    },
  });

  const demoteMutation = useMutation({
    mutationFn: demoteToCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins-list"] });
      toast.success("Admin demoted to customer");
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "Couldn't demote this admin");
    },
  });

  const isOn = settings?.maintenanceMode ?? false;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Settings</h2>
        <p className="text-sm text-slate-500">Platform-wide controls</p>
      </div>

      {settingsLoading ? (
        <div className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
      ) : (
        <div
          className={cn(
            "rounded-2xl border p-5 flex items-start gap-4",
            isOn ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-white",
          )}
        >
          <div
            className={cn(
              "size-10 rounded-xl flex items-center justify-center flex-shrink-0",
              isOn ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-500",
            )}
          >
            {isOn ? <ShieldAlert className="size-5" /> : <AlertTriangle className="size-5" />}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-800">Maintenance Mode</p>
            <p className="text-xs text-slate-500 mt-0.5">
              When on, customers (including logged-out visitors) are blocked from browsing or
              checking out — they'll see a maintenance notice instead. Admins can still log in
              and manage the platform normally.
            </p>
            {isOn && (
              <p className="text-xs font-semibold text-amber-700 mt-2">
                RawAfri is currently down for customers.
              </p>
            )}
          </div>
          <button
            onClick={() => maintenanceMutation.mutate(!isOn)}
            disabled={maintenanceMutation.isPending}
            role="switch"
            aria-checked={isOn}
            className={cn(
              "relative w-11 h-6 rounded-full flex-shrink-0 transition-colors disabled:opacity-50",
              isOn ? "bg-amber-500" : "bg-slate-300",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 size-5 rounded-full bg-white transition-transform",
                isOn ? "translate-x-[22px]" : "translate-x-0.5",
              )}
            />
          </button>
        </div>
      )}

      <div>
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="size-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-800">Admin accounts</h3>
        </div>

        {adminsLoading && <p className="text-sm text-slate-400">Loading admins...</p>}

        {!adminsLoading && admins && (
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {admins.map((admin) => (
              <div key={admin.id} className="p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {admin.firstName} {admin.lastName}
                  </p>
                  <p className="text-xs text-slate-500">{admin.email}</p>
                </div>
                <button
                  onClick={() => {
                    if (
                      confirm(
                        `Demote ${admin.firstName} ${admin.lastName}? They will lose admin access and become a regular customer.`,
                      )
                    ) {
                      demoteMutation.mutate(admin.id);
                    }
                  }}
                  disabled={demoteMutation.isPending || admins.length <= 1}
                  title={admins.length <= 1 ? "Can't demote the last remaining admin" : undefined}
                  className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:pointer-events-none"
                >
                  <UserMinus className="size-3.5" />
                  Demote
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}