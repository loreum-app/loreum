-- Drop the unused review queue
DROP TABLE IF EXISTS "pending_changes";
DROP TYPE IF EXISTS "ChangeOperation";
DROP TYPE IF EXISTS "ChangeStatus";

-- CreateEnum
CREATE TYPE "LedgerOperation" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'UNDO');

-- CreateTable
CREATE TABLE "ledger_entries" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "operation" "LedgerOperation" NOT NULL,
    "targetModel" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "beforeData" JSONB,
    "afterData" JSONB,
    "undoneByEntryId" TEXT,
    "undoOfEntryId" TEXT,
    "actorType" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorLabel" TEXT,

    CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ledger_entries_projectId_createdAt_idx" ON "ledger_entries"("projectId", "createdAt");
CREATE INDEX "ledger_entries_projectId_targetModel_targetId_idx" ON "ledger_entries"("projectId", "targetModel", "targetId");
CREATE INDEX "ledger_entries_undoneByEntryId_idx" ON "ledger_entries"("undoneByEntryId");

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_undoneByEntryId_fkey" FOREIGN KEY ("undoneByEntryId") REFERENCES "ledger_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
