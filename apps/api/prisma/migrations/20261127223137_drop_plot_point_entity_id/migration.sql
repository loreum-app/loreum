/*
  Warnings:

  - You are about to drop the column `entityId` on the `plot_points` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "plot_points" DROP CONSTRAINT "plot_points_entityId_fkey";

-- AlterTable
ALTER TABLE "plot_points" DROP COLUMN "entityId";
