-- AlterTable
ALTER TABLE "characters" ADD COLUMN     "customFields" JSONB NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "locations" ADD COLUMN     "customFields" JSONB NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "customFields" JSONB NOT NULL DEFAULT '{}';

-- CreateTable
CREATE TABLE "entity_field_schemas" (
    "projectId" TEXT NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "fieldSchema" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entity_field_schemas_pkey" PRIMARY KEY ("projectId","entityType")
);

-- AddForeignKey
ALTER TABLE "entity_field_schemas" ADD CONSTRAINT "entity_field_schemas_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
