import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import cookieParser from "cookie-parser";
import { AppModule } from "../app.module";
import { PrismaService } from "../prisma/prisma.service";

/**
 * Boots a full NestJS app for integration tests.
 * Uses the real AppModule with a test database.
 */
export async function createTestApp(): Promise<{
  app: INestApplication;
  prisma: PrismaService;
  module: TestingModule;
}> {
  const module = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = module.createNestApplication();

  app.setGlobalPrefix("api/v1");
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  await app.init();

  const prisma = module.get(PrismaService);

  return { app, prisma, module };
}

/**
 * Creates a test user in the database and returns a valid JWT + auth header.
 */
export async function createAuthenticatedUser(
  prisma: PrismaService,
  module: TestingModule,
  overrides?: { email?: string; name?: string },
) {
  const jwtService = module.get(JwtService);

  const email = overrides?.email ?? "test@example.com";
  const name = overrides?.name ?? "Test User";

  // Create user with required extension tables
  const user = await prisma.user.create({
    data: {
      email,
      name,
      username: email.split("@")[0] + "-" + Math.random().toString(36).slice(2, 6),
      profile: { create: {} },
      preferences: { create: {} },
    },
  });

  // Create a valid session
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      tokenFamily: crypto.randomUUID(),
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
    },
  });

  const token = jwtService.sign({
    sub: user.id,
    email: user.email,
    roles: user.roles,
    sessionId: session.id,
    tokenFamily: session.tokenFamily,
  });

  return {
    user,
    session,
    token,
    authHeader: `Bearer ${token}`,
  };
}

/**
 * Cleans all data from the test database.
 * Runs between test suites to ensure isolation.
 * Tables are truncated in dependency order.
 */
export async function cleanDatabase(prisma: PrismaService) {
  await prisma.$executeRawUnsafe(`
    DO $$ DECLARE r RECORD;
    BEGIN
      FOR r IN (
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public' AND tablename != '_prisma_migrations'
      ) LOOP
        EXECUTE 'TRUNCATE TABLE "' || r.tablename || '" CASCADE';
      END LOOP;
    END $$;
  `);
}
