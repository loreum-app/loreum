-- AlterTable
ALTER TABLE "characters" ADD COLUMN     "voiceNotes" TEXT;

-- AlterTable
ALTER TABLE "scenes" ADD COLUMN     "styleNotes" TEXT;

-- CreateTable
CREATE TABLE "style_guides" (
    "projectId" TEXT NOT NULL,
    "pov" TEXT,
    "tense" TEXT,
    "voice" TEXT,
    "tone" TEXT,
    "pacing" TEXT,
    "dialogueRules" TEXT,
    "proseStyle" TEXT,
    "vocabulary" TEXT,
    "customRules" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "style_guides_pkey" PRIMARY KEY ("projectId")
);

-- AddForeignKey
ALTER TABLE "style_guides" ADD CONSTRAINT "style_guides_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
