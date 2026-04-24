import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import * as crypto from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { CreateApiKeyDto } from "./dto/create-api-key.dto";

const KEY_PREFIX = "lrm_";
const KEY_BYTES = 32;

function hashKey(rawKey: string): string {
  return crypto.createHash("sha256").update(rawKey).digest("hex");
}

@Injectable()
export class ApiKeysService {
  constructor(private prisma: PrismaService) {}

  async create(projectId: string, userId: string, dto: CreateApiKeyDto) {
    const rawKey = KEY_PREFIX + crypto.randomBytes(KEY_BYTES).toString("hex");

    const apiKey = await this.prisma.apiKey.create({
      data: {
        projectId,
        userId,
        name: dto.name,
        keyHash: hashKey(rawKey),
        permissions: dto.permissions ?? "READ_WRITE",
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
      select: {
        id: true,
        name: true,
        permissions: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    // Return the raw key exactly once — it cannot be recovered after this
    return { ...apiKey, key: rawKey };
  }

  async listByProject(projectId: string) {
    return this.prisma.apiKey.findMany({
      where: { projectId, revokedAt: null },
      select: {
        id: true,
        name: true,
        permissions: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async revoke(keyId: string, projectId: string) {
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { id: keyId },
      select: { id: true, projectId: true, revokedAt: true },
    });

    if (!apiKey || apiKey.projectId !== projectId) {
      throw new NotFoundException("API key not found");
    }

    if (apiKey.revokedAt) {
      return;
    }

    await this.prisma.apiKey.update({
      where: { id: keyId },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Validate a raw API key string. Returns the key record with project info
   * if valid, or null if the token isn't an API key.
   */
  async validate(rawKey: string) {
    if (!rawKey.startsWith(KEY_PREFIX)) {
      throw new UnauthorizedException("Invalid API key");
    }

    const apiKey = await this.prisma.apiKey.findUnique({
      where: { keyHash: hashKey(rawKey) },
      include: {
        project: { select: { id: true, slug: true, ownerId: true } },
      },
    });

    if (!apiKey) {
      throw new UnauthorizedException("Invalid API key");
    }

    if (apiKey.revokedAt) {
      throw new UnauthorizedException("API key has been revoked");
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      throw new UnauthorizedException("API key has expired");
    }

    // Update lastUsedAt in the background
    this.prisma.apiKey
      .update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
      })
      .catch(() => {});

    return apiKey;
  }
}
