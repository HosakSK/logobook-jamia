import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").optional().or(z.literal("")),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    passwordConfirm: z.string().min(8, "Please confirm your password"),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Passwords do not match",
    path: ["passwordConfirm"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const resetPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const manualPasswordSchema = z.object({
  brandSlug: z.string().min(1, "Brand identifier is required"),
  password: z.string().min(1, "Password is required"),
});

export type ManualPasswordInput = z.infer<typeof manualPasswordSchema>;
