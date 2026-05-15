-- AlterTable: Add AI analysis + issue detection fields to benchmarks
ALTER TABLE "benchmarks" ADD COLUMN "aiAnalysis" JSONB;
ALTER TABLE "benchmarks" ADD COLUMN "aiAnalyzedAt" TIMESTAMP(3);
ALTER TABLE "benchmarks" ADD COLUMN "detectedIssues" JSONB;

-- CreateTable: monitored_servers
CREATE TABLE "monitored_servers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nickname" TEXT,
    "hostname" TEXT,
    "interval" TEXT NOT NULL DEFAULT 'weekly',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monitored_servers_pkey" PRIMARY KEY ("id")
);

-- CreateTable: monitoring_results
CREATE TABLE "monitoring_results" (
    "id" TEXT NOT NULL,
    "monitoredServerId" TEXT NOT NULL,
    "benchmarkId" TEXT,
    "totalScore" DOUBLE PRECISION,
    "cpuScore" DOUBLE PRECISION,
    "diskScore" DOUBLE PRECISION,
    "networkScore" DOUBLE PRECISION,
    "memoryScore" DOUBLE PRECISION,
    "securityScore" DOUBLE PRECISION,
    "scoreChange" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monitoring_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "monitoring_results_benchmarkId_key" ON "monitoring_results"("benchmarkId");
CREATE INDEX "monitored_servers_userId_idx" ON "monitored_servers"("userId");
CREATE INDEX "monitored_servers_isActive_nextRunAt_idx" ON "monitored_servers"("isActive", "nextRunAt");
CREATE INDEX "monitoring_results_monitoredServerId_createdAt_idx" ON "monitoring_results"("monitoredServerId", "createdAt");

-- AddForeignKey
ALTER TABLE "monitored_servers" ADD CONSTRAINT "monitored_servers_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "monitoring_results" ADD CONSTRAINT "monitoring_results_monitoredServerId_fkey"
    FOREIGN KEY ("monitoredServerId") REFERENCES "monitored_servers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
