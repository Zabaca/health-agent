import { z } from 'zod';

export const profileSchema = z.object({
  firstName:   z.string().min(1, "First name is required"),
  middleName:  z.string().optional(),
  lastName:    z.string().min(1, "Last name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required")
    .refine(val => !isNaN(new Date(val).getTime()), "Invalid date")
    .refine(val => new Date(val) <= new Date(), "Cannot be in the future"),
  address:     z.string().min(1, "Address is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  ssn:         z.string().min(1, "SSN is required"),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

export const staffProfileSchema = z.object({
  firstName:   z.string().min(1, "Required"),
  middleName:  z.string().optional(),
  lastName:    z.string().min(1, "Required"),
  phoneNumber: z.string().min(1, "Required"),
  address:     z.string().min(1, "Required"),
});

export type StaffProfileFormData = z.infer<typeof staffProfileSchema>;
