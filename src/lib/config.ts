import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1),
  DATABASE_AUTH_TOKEN: z.string().optional(),

  // Auth
  AUTH_SECRET: z.string().optional(),
  NEXTAUTH_URL: z.string().default('http://localhost:3000'),

  // Encryption
  ENCRYPTION_KEY: z.string().min(1),

  // Site
  SITE_DOMAIN: z.string().optional(),

  // Faxage
  FAXAGE_USERNAME: z.string().optional(),
  FAXAGE_COMPANY: z.string().optional(),
  FAXAGE_PASSWORD: z.string().optional(),
  FAXAGE_WEBHOOK_SECRET: z.string().optional(),
  FAXAGE_NOTIFY_URL: z.string().optional(),

  // Email (Resend)
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),

  // Cloudflare R2 / S3
  R2_ACCOUNT_ID: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

export function getConfiguration(): Env {
  if (cached) return cached;
  cached = envSchema.parse(process.env);
  return cached;
}
