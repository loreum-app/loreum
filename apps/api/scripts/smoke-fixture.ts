/**
 * Creates a throwaway user, project, and read-write API key in the configured
 * database and prints them as JSON. Used by the manual MCP smoke test
 * (see docs/DEPLOYMENT.md → "Smoke testing the MCP endpoint").
 *
 *   pnpm --filter api exec tsx scripts/smoke-fixture.ts
 */
import "dotenv/config";
import * as crypto from "crypto";
import { JwtService } from "@nestjs/jwt";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });
  const stamp = Date.now().toString(36);
  const user = await prisma.user.create({
    data: {
      email: `smoke-${stamp}@example.com`,
      username: `smoke-${stamp}`,
      profile: { create: {} },
      preferences: { create: {} },
    },
  });
  const project = await prisma.project.create({
    data: {
      name: `Smoke World ${stamp}`,
      slug: `smoke-world-${stamp}`,
      ownerId: user.id,
    },
  });
  const rawKey = "lrm_" + crypto.randomBytes(32).toString("hex");
  await prisma.apiKey.create({
    data: {
      projectId: project.id,
      userId: user.id,
      name: "smoke",
      keyHash: crypto.createHash("sha256").update(rawKey).digest("hex"),
      permissions: "READ_WRITE",
    },
  });
  // Browser session for the consent page (mirrors AuthService + CookieService).
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      tokenFamily: crypto.randomUUID(),
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    },
  });
  const secret = process.env.JWT_SECRET!;
  const authToken = new JwtService({ secret }).sign(
    {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      sessionId: session.id,
      tokenFamily: session.tokenFamily,
    },
    { expiresIn: "2h" },
  );
  const ts = Date.now().toString();
  const csrf = `${session.id}:${ts}:${crypto
    .createHmac("sha256", secret)
    .update(`${session.id}:${ts}`)
    .digest("hex")}`;

  console.log(
    JSON.stringify({
      projectSlug: project.slug,
      apiKey: rawKey,
      authToken,
      csrfToken: csrf,
    }),
  );
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
