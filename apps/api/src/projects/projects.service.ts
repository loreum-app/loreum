import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";
import { slugify } from "../common/utils/slug";

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateProjectDto) {
    const slug = await this.generateUniqueSlug(dto.name);

    return this.prisma.project.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        ownerId: userId,
      },
    });
  }

  async findAllByUser(userId: string) {
    return this.prisma.project.findMany({
      where: { ownerId: userId },
      orderBy: { updatedAt: "desc" },
    });
  }

  async findBySlug(slug: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { slug },
    });

    if (!project) {
      throw new NotFoundException(`Project not found`);
    }

    this.assertOwner(project.ownerId, userId);
    return project;
  }

  async findPublicBySlug(slug: string) {
    const project = await this.prisma.project.findUnique({
      where: { slug },
    });

    if (!project || project.visibility === "PRIVATE") {
      throw new NotFoundException("Project not found");
    }

    return project;
  }

  async update(slug: string, userId: string, dto: UpdateProjectDto) {
    const project = await this.findBySlug(slug, userId);

    const data: Record<string, unknown> = {};
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.visibility !== undefined) data.visibility = dto.visibility;

    if (dto.name !== undefined) {
      data.name = dto.name;
      data.slug = await this.generateUniqueSlug(dto.name, project.id);
    }

    return this.prisma.project.update({
      where: { id: project.id },
      data,
    });
  }

  async delete(slug: string, userId: string) {
    const project = await this.findBySlug(slug, userId);

    await this.prisma.project.delete({
      where: { id: project.id },
    });
  }

  async saveTimelineConfig(
    slug: string,
    userId: string,
    config: {
      timelineMode?: string;
      timelineStart?: number;
      timelineEnd?: number;
      timelineLabelPrefix?: string;
      timelineLabelSuffix?: string;
    },
  ) {
    const project = await this.findBySlug(slug, userId);
    return this.prisma.project.update({
      where: { id: project.id },
      data: {
        ...(config.timelineMode !== undefined && {
          timelineMode: config.timelineMode,
        }),
        timelineStart: config.timelineStart,
        timelineEnd: config.timelineEnd,
        timelineLabelPrefix: config.timelineLabelPrefix,
        timelineLabelSuffix: config.timelineLabelSuffix,
      },
      select: {
        timelineMode: true,
        timelineStart: true,
        timelineEnd: true,
        timelineLabelPrefix: true,
        timelineLabelSuffix: true,
      },
    });
  }

  async patchGraphLayout(
    slug: string,
    userId: string,
    patch: Record<string, { x: number; y: number }>,
  ) {
    const project = await this.findBySlug(slug, userId);
    await this.prisma.$executeRaw`
      UPDATE projects
      SET "graphLayout" = COALESCE("graphLayout", '{}') || ${JSON.stringify(patch)}::jsonb
      WHERE id = ${project.id}
    `;
    return patch; // $executeRaw returns an affected row count, not the updated record, which is why we return patch directly instead of the updated project.
  }

  private assertOwner(ownerId: string, userId: string) {
    if (ownerId !== userId) {
      throw new ForbiddenException("You do not own this project");
    }
  }

  private async generateUniqueSlug(
    name: string,
    excludeId?: string,
  ): Promise<string> {
    const base = slugify(name);
    let slug = base;
    let counter = 0;

    while (true) {
      const existing = await this.prisma.project.findUnique({
        where: { slug },
        select: { id: true },
      });

      if (!existing || existing.id === excludeId) return slug;
      counter++;
      slug = `${base}-${counter}`;
    }
  }
}
