-- MFA fields on users
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "emailVerifiedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "mfaTotpEnabled"  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "mfaTotpSecret"   TEXT,
  ADD COLUMN IF NOT EXISTS "mfaEmailEnabled" BOOLEAN NOT NULL DEFAULT false;

-- Passkey credentials
CREATE TABLE IF NOT EXISTS "passkey_credentials" (
  "id"                  TEXT        NOT NULL PRIMARY KEY,
  "userId"              TEXT        NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "credentialId"        TEXT        NOT NULL UNIQUE,
  "credentialPublicKey" BYTEA       NOT NULL,
  "counter"             BIGINT      NOT NULL DEFAULT 0,
  "deviceType"          TEXT,
  "backedUp"            BOOLEAN     NOT NULL DEFAULT false,
  "transports"          TEXT,
  "name"                TEXT,
  "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "passkey_credentials_userId_idx" ON "passkey_credentials"("userId");

-- Smart scoring fields on benchmark_scores
ALTER TABLE "benchmark_scores"
  ADD COLUMN IF NOT EXISTS "stabilityBonus"   DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "confidenceLevel"  TEXT,
  ADD COLUMN IF NOT EXISTS "regionPercentile" INTEGER;

-- ProviderPlan
CREATE TABLE IF NOT EXISTS "provider_plans" (
  "id"           TEXT             NOT NULL PRIMARY KEY,
  "providerId"   TEXT             NOT NULL REFERENCES "providers"("id") ON DELETE CASCADE,
  "name"         TEXT             NOT NULL,
  "slug"         TEXT             NOT NULL,
  "vcpu"         INTEGER,
  "ramGb"        DOUBLE PRECISION,
  "diskGb"       DOUBLE PRECISION,
  "diskType"     TEXT,
  "bandwidthTb"  DOUBLE PRECISION,
  "priceUsd"     DOUBLE PRECISION,
  "pricingModel" TEXT,
  "regionCode"   TEXT,
  "isActive"     BOOLEAN          NOT NULL DEFAULT true,
  "sourceUrl"    TEXT,
  "syncedAt"     TIMESTAMP(3),
  "createdAt"    TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("providerId", "slug")
);
CREATE INDEX IF NOT EXISTS "provider_plans_providerId_isActive_idx" ON "provider_plans"("providerId", "isActive");
