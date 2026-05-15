-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('user', 'moderator', 'support', 'admin', 'super_admin');

-- CreateEnum
CREATE TYPE "BenchmarkVisibility" AS ENUM ('public', 'private');

-- CreateEnum
CREATE TYPE "BenchmarkStatus" AS ENUM ('pending', 'processing', 'completed', 'failed', 'flagged');

-- CreateEnum
CREATE TYPE "BenchmarkCategory" AS ENUM ('disk', 'cpu', 'memory', 'network', 'security');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "countries" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(2) NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT,
    "flagEmoji" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asns" (
    "id" TEXT NOT NULL,
    "asnNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "organization" TEXT,
    "countryId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "providers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "websiteUrl" TEXT,
    "logoUrl" TEXT,
    "countryId" TEXT,
    "asnId" TEXT,
    "uptimeRating" DOUBLE PRECISION,
    "avgScore" DOUBLE PRECISION,
    "benchmarkCount" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "benchmarks" (
    "id" TEXT NOT NULL,
    "uuid" TEXT NOT NULL,
    "userId" TEXT,
    "providerId" TEXT,
    "asnId" TEXT,
    "countryId" TEXT,
    "visibility" "BenchmarkVisibility" NOT NULL DEFAULT 'public',
    "status" "BenchmarkStatus" NOT NULL DEFAULT 'pending',
    "hostname" TEXT,
    "osName" TEXT,
    "osVersion" TEXT,
    "kernel" TEXT,
    "architecture" TEXT,
    "virtualization" TEXT,
    "cpuModel" TEXT,
    "cpuCores" INTEGER,
    "cpuThreads" INTEGER,
    "cpuFrequencyMhz" DOUBLE PRECISION,
    "ramTotalMb" INTEGER,
    "swapTotalMb" INTEGER,
    "diskTotalGb" DOUBLE PRECISION,
    "uptimeSeconds" BIGINT,
    "loadAverage" TEXT,
    "ipv4" TEXT,
    "ipv6" TEXT,
    "reverseDns" TEXT,
    "city" TEXT,
    "region" TEXT,
    "isp" TEXT,
    "organization" TEXT,
    "rawPayload" JSONB,
    "publicSlug" TEXT,
    "privateTokenHash" TEXT,
    "trustScore" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "clientVersion" TEXT,
    "submitterIp" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "benchmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "benchmark_results" (
    "id" TEXT NOT NULL,
    "benchmarkId" TEXT NOT NULL,
    "category" "BenchmarkCategory" NOT NULL,
    "metricName" TEXT NOT NULL,
    "metricValue" DOUBLE PRECISION NOT NULL,
    "unit" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "benchmark_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "benchmark_scores" (
    "id" TEXT NOT NULL,
    "benchmarkId" TEXT NOT NULL,
    "cpuScore" DOUBLE PRECISION,
    "diskScore" DOUBLE PRECISION,
    "memoryScore" DOUBLE PRECISION,
    "networkScore" DOUBLE PRECISION,
    "securityScore" DOUBLE PRECISION,
    "totalScore" DOUBLE PRECISION,
    "rankSnapshot" INTEGER,
    "scoreVersion" TEXT NOT NULL DEFAULT 'v1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "benchmark_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "benchmark_locations" (
    "id" TEXT NOT NULL,
    "benchmarkId" TEXT NOT NULL,
    "testLocation" TEXT NOT NULL,
    "downloadMbps" DOUBLE PRECISION,
    "uploadMbps" DOUBLE PRECISION,
    "pingMs" DOUBLE PRECISION,
    "jitterMs" DOUBLE PRECISION,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "benchmark_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotions" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "couponCode" TEXT,
    "price" DOUBLE PRECISION,
    "currency" TEXT DEFAULT 'USD',
    "countryId" TEXT,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compare_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "benchmarkIds" JSONB,
    "providerIds" JSONB,
    "compareType" TEXT,
    "shareSlug" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compare_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_audit_logs" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "group" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "abuse_flags" (
    "id" TEXT NOT NULL,
    "benchmarkId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "resolvedBy" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "abuse_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nonces" (
    "id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nonces_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "api_tokens_tokenHash_key" ON "api_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "api_tokens_userId_idx" ON "api_tokens"("userId");

-- CreateIndex
CREATE INDEX "api_tokens_tokenHash_idx" ON "api_tokens"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "countries_code_key" ON "countries"("code");

-- CreateIndex
CREATE UNIQUE INDEX "asns_asnNumber_key" ON "asns"("asnNumber");

-- CreateIndex
CREATE INDEX "asns_asnNumber_idx" ON "asns"("asnNumber");

-- CreateIndex
CREATE UNIQUE INDEX "providers_slug_key" ON "providers"("slug");

-- CreateIndex
CREATE INDEX "providers_slug_idx" ON "providers"("slug");

-- CreateIndex
CREATE INDEX "providers_isActive_avgScore_idx" ON "providers"("isActive", "avgScore");

-- CreateIndex
CREATE UNIQUE INDEX "benchmarks_uuid_key" ON "benchmarks"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "benchmarks_publicSlug_key" ON "benchmarks"("publicSlug");

-- CreateIndex
CREATE UNIQUE INDEX "benchmarks_privateTokenHash_key" ON "benchmarks"("privateTokenHash");

-- CreateIndex
CREATE INDEX "benchmarks_visibility_status_createdAt_idx" ON "benchmarks"("visibility", "status", "createdAt");

-- CreateIndex
CREATE INDEX "benchmarks_providerId_createdAt_idx" ON "benchmarks"("providerId", "createdAt");

-- CreateIndex
CREATE INDEX "benchmarks_asnId_createdAt_idx" ON "benchmarks"("asnId", "createdAt");

-- CreateIndex
CREATE INDEX "benchmarks_publicSlug_idx" ON "benchmarks"("publicSlug");

-- CreateIndex
CREATE INDEX "benchmarks_deletedAt_visibility_status_idx" ON "benchmarks"("deletedAt", "visibility", "status");

-- CreateIndex
CREATE INDEX "benchmark_results_benchmarkId_category_idx" ON "benchmark_results"("benchmarkId", "category");

-- CreateIndex
CREATE INDEX "benchmark_scores_totalScore_idx" ON "benchmark_scores"("totalScore" DESC);

-- CreateIndex
CREATE INDEX "benchmark_scores_benchmarkId_idx" ON "benchmark_scores"("benchmarkId");

-- CreateIndex
CREATE INDEX "benchmark_locations_benchmarkId_idx" ON "benchmark_locations"("benchmarkId");

-- CreateIndex
CREATE INDEX "promotions_isActive_endsAt_idx" ON "promotions"("isActive", "endsAt");

-- CreateIndex
CREATE INDEX "promotions_providerId_idx" ON "promotions"("providerId");

-- CreateIndex
CREATE UNIQUE INDEX "compare_history_shareSlug_key" ON "compare_history"("shareSlug");

-- CreateIndex
CREATE INDEX "admin_audit_logs_adminUserId_createdAt_idx" ON "admin_audit_logs"("adminUserId", "createdAt");

-- CreateIndex
CREATE INDEX "admin_audit_logs_entityType_entityId_idx" ON "admin_audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- CreateIndex
CREATE INDEX "abuse_flags_status_createdAt_idx" ON "abuse_flags"("status", "createdAt");

-- CreateIndex
CREATE INDEX "abuse_flags_benchmarkId_idx" ON "abuse_flags"("benchmarkId");

-- CreateIndex
CREATE UNIQUE INDEX "nonces_value_key" ON "nonces"("value");

-- CreateIndex
CREATE INDEX "nonces_expiresAt_idx" ON "nonces"("expiresAt");

-- AddForeignKey
ALTER TABLE "api_tokens" ADD CONSTRAINT "api_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asns" ADD CONSTRAINT "asns_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "providers" ADD CONSTRAINT "providers_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "providers" ADD CONSTRAINT "providers_asnId_fkey" FOREIGN KEY ("asnId") REFERENCES "asns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benchmarks" ADD CONSTRAINT "benchmarks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benchmarks" ADD CONSTRAINT "benchmarks_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benchmarks" ADD CONSTRAINT "benchmarks_asnId_fkey" FOREIGN KEY ("asnId") REFERENCES "asns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benchmarks" ADD CONSTRAINT "benchmarks_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benchmark_results" ADD CONSTRAINT "benchmark_results_benchmarkId_fkey" FOREIGN KEY ("benchmarkId") REFERENCES "benchmarks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benchmark_scores" ADD CONSTRAINT "benchmark_scores_benchmarkId_fkey" FOREIGN KEY ("benchmarkId") REFERENCES "benchmarks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benchmark_locations" ADD CONSTRAINT "benchmark_locations_benchmarkId_fkey" FOREIGN KEY ("benchmarkId") REFERENCES "benchmarks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compare_history" ADD CONSTRAINT "compare_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abuse_flags" ADD CONSTRAINT "abuse_flags_benchmarkId_fkey" FOREIGN KEY ("benchmarkId") REFERENCES "benchmarks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
