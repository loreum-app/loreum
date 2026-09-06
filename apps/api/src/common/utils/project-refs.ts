import { BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

/**
 * Guards against cross-project references. Several DTOs accept raw ids
 * (timeline events, scenes, item types, maps, parent organizations); without
 * these checks a caller could link their record to a row in someone else's
 * project and read its fields back through an include.
 */

function reject(field: string): never {
  throw new BadRequestException(`${field} does not belong to this project`);
}

export async function assertTimelineEventInProject(
  prisma: PrismaService,
  projectId: string,
  id: string | null | undefined,
): Promise<void> {
  if (!id) return;
  const row = await prisma.timelineEvent.findFirst({
    where: { id, projectId },
    select: { id: true },
  });
  if (!row) reject("timelineEventId");
}

export async function assertSceneInProject(
  prisma: PrismaService,
  projectId: string,
  id: string | null | undefined,
): Promise<void> {
  if (!id) return;
  const row = await prisma.scene.findFirst({
    where: { id, chapter: { work: { projectId } } },
    select: { id: true },
  });
  if (!row) reject("sceneId");
}

export async function assertItemTypeInProject(
  prisma: PrismaService,
  projectId: string,
  id: string | null | undefined,
): Promise<void> {
  if (!id) return;
  const row = await prisma.itemType.findFirst({
    where: { id, projectId },
    select: { id: true },
  });
  if (!row) reject("itemTypeId");
}

export async function assertMapInProject(
  prisma: PrismaService,
  projectId: string,
  id: string | null | undefined,
): Promise<void> {
  if (!id) return;
  const row = await prisma.map.findFirst({
    where: { id, projectId },
    select: { id: true },
  });
  if (!row) reject("mapId");
}

export async function assertOrganizationInProject(
  prisma: PrismaService,
  projectId: string,
  entityId: string | null | undefined,
): Promise<void> {
  if (!entityId) return;
  const row = await prisma.entity.findFirst({
    where: { id: entityId, projectId, type: "ORGANIZATION" },
    select: { id: true },
  });
  if (!row) reject("parentOrgId");
}
