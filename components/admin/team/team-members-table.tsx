"use client";

import { useState, useTransition } from "react";
import { updateMemberRoleAction, removeMemberAction } from "@/actions/team";
import { Button } from "@/components/ui/button";
import { Dictionary } from "@/lib/i18n";
import { getFileUrl } from "@/lib/pocketbase";
import { Crown, Edit3, Eye, Trash2, Loader2, AlertCircle, Shield } from "lucide-react";

export interface TeamMemberItem {
  id: string; // teamMembers record id
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  role: "OWNER" | "EDITOR" | "VIEWER";
  isOwner: boolean;
}

interface TeamMembersTableProps {
  brandId: string;
  members: TeamMemberItem[];
  currentUserId: string;
  isCurrentUserOwner: boolean;
  dict: Dictionary;
}

export function TeamMembersTable({
  members,
  currentUserId,
  isCurrentUserOwner,
  dict,
}: TeamMembersTableProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleRoleChange = (memberId: string, newRole: "EDITOR" | "VIEWER") => {
    setError(null);
    startTransition(async () => {
      const res = await updateMemberRoleAction(memberId, newRole);
      if (!res.success) {
        setError(res.error || "Failed to update role");
      }
    });
  };

  const handleRemoveMember = (memberId: string) => {
    setError(null);
    startTransition(async () => {
      const res = await removeMemberAction(memberId);
      if (!res.success) {
        setError(res.error || "Failed to remove member");
      }
      setConfirmDeleteId(null);
    });
  };

  return (
    <div className="border border-border/40 rounded-[3px] bg-card p-6 shadow-xs space-y-4">
      <div className="border-b border-border/30 pb-3 flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        <div className="w-1/2">{dict.admin.memberCol}</div>
        <div className="w-1/4">{dict.admin.roleCol}</div>
        <div className="w-1/4 text-right">{dict.admin.actionsCol}</div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 text-xs bg-red-950/40 border border-red-500/40 text-red-400 rounded-[3px]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="divide-y divide-border/20">
        {members.map((member) => {
          const isSelf = member.userId === currentUserId;
          const avatarUrl = member.avatar
            ? getFileUrl("users", member.userId, member.avatar)
            : null;

          return (
            <div
              key={member.id}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs"
            >
              {/* Member details */}
              <div className="flex items-center gap-3 w-full sm:w-1/2">
                <div className="h-9 w-9 rounded-[3px] bg-neutral-900 border border-border/60 overflow-hidden flex items-center justify-center font-bold text-xs shrink-0">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={member.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>
                      {member.name ? member.name.slice(0, 2).toUpperCase() : member.email.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="font-semibold text-foreground truncate">
                      {member.name || member.email}
                    </p>
                    {isSelf && (
                      <span className="px-1.5 py-0.2 rounded-[3px] bg-neutral-800 text-neutral-300 text-[10px] font-mono">
                        {dict.admin.youBadge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">{member.email}</p>
                </div>
              </div>

              {/* Role badge / selector */}
              <div className="w-full sm:w-1/4">
                {member.isOwner ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[3px] text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    <Crown className="h-3 w-3" />
                    <span>OWNER</span>
                  </span>
                ) : isCurrentUserOwner && !member.isOwner ? (
                  <select
                    value={member.role}
                    disabled={isPending}
                    onChange={(e) => handleRoleChange(member.id, e.target.value as "EDITOR" | "VIEWER")}
                    className="h-7 px-2 text-xs bg-background/50 border border-border/60 rounded-[3px] text-foreground focus:outline-hidden focus:ring-1 focus:ring-[#c8d400] cursor-pointer"
                  >
                    <option value="EDITOR">EDITOR</option>
                    <option value="VIEWER">VIEWER</option>
                  </select>
                ) : (
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[3px] text-[11px] font-semibold border ${
                      member.role === "EDITOR"
                        ? "bg-[#009f80]/15 text-[#009f80] border-[#009f80]/30"
                        : "bg-neutral-800 text-neutral-400 border-neutral-700"
                    }`}
                  >
                    {member.role === "EDITOR" ? (
                      <Edit3 className="h-3 w-3" />
                    ) : (
                      <Eye className="h-3 w-3" />
                    )}
                    <span>{member.role}</span>
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="w-full sm:w-1/4 flex sm:justify-end items-center gap-2">
                {isCurrentUserOwner && !member.isOwner ? (
                  confirmDeleteId === member.id ? (
                    <div className="flex items-center gap-1.5 animate-in fade-in-0">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleRemoveMember(member.id)}
                        className="h-7 px-2 text-[11px] rounded-[3px]"
                      >
                        {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Potvrdiť"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setConfirmDeleteId(null)}
                        className="h-7 px-2 text-[11px] rounded-[3px] border-border/60"
                      >
                        Zrušiť
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmDeleteId(member.id)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400 hover:bg-red-950/20 rounded-[3px]"
                      title={dict.admin.removeMember}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )
                ) : (
                  <span className="text-[11px] text-muted-foreground/40">—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
