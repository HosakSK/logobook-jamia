import { z } from "zod";

export const inviteMemberSchema = z.object({
  email: z.string().email("Please provide a valid email address").toLowerCase().trim(),
  role: z.enum(["EDITOR", "VIEWER"], {
    message: "Role must be either Editor or Viewer",
  }),
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

export const updateMemberRoleSchema = z.object({
  role: z.enum(["EDITOR", "VIEWER"], {
    message: "Role must be either Editor or Viewer",
  }),
});

export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
