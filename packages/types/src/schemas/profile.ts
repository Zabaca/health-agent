import { z } from 'zod';
import { todayIsoDate } from '../dates';

export const profileSchema = z.object({
  firstName:   z.string().min(1, "First name is required"),
  middleName:  z.string().optional(),
  lastName:    z.string().min(1, "Last name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Please enter a valid date (YYYY-MM-DD)")
    .refine(val => !isNaN(new Date(val).getTime()), "Invalid date")
    .refine(val => val <= todayIsoDate(), "Cannot be in the future"),
  address:     z.string().min(1, "Address is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  ssn:         z.string().optional().refine(val => !val || val.replace(/\D/g, '').length === 4, "Please enter the last 4 digits of your SSN"),
  avatarUrl:   z.string().optional(),
  // Only collected during onboarding when the OAuth provider returned no email.
  // Optional here; required-when-missing is enforced client-side and the server
  // refuses to mark the profile complete without an email on file.
  email:       z.string().email("Please enter a valid email address").optional().or(z.literal("")),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

export const staffProfileSchema = z.object({
  firstName:   z.string().min(1, "Required"),
  middleName:  z.string().optional(),
  lastName:    z.string().min(1, "Required"),
  phoneNumber: z.string().min(1, "Required"),
  address:     z.string().min(1, "Required"),
  avatarUrl:   z.string().optional(),
});

export type StaffProfileFormData = z.infer<typeof staffProfileSchema>;
