import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email address is required.')
    .email('Please enter a valid email address.'),
  password: z
    .string()
    .min(1, 'Password is required.')
    .min(6, 'Password must be at least 6 characters.'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(1, 'Full name is required.')
      .min(2, 'Full name must be at least 2 characters.'),
    email: z
      .string()
      .trim()
      .min(1, 'Email address is required.')
      .email('Please enter a valid email address.'),
    institutionId: z
      .string()
      .trim()
      .min(1, 'Institution ID is required.')
      .min(2, 'Institution ID must be at least 2 characters.'),
    department: z.string().trim().optional(),
    phoneNumber: z.string().trim().optional(),
    password: z
      .string()
      .min(1, 'Password is required.')
      .min(6, 'Password must be at least 6 characters.'),
    confirmPassword: z
      .string()
      .min(1, 'Please confirm your password.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

export const profileRecoverySchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, 'Full name is required.')
    .min(2, 'Full name must be at least 2 characters.'),
  institutionId: z
    .string()
    .trim()
    .min(1, 'Institution ID is required.')
    .min(2, 'Institution ID must be at least 2 characters.'),
  department: z.string().trim().optional(),
  phoneNumber: z.string().trim().optional(),
});

export type ProfileRecoveryFormData = z.infer<typeof profileRecoverySchema>;

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email address is required.')
    .email('Please enter a valid email address.'),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

