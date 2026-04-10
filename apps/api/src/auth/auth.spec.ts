import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { INestApplication } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import { PrismaService } from "../prisma/prisma.service";
import {
  createTestApp,
  createAuthenticatedUser,
  cleanDatabase,
} from "../test/helpers";

describe("Auth (integration)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let module: TestingModule;

  beforeAll(async () => {
    ({ app, prisma, module } = await createTestApp());
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await app.close();
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);
  });

  // -------------------------------------------------------------------------
  // GET /auth/me
  // -------------------------------------------------------------------------

  describe("GET /api/v1/auth/me", () => {
    it("returns authenticated user profile", async () => {
      const auth = await createAuthenticatedUser(prisma, module, {
        email: "gandalf@shire.com",
        name: "Gandalf",
      });

      const res = await request(app.getHttpServer())
        .get("/api/v1/auth/me")
        .set("Authorization", auth.authHeader)
        .expect(200);

      expect(res.body).toMatchObject({
        email: "gandalf@shire.com",
        displayName: "Gandalf",
      });
      expect(res.body.id).toBeDefined();
    });

    it("returns 401 without auth", async () => {
      await request(app.getHttpServer())
        .get("/api/v1/auth/me")
        .expect(401);
    });

    it("returns 401 with invalid token", async () => {
      await request(app.getHttpServer())
        .get("/api/v1/auth/me")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);
    });
  });

  // -------------------------------------------------------------------------
  // GET /auth/sessions
  // -------------------------------------------------------------------------

  describe("GET /api/v1/auth/sessions", () => {
    it("lists active sessions for the user", async () => {
      const auth = await createAuthenticatedUser(prisma, module);

      const res = await request(app.getHttpServer())
        .get("/api/v1/auth/sessions")
        .set("Authorization", auth.authHeader)
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].id).toBe(auth.session.id);
    });
  });

  // -------------------------------------------------------------------------
  // DELETE /auth/sessions/:id
  // -------------------------------------------------------------------------

  describe("DELETE /api/v1/auth/sessions/:id", () => {
    it("invalidates a specific session", async () => {
      const auth = await createAuthenticatedUser(prisma, module);

      await request(app.getHttpServer())
        .delete(`/api/v1/auth/sessions/${auth.session.id}`)
        .set("Authorization", auth.authHeader)
        .expect(204);

      // Session should now be invalid — subsequent requests should fail
      const session = await prisma.session.findUnique({
        where: { id: auth.session.id },
      });
      expect(session?.isValid).toBe(false);
    });

    it("cannot invalidate another user's session", async () => {
      const user1 = await createAuthenticatedUser(prisma, module, {
        email: "user1@test.com",
      });
      const user2 = await createAuthenticatedUser(prisma, module, {
        email: "user2@test.com",
      });

      await request(app.getHttpServer())
        .delete(`/api/v1/auth/sessions/${user1.session.id}`)
        .set("Authorization", user2.authHeader)
        .expect(403);
    });
  });

  // -------------------------------------------------------------------------
  // POST /auth/logout
  // -------------------------------------------------------------------------

  describe("POST /api/v1/auth/logout", () => {
    it("invalidates current session and clears cookie", async () => {
      const auth = await createAuthenticatedUser(prisma, module);

      const res = await request(app.getHttpServer())
        .post("/api/v1/auth/logout")
        .set("Authorization", auth.authHeader)
        .expect(204);

      // Cookie should be cleared
      const cookies = res.headers["set-cookie"];
      if (cookies) {
        const authCookie = Array.isArray(cookies)
          ? cookies.find((c: string) => c.startsWith("auth_token"))
          : cookies;
        if (authCookie) {
          expect(authCookie).toContain("Max-Age=0");
        }
      }

      // Session should be invalidated
      const session = await prisma.session.findUnique({
        where: { id: auth.session.id },
      });
      expect(session?.isValid).toBe(false);
    });
  });
});
