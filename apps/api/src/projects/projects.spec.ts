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

describe("Projects (integration)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let module: TestingModule;
  let authCookie: string;
  let csrfToken: string;
  let userId: string;

  beforeAll(async () => {
    ({ app, prisma, module } = await createTestApp());
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await app.close();
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);
    const auth = await createAuthenticatedUser(prisma, module);
    authCookie = auth.cookie;
    csrfToken = auth.csrfToken;
    userId = auth.user.id;
  });

  // -------------------------------------------------------------------------
  // CREATE
  // -------------------------------------------------------------------------

  describe("POST /v1/projects", () => {
    it("creates a project and returns it", async () => {
      const res = await request(app.getHttpServer())
        .post("/v1/projects")
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .send({ name: "Middle Earth", description: "Tolkien's world" })
        .expect(201);

      expect(res.body).toMatchObject({
        name: "Middle Earth",
        slug: "middle-earth",
        description: "Tolkien's world",
        ownerId: userId,
      });
      expect(res.body.id).toBeDefined();
    });

    it("returns 401 without auth", async () => {
      await request(app.getHttpServer())
        .post("/v1/projects")
        .send({ name: "No Auth" })
        .expect(401);
    });

    it("returns 400 for missing name", async () => {
      await request(app.getHttpServer())
        .post("/v1/projects")
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .send({ description: "no name" })
        .expect(400);
    });

    it("generates unique slugs for duplicate names", async () => {
      await request(app.getHttpServer())
        .post("/v1/projects")
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .send({ name: "Duplicate" })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post("/v1/projects")
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .send({ name: "Duplicate" })
        .expect(201);

      expect(res.body.slug).toBe("duplicate-1");
    });
  });

  // -------------------------------------------------------------------------
  // READ
  // -------------------------------------------------------------------------

  describe("GET /v1/projects", () => {
    it("lists only the user's projects", async () => {
      await request(app.getHttpServer())
        .post("/v1/projects")
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .send({ name: "Project A" });
      await request(app.getHttpServer())
        .post("/v1/projects")
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .send({ name: "Project B" });

      // Second user shouldn't see first user's projects
      const other = await createAuthenticatedUser(prisma, module, {
        email: "other@example.com",
      });

      const res = await request(app.getHttpServer())
        .get("/v1/projects")
        .set("Cookie", other.cookie)
        .set("x-csrf-token", other.csrfToken)
        .expect(200);

      expect(res.body).toHaveLength(0);
    });
  });

  describe("GET /v1/projects/:slug", () => {
    it("returns a project by slug", async () => {
      await request(app.getHttpServer())
        .post("/v1/projects")
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .send({ name: "Test Project" });

      const res = await request(app.getHttpServer())
        .get("/v1/projects/test-project")
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .expect(200);

      expect(res.body.name).toBe("Test Project");
    });

    it("returns 404 for non-existent project", async () => {
      await request(app.getHttpServer())
        .get("/v1/projects/does-not-exist")
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .expect(404);
    });

    it("returns 403 for another user's project", async () => {
      await request(app.getHttpServer())
        .post("/v1/projects")
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .send({ name: "Private" });

      const other = await createAuthenticatedUser(prisma, module, {
        email: "intruder@example.com",
      });

      await request(app.getHttpServer())
        .get("/v1/projects/private")
        .set("Cookie", other.cookie)
        .set("x-csrf-token", other.csrfToken)
        .expect(403);
    });
  });

  // -------------------------------------------------------------------------
  // UPDATE
  // -------------------------------------------------------------------------

  describe("PATCH /v1/projects/:slug", () => {
    it("updates project name and regenerates slug", async () => {
      await request(app.getHttpServer())
        .post("/v1/projects")
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .send({ name: "Old Name" });

      const res = await request(app.getHttpServer())
        .patch("/v1/projects/old-name")
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .send({ name: "New Name" })
        .expect(200);

      expect(res.body.name).toBe("New Name");
      expect(res.body.slug).toBe("new-name");
    });

    it("updates description without changing slug", async () => {
      await request(app.getHttpServer())
        .post("/v1/projects")
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .send({ name: "Stable Slug" });

      const res = await request(app.getHttpServer())
        .patch("/v1/projects/stable-slug")
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .send({ description: "Updated description" })
        .expect(200);

      expect(res.body.slug).toBe("stable-slug");
      expect(res.body.description).toBe("Updated description");
    });
  });

  // -------------------------------------------------------------------------
  // DELETE
  // -------------------------------------------------------------------------

  describe("DELETE /v1/projects/:slug", () => {
    it("deletes a project", async () => {
      await request(app.getHttpServer())
        .post("/v1/projects")
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .send({ name: "To Delete" });

      await request(app.getHttpServer())
        .delete("/v1/projects/to-delete")
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .expect(204);

      await request(app.getHttpServer())
        .get("/v1/projects/to-delete")
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .expect(404);
    });
  });
});
