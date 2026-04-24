/*
  Warnings:

  - A unique constraint covering the columns `[keyHash]` on the table `api_keys` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "api_keys_keyHash_idx";

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_keyHash_key" ON "api_keys"("keyHash");
