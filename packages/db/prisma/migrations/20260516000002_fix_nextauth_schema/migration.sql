-- Fix NextAuth-required fields: make name nullable, add emailVerified, add Session and VerificationToken tables

-- Make name nullable
ALTER TABLE "users" ALTER COLUMN "name" DROP NOT NULL;

-- Add emailVerified
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailVerified" TIMESTAMP(3);

-- Session table (required by @auth/prisma-adapter even with JWT strategy)
CREATE TABLE IF NOT EXISTS "sessions" (
    "sessionToken" TEXT NOT NULL PRIMARY KEY,
    "userId"       TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "expires"      TIMESTAMP(3) NOT NULL,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- VerificationToken table
CREATE TABLE IF NOT EXISTS "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token"      TEXT NOT NULL,
    "expires"    TIMESTAMP(3) NOT NULL,
    UNIQUE("identifier", "token")
);
