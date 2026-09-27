import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(60),
  locale: z.enum(["sk", "en", "cs"]),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(8, "Current password must be at least 8 characters"),
    password: z.string().min(8, "New password must be at least 8 characters"),
    passwordConfirm: z.string().min(8, "Please confirm your new password"),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "New passwords do not match",
    path: ["passwordConfirm"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const agencyDefaultsSchema = z.object({
  defaultClearanceZone: z.coerce.number().min(0).max(100).default(10),
  defaultMinSizePrintMm: z.coerce.number().min(1).max(500).default(15),
  defaultMinSizeDigitalPx: z.coerce.number().min(8).max(2000).default(32),
  defaultRules: z.string().max(2000).optional(),
  defaultPageTree: z.string().max(100).optional(),
  defaultTexts: z.record(z.string(), z.string()).optional(),
});

export type AgencyDefaultsInput = z.infer<typeof agencyDefaultsSchema>;
