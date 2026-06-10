/**
 * auth.schema.ts
 * Zod runtime validation schemas for all auth request bodies.
 * These schemas are the input-validation layer that sits between the HTTP
 * boundary and the controller.  They enforce field-level constraints and
 * normalise data before it touches any business logic.
 * Spec reference: docs/specs_features.md §1.2, §1.3
 */

import { z } from 'zod';

const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .email({ message: 'Please provide a valid email address.' });


const registrationPasswordField = z
  .string()
  .min(8, { message: 'Password must be at least 8 characters long.' })
  .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter.' })
  .regex(/[0-9]/, { message: 'Password must contain at least one number.' });


const loginPasswordField = z
  .string()
  .min(1, { message: 'Password must not be empty.' });

export const registerSchema = z.object({
  email: emailField,
  name: z
    .string()
    .trim()
    .min(2, { message: 'Name must be at least 2 characters long.' })
    .max(50, { message: 'Name must be at most 50 characters long.' }),
  password: registrationPasswordField,
});

export const loginSchema = z.object({
  email: emailField,
  password: loginPasswordField,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;