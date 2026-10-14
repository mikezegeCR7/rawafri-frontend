import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/AuthContext";
import { updateMeRequest } from "@/lib/auth/api";
import { apiErrorMessage } from "@/lib/api/errors";
import { PageHeading, Panel, btn, initials, inputClass } from "@/components/storefront/ui";
import { cn } from "@/lib/utils";

export function ProfileSection() {
  const { user, refreshUser } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");

  const mutation = useMutation({
    mutationFn: updateMeRequest,
    onSuccess: async () => {
      await refreshUser();
      toast.success("Profile updated");
    },
    onError: (err) => toast.error(apiErrorMessage(err, "Couldn't update your profile")),
  });

  const isDirty =
    firstName !== (user?.firstName ?? "") || lastName !== (user?.lastName ?? "") || phone !== (user?.phone ?? "");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("First and last name can't be empty");
      return;
    }
    const payload: { firstName?: string; lastName?: string; phone?: string } = {};
    if (firstName !== user?.firstName) payload.firstName = firstName.trim();
    if (lastName !== user?.lastName) payload.lastName = lastName.trim();
    if (phone !== user?.phone) payload.phone = phone.trim();
    mutation.mutate(payload);
  };

  if (!user) return null;

  const memberSince = new Date(user.createdAt).toLocaleDateString("en-NG", { month: "long", year: "numeric" });

  return (
    <div className="space-y-8">
      <PageHeading title="Profile" description="Your personal details." />

      <div className="flex items-center gap-4">
        <span className="grid size-16 place-items-center rounded-full bg-cocoa font-display text-2xl text-background">
          {initials(user.firstName, user.lastName)}
        </span>
        <div>
          <p className="font-bold text-foreground">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-sm text-muted-foreground">Customer since {memberSince}</p>
        </div>
      </div>

      <Panel className="max-w-2xl p-5 sm:p-6">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="pf-first" className="mb-1.5 block text-[13px] font-semibold text-foreground">First name</label>
              <input id="pf-first" value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" className={inputClass} />
            </div>
            <div>
              <label htmlFor="pf-last" className="mb-1.5 block text-[13px] font-semibold text-foreground">Last name</label>
              <input id="pf-last" value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" className={inputClass} />
            </div>
          </div>
          <div>
            <label htmlFor="pf-phone" className="mb-1.5 block text-[13px] font-semibold text-foreground">Phone number</label>
            <input id="pf-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" className={inputClass} />
          </div>
          <div>
            <label htmlFor="pf-email" className="mb-1.5 block text-[13px] font-semibold text-foreground">Email address</label>
            <input id="pf-email" value={user.email} disabled className={cn(inputClass, "cursor-not-allowed bg-muted text-muted-foreground")} />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Your email is used to sign in and can't be changed here. Contact support if you need to update it.
            </p>
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" disabled={!isDirty || mutation.isPending} className={btn.primary}>
              {mutation.isPending ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </Panel>
    </div>
  );
}
