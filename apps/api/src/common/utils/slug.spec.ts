/* eslint-disable @typescript-eslint/no-explicit-any -- Prisma mocks require loose typing */
import { describe, it, expect, vi } from "vitest";
import { slugify, generateUniqueSlug, generateUniqueUsername } from "./slug";

describe("slugify", () => {
  it("lowercases and trims", () => {
    expect(slugify("  Hello World  ")).toBe("hello-world");
  });

  it("replaces spaces and underscores with hyphens", () => {
    expect(slugify("foo bar_baz")).toBe("foo-bar-baz");
  });

  it("removes special characters", () => {
    expect(slugify("Darth Vader!@#$%")).toBe("darth-vader");
  });

  it("collapses multiple hyphens", () => {
    expect(slugify("a---b---c")).toBe("a-b-c");
  });

  it("strips leading and trailing hyphens", () => {
    expect(slugify("--hello--")).toBe("hello");
  });

  it("handles unicode by stripping non-word chars", () => {
    expect(slugify("café résumé")).toBe("caf-rsum");
  });

  it("handles empty string", () => {
    expect(slugify("")).toBe("");
  });
});

describe("generateUniqueSlug", () => {
  function mockPrisma(existingSlugs: string[]) {
    return {
      entity: {
        findFirst: vi.fn(({ where }: any) => {
          const found = existingSlugs.includes(where.slug);
          return Promise.resolve(found ? { id: "existing-id" } : null);
        }),
      },
    } as any;
  }

  it("returns base slug when no collision", async () => {
    const prisma = mockPrisma([]);
    const slug = await generateUniqueSlug(
      prisma,
      "entity",
      "My Entity",
      "proj-1",
    );
    expect(slug).toBe("my-entity");
  });

  it("appends counter on collision", async () => {
    const prisma = mockPrisma(["my-entity"]);
    const slug = await generateUniqueSlug(
      prisma,
      "entity",
      "My Entity",
      "proj-1",
    );
    expect(slug).toBe("my-entity-1");
  });

  it("increments counter for multiple collisions", async () => {
    const prisma = mockPrisma(["my-entity", "my-entity-1", "my-entity-2"]);
    const slug = await generateUniqueSlug(
      prisma,
      "entity",
      "My Entity",
      "proj-1",
    );
    expect(slug).toBe("my-entity-3");
  });

  it("scopes to projectId", async () => {
    const prisma = mockPrisma([]);
    await generateUniqueSlug(prisma, "entity", "Test", "proj-1");
    expect(prisma.entity.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ projectId: "proj-1" }),
      }),
    );
  });

  it("excludes own id on update", async () => {
    const prisma = mockPrisma(["my-entity"]);
    // Simulate: entity "my-entity" exists, but it's the one being updated
    prisma.entity.findFirst = vi.fn(({ where }: any) => {
      if (where.id?.not === "self-id" && where.slug === "my-entity") {
        return Promise.resolve(null); // excluded self
      }
      return Promise.resolve(null);
    });
    const slug = await generateUniqueSlug(
      prisma,
      "entity",
      "My Entity",
      "proj-1",
      "self-id",
    );
    expect(slug).toBe("my-entity");
  });
});

describe("generateUniqueUsername", () => {
  function mockPrisma(existingUsernames: string[]) {
    return {
      user: {
        findUnique: vi.fn(({ where }: any) => {
          const found = existingUsernames.includes(where.username);
          return Promise.resolve(found ? { id: "existing-id" } : null);
        }),
      },
    } as any;
  }

  it("returns base username when no collision", async () => {
    const prisma = mockPrisma([]);
    const username = await generateUniqueUsername(prisma, "John Doe");
    expect(username).toBe("john-doe");
  });

  it("appends counter on collision", async () => {
    const prisma = mockPrisma(["john-doe"]);
    const username = await generateUniqueUsername(prisma, "John Doe");
    expect(username).toBe("john-doe-1");
  });

  it("defaults to 'user' for empty name", async () => {
    const prisma = mockPrisma([]);
    const username = await generateUniqueUsername(prisma, "");
    expect(username).toBe("user");
  });
});
