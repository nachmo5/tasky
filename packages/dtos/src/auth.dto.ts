// ===============================
// MODEL =========================
// ===============================

import z from "zod";

//
export const userSchema = z
  .object({
    id: z.string(),
    name: z.string().nullable(),
  })
  .strict();

export type UserDTO = z.infer<typeof userSchema>;

// ================================
// ROUTES =========================
// ================================
//
//
export const loginRequestSchema = z
  .object({
    username: z.string(),
    password: z.string(),
  })
  .strict();

export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const loginResponseSchema = userSchema;

export type LoginResponse = z.infer<typeof loginResponseSchema>;

export const logoutRequestSchema = z.undefined();

export const logoutResponseSchema = z.undefined();

export const meRequestSchema = z.undefined();

export const meResponseSchema = userSchema;

export type MeResponse = z.infer<typeof loginResponseSchema>;
