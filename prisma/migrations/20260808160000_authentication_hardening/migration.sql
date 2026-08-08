-- Existing reset links are deliberately invalidated because plaintext bearer
-- tokens cannot be migrated safely into hashes without retaining the secret.
DELETE FROM "PasswordResetToken";

-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "authVersion" INTEGER NOT NULL DEFAULT 0;

-- Normalize existing addresses only after the pre-migration collision check.
UPDATE "User" SET "email" = lower(btrim("email"));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'User_email_normalized_check'
  ) THEN
    ALTER TABLE "User"
      ADD CONSTRAINT "User_email_normalized_check"
      CHECK ("email" = lower(btrim("email")));
  END IF;
END $$;

-- AlterTable
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'PasswordResetToken'
      AND column_name = 'token'
  ) THEN
    ALTER TABLE "PasswordResetToken" RENAME COLUMN "token" TO "tokenHash";
  END IF;
END $$;

DROP INDEX IF EXISTS "PasswordResetToken_token_key";

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PasswordResetToken_tokenHash_key"
  ON "PasswordResetToken"("tokenHash");
CREATE UNIQUE INDEX IF NOT EXISTS "PasswordResetToken_userId_key"
  ON "PasswordResetToken"("userId");
CREATE INDEX IF NOT EXISTS "PasswordResetToken_expiresAt_idx"
  ON "PasswordResetToken"("expiresAt");

-- CreateTable
CREATE TABLE IF NOT EXISTS "AuthRateLimit" (
  "action" TEXT NOT NULL,
  "identifierHash" TEXT NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 1,
  "windowStartedAt" TIMESTAMP(3) NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AuthRateLimit_pkey" PRIMARY KEY ("action", "identifierHash")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AuthRateLimit_expiresAt_idx"
  ON "AuthRateLimit"("expiresAt");
