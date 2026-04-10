import { PrismaService } from "../../prisma/prisma.service";

/**
 * Sanitizes a string into a URL-safe slug.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Generates a unique slug within a project scope.
 * Checks for collisions and appends a counter or random suffix.
 */
export async function generateUniqueSlug(
  prisma: PrismaService,
  table: string,
  name: string,
  projectId: string,
  existingId?: string,
): Promise<string> {
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let counter = 0;

  while (true) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic table access
    const existing = await (prisma as any)[table].findFirst({
      where: {
        projectId,
        slug,
        ...(existingId ? { id: { not: existingId } } : {}),
      },
      select: { id: true },
    });

    if (!existing) return slug;

    counter++;
    slug = `${baseSlug}-${counter}`;
  }
}

/**
 * Generates a unique username from a display name.
 */
export async function generateUniqueUsername(
  prisma: PrismaService,
  name: string,
): Promise<string> {
  const baseUsername = slugify(name || "user");
  let username = baseUsername;
  let counter = 0;

  while (true) {
    const existing = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!existing) return username;

    counter++;
    if (counter > 5) {
      // After 5 attempts, add random suffix to avoid slow sequential search
      const random = Math.random().toString(36).substring(2, 6);
      username = `${baseUsername}-${random}`;
    } else {
      username = `${baseUsername}-${counter}`;
    }
  }
}
