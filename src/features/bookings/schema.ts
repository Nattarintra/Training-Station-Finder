import { z } from 'zod';

export const reservationSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name.'),
  email: z.string().trim().email('Enter a valid email address.'),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ()-]{7,20}$/, 'Enter a valid phone number.'),
});

export type ReservationFormValues = z.infer<typeof reservationSchema>;

export const checkInSchema = z.object({
  bookingCode: z
    .string()
    .trim()
    .min(6, 'Enter your booking code.')
    .transform((value) => value.toUpperCase()),
});

export type CheckInFormValues = z.input<typeof checkInSchema>;
