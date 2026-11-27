-- AlterTable
ALTER TABLE "lore_articles" ADD COLUMN "parentArticleId" TEXT;

-- AddForeignKey
ALTER TABLE "lore_articles" ADD CONSTRAINT "lore_articles_parentArticleId_fkey" FOREIGN KEY ("parentArticleId") REFERENCES "lore_articles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
