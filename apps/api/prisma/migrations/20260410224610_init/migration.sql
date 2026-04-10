-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('CHARACTER', 'LOCATION', 'ORGANIZATION', 'ITEM');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PRIVATE', 'PUBLIC', 'UNLISTED');

-- CreateEnum
CREATE TYPE "ApiKeyPermission" AS ENUM ('READ_ONLY', 'READ_WRITE');

-- CreateEnum
CREATE TYPE "ChangeOperation" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- CreateEnum
CREATE TYPE "ChangeStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "username" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "roles" "Role"[] DEFAULT ARRAY['USER']::"Role"[],
    "lastActiveAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenFamily" TEXT NOT NULL,
    "lastTokenIat" INTEGER,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isValid" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "userId" TEXT NOT NULL,
    "bio" TEXT,
    "location" TEXT,
    "website" TEXT,
    "twitter" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "userId" TEXT NOT NULL,
    "emailNotifications" JSONB NOT NULL DEFAULT '{}',
    "inAppNotifications" JSONB NOT NULL DEFAULT '{}',
    "editorTheme" TEXT NOT NULL DEFAULT 'system',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
    "ownerId" TEXT NOT NULL,
    "graphLayout" JSONB,
    "timelineMode" TEXT NOT NULL DEFAULT 'standard',
    "timelineStart" DOUBLE PRECISION,
    "timelineEnd" DOUBLE PRECISION,
    "timelineLabelPrefix" TEXT,
    "timelineLabelSuffix" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entities" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" "EntityType" NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT,
    "description" TEXT,
    "backstory" TEXT,
    "secrets" TEXT,
    "notes" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "searchVector" tsvector,

    CONSTRAINT "entities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "characters" (
    "entityId" TEXT NOT NULL,
    "status" TEXT,
    "species" TEXT,
    "age" TEXT,
    "role" TEXT,

    CONSTRAINT "characters_pkey" PRIMARY KEY ("entityId")
);

-- CreateTable
CREATE TABLE "locations" (
    "entityId" TEXT NOT NULL,
    "mapId" TEXT,
    "x" DOUBLE PRECISION,
    "y" DOUBLE PRECISION,
    "region" TEXT,
    "condition" TEXT,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("entityId")
);

-- CreateTable
CREATE TABLE "organizations" (
    "entityId" TEXT NOT NULL,
    "parentOrgId" TEXT,
    "ideology" TEXT,
    "territory" TEXT,
    "status" TEXT,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("entityId")
);

-- CreateTable
CREATE TABLE "org_members" (
    "characterId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" TEXT,

    CONSTRAINT "org_members_pkey" PRIMARY KEY ("characterId","organizationId")
);

-- CreateTable
CREATE TABLE "items" (
    "entityId" TEXT NOT NULL,
    "itemTypeId" TEXT,
    "fields" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "items_pkey" PRIMARY KEY ("entityId")
);

-- CreateTable
CREATE TABLE "item_types" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "color" TEXT,
    "fieldSchema" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "item_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relationships" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "sourceEntityId" TEXT NOT NULL,
    "targetEntityId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "bidirectional" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eras" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "startDate" DOUBLE PRECISION NOT NULL,
    "endDate" DOUBLE PRECISION NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "eras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timeline_events" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "date" TEXT NOT NULL,
    "dateValue" DOUBLE PRECISION,
    "endDate" TEXT,
    "endDateValue" DOUBLE PRECISION,
    "sortOrder" INTEGER NOT NULL,
    "periodStart" TEXT,
    "periodEnd" TEXT,
    "significance" TEXT NOT NULL DEFAULT 'moderate',
    "eraId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "timeline_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timeline_event_entities" (
    "timelineEventId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "role" TEXT,

    CONSTRAINT "timeline_event_entities_pkey" PRIMARY KEY ("timelineEventId","entityId")
);

-- CreateTable
CREATE TABLE "lore_articles" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "searchVector" tsvector,

    CONSTRAINT "lore_articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lore_article_entities" (
    "loreArticleId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,

    CONSTRAINT "lore_article_entities_pkey" PRIMARY KEY ("loreArticleId","entityId")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entity_tags" (
    "entityId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "entity_tags_pkey" PRIMARY KEY ("entityId","tagId")
);

