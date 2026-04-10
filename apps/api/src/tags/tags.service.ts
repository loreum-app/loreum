import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  async create(projectId: string, dto: CreateTagDto) {
    return this.prisma.tag.create({
      data: {
        projectId,
        name: dto.name,
        color: dto.color,
      },
    });
  }

  async findAllByProject(projectId: string) {
    return this.prisma.tag.findMany({
      where: { projectId },
      orderBy: { name: 'asc' },
    });
  }

  async findByName(projectId: string, name: string) {
    const tag = await this.prisma.tag.findUnique({
      where: { projectId_name: { projectId, name } },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    return tag;
  }

  async update(projectId: string, name: string, dto: UpdateTagDto) {
    const tag = await this.findByName(projectId, name);

    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.color !== undefined) data.color = dto.color;

    return this.prisma.tag.update({
      where: { id: tag.id },
      data,
    });
  }

  async delete(projectId: string, name: string) {
    const tag = await this.findByName(projectId, name);

    await this.prisma.tag.delete({
      where: { id: tag.id },
    });
  }
}