-- CreateTable
CREATE TABLE "lore_article_tags" (
    "loreArticleId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "lore_article_tags_pkey" PRIMARY KEY ("loreArticleId","tagId")
);

-- CreateTable
CREATE TABLE "plotlines" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "thematicStatement" TEXT,
    "parentPlotlineId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plotlines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plot_points" (
    "id" TEXT NOT NULL,
    "plotlineId" TEXT NOT NULL,
    "sequenceNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "label" TEXT,
    "sceneId" TEXT,
    "timelineEventId" TEXT,
    "entityId" TEXT,
    "locationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plot_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "works" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "chronologicalOrder" INTEGER NOT NULL,
    "releaseOrder" INTEGER NOT NULL,
    "synopsis" TEXT,
    "status" TEXT NOT NULL DEFAULT 'concept',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "works_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chapters" (
    "id" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sequenceNumber" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scenes" (
    "id" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "title" TEXT,
    "sequenceNumber" INTEGER NOT NULL,
    "description" TEXT,
    "content" TEXT,
    "plotlineId" TEXT,
    "locationId" TEXT,
    "timelineEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scene_characters" (
    "sceneId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "role" TEXT,
    "isPov" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "scene_characters_pkey" PRIMARY KEY ("sceneId","entityId")
);

-- CreateTable
CREATE TABLE "maps" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "gridSize" INTEGER NOT NULL DEFAULT 50,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "permissions" "ApiKeyPermission" NOT NULL DEFAULT 'READ_WRITE',
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pending_changes" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "apiKeyId" TEXT,
    "batchId" TEXT NOT NULL,
    "operation" "ChangeOperation" NOT NULL,
    "targetModel" TEXT NOT NULL,
    "targetId" TEXT,
    "proposedData" JSONB NOT NULL DEFAULT '{}',
    "previousData" JSONB,
    "status" "ChangeStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pending_changes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_lastActiveAt_idx" ON "users"("lastActiveAt");

-- CreateIndex
CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_tokenFamily_idx" ON "sessions"("tokenFamily");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "projects_slug_key" ON "projects"("slug");

-- CreateIndex
CREATE INDEX "projects_ownerId_idx" ON "projects"("ownerId");

-- CreateIndex
CREATE INDEX "entities_projectId_type_idx" ON "entities"("projectId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "entities_projectId_slug_key" ON "entities"("projectId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "item_types_projectId_slug_key" ON "item_types"("projectId", "slug");

-- CreateIndex
CREATE INDEX "relationships_projectId_sourceEntityId_idx" ON "relationships"("projectId", "sourceEntityId");

-- CreateIndex
CREATE INDEX "relationships_projectId_targetEntityId_idx" ON "relationships"("projectId", "targetEntityId");

-- CreateIndex
CREATE INDEX "eras_projectId_sortOrder_idx" ON "eras"("projectId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "eras_projectId_slug_key" ON "eras"("projectId", "slug");

-- CreateIndex
CREATE INDEX "timeline_events_projectId_sortOrder_idx" ON "timeline_events"("projectId", "sortOrder");

-- CreateIndex
CREATE INDEX "timeline_events_projectId_dateValue_idx" ON "timeline_events"("projectId", "dateValue");

-- CreateIndex
CREATE INDEX "lore_articles_projectId_category_idx" ON "lore_articles"("projectId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "lore_articles_projectId_slug_key" ON "lore_articles"("projectId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "tags_projectId_name_key" ON "tags"("projectId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "plotlines_projectId_slug_key" ON "plotlines"("projectId", "slug");

-- CreateIndex
CREATE INDEX "plot_points_plotlineId_sequenceNumber_idx" ON "plot_points"("plotlineId", "sequenceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "works_projectId_slug_key" ON "works"("projectId", "slug");

-- CreateIndex
CREATE INDEX "chapters_workId_sequenceNumber_idx" ON "chapters"("workId", "sequenceNumber");

-- CreateIndex
CREATE INDEX "scenes_chapterId_sequenceNumber_idx" ON "scenes"("chapterId", "sequenceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "maps_projectId_slug_key" ON "maps"("projectId", "slug");

-- CreateIndex
CREATE INDEX "api_keys_projectId_idx" ON "api_keys"("projectId");

-- CreateIndex
CREATE INDEX "api_keys_keyHash_idx" ON "api_keys"("keyHash");

-- CreateIndex
CREATE INDEX "pending_changes_projectId_status_idx" ON "pending_changes"("projectId", "status");

-- CreateIndex
CREATE INDEX "pending_changes_batchId_idx" ON "pending_changes"("batchId");

-- CreateIndex
CREATE INDEX "notifications_userId_read_idx" ON "notifications"("userId", "read");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entities" ADD CONSTRAINT "entities_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "maps"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_parentOrgId_fkey" FOREIGN KEY ("parentOrgId") REFERENCES "organizations"("entityId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_members" ADD CONSTRAINT "org_members_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("entityId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_members" ADD CONSTRAINT "org_members_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("entityId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_itemTypeId_fkey" FOREIGN KEY ("itemTypeId") REFERENCES "item_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_types" ADD CONSTRAINT "item_types_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relationships" ADD CONSTRAINT "relationships_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relationships" ADD CONSTRAINT "relationships_sourceEntityId_fkey" FOREIGN KEY ("sourceEntityId") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relationships" ADD CONSTRAINT "relationships_targetEntityId_fkey" FOREIGN KEY ("targetEntityId") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eras" ADD CONSTRAINT "eras_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_eraId_fkey" FOREIGN KEY ("eraId") REFERENCES "eras"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_event_entities" ADD CONSTRAINT "timeline_event_entities_timelineEventId_fkey" FOREIGN KEY ("timelineEventId") REFERENCES "timeline_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_event_entities" ADD CONSTRAINT "timeline_event_entities_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lore_articles" ADD CONSTRAINT "lore_articles_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lore_article_entities" ADD CONSTRAINT "lore_article_entities_loreArticleId_fkey" FOREIGN KEY ("loreArticleId") REFERENCES "lore_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lore_article_entities" ADD CONSTRAINT "lore_article_entities_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entity_tags" ADD CONSTRAINT "entity_tags_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entity_tags" ADD CONSTRAINT "entity_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lore_article_tags" ADD CONSTRAINT "lore_article_tags_loreArticleId_fkey" FOREIGN KEY ("loreArticleId") REFERENCES "lore_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lore_article_tags" ADD CONSTRAINT "lore_article_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plotlines" ADD CONSTRAINT "plotlines_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plotlines" ADD CONSTRAINT "plotlines_parentPlotlineId_fkey" FOREIGN KEY ("parentPlotlineId") REFERENCES "plotlines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plot_points" ADD CONSTRAINT "plot_points_plotlineId_fkey" FOREIGN KEY ("plotlineId") REFERENCES "plotlines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plot_points" ADD CONSTRAINT "plot_points_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "scenes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plot_points" ADD CONSTRAINT "plot_points_timelineEventId_fkey" FOREIGN KEY ("timelineEventId") REFERENCES "timeline_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plot_points" ADD CONSTRAINT "plot_points_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "entities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plot_points" ADD CONSTRAINT "plot_points_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "entities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "works" ADD CONSTRAINT "works_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_workId_fkey" FOREIGN KEY ("workId") REFERENCES "works"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenes" ADD CONSTRAINT "scenes_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenes" ADD CONSTRAINT "scenes_plotlineId_fkey" FOREIGN KEY ("plotlineId") REFERENCES "plotlines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenes" ADD CONSTRAINT "scenes_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "entities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenes" ADD CONSTRAINT "scenes_timelineEventId_fkey" FOREIGN KEY ("timelineEventId") REFERENCES "timeline_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_characters" ADD CONSTRAINT "scene_characters_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scene_characters" ADD CONSTRAINT "scene_characters_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maps" ADD CONSTRAINT "maps_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pending_changes" ADD CONSTRAINT "pending_changes_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pending_changes" ADD CONSTRAINT "pending_changes_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "api_keys"("id") ON DELETE SET NULL ON UPDATE CASCADE;
