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
  let authHeader: string;
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
    authHeader = auth.authHeader;
    userId = auth.user.id;
  });

  // -------------------------------------------------------------------------
  // CREATE
  // -------------------------------------------------------------------------

  describe("POST /api/v1/projects", () => {
    it("creates a project and returns it", async () => {
      const res = await request(app.getHttpServer())
        .post("/api/v1/projects")
        .set("Authorization", authHeader)
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
        .post("/api/v1/projects")
        .send({ name: "No Auth" })
        .expect(401);
    });

    it("returns 400 for missing name", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/projects")
        .set("Authorization", authHeader)
        .send({ description: "no name" })
        .expect(400);
    });

    it("generates unique slugs for duplicate names", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/projects")
        .set("Authorization", authHeader)
        .send({ name: "Duplicate" })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post("/api/v1/projects")
        .set("Authorization", authHeader)
        .send({ name: "Duplicate" })
        .expect(201);

      expect(res.body.slug).toBe("duplicate-1");
    });
  });

  // -------------------------------------------------------------------------
  // READ
  // -------------------------------------------------------------------------

  describe("GET /api/v1/projects", () => {
    it("lists only the user's projects", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/projects")
        .set("Authorization", authHeader)
        .send({ name: "Project A" });
      await request(app.getHttpServer())
        .post("/api/v1/projects")
        .set("Authorization", authHeader)
        .send({ name: "Project B" });

      // Second user shouldn't see first user's projects
      const other = await createAuthenticatedUser(prisma, module, {
        email: "other@example.com",
      });

      const res = await request(app.getHttpServer())
        .get("/api/v1/projects")
        .set("Authorization", other.authHeader)
        .expect(200);

      expect(res.body).toHaveLength(0);
    });
  });

  describe("GET /api/v1/projects/:slug", () => {
    it("returns a project by slug", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/projects")
        .set("Authorization", authHeader)
        .send({ name: "Test Project" });

      const res = await request(app.getHttpServer())
        .get("/api/v1/projects/test-project")
        .set("Authorization", authHeader)
        .expect(200);

      expect(res.body.name).toBe("Test Project");
    });

    it("returns 404 for non-existent project", async () => {
      await request(app.getHttpServer())
        .get("/api/v1/projects/does-not-exist")
        .set("Authorization", authHeader)
        .expect(404);
    });

    it("returns 403 for another user's project", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/projects")
        .set("Authorization", authHeader)
        .send({ name: "Private" });

      const other = await createAuthenticatedUser(prisma, module, {
        email: "intruder@example.com",
      });

      await request(app.getHttpServer())
        .get("/api/v1/projects/private")
        .set("Authorization", other.authHeader)
        .expect(403);
    });
  });

  // -------------------------------------------------------------------------
  // UPDATE
  // -------------------------------------------------------------------------

  describe("PATCH /api/v1/projects/:slug", () => {
    it("updates project name and regenerates slug", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/projects")
        .set("Authorization", authHeader)
        .send({ name: "Old Name" });

      const res = await request(app.getHttpServer())
        .patch("/api/v1/projects/old-name")
        .set("Authorization", authHeader)
        .send({ name: "New Name" })
        .expect(200);

      expect(res.body.name).toBe("New Name");
      expect(res.body.slug).toBe("new-name");
    });

    it("updates description without changing slug", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/projects")
        .set("Authorization", authHeader)
        .send({ name: "Stable Slug" });

      const res = await request(app.getHttpServer())
        .patch("/api/v1/projects/stable-slug")
        .set("Authorization", authHeader)
        .send({ description: "Updated description" })
        .expect(200);

      expect(res.body.slug).toBe("stable-slug");
      expect(res.body.description).toBe("Updated description");
    });
  });

  // -------------------------------------------------------------------------
  // DELETE
  // -------------------------------------------------------------------------

  describe("DELETE /api/v1/projects/:slug", () => {
    it("deletes a project", async () => {
      await request(app.getHttpServer())
        .post("/api/v1/projects")
        .set("Authorization", authHeader)
        .send({ name: "To Delete" });

      await request(app.getHttpServer())
        .delete("/api/v1/projects/to-delete")
        .set("Authorization", authHeader)
        .expect(204);

      await request(app.getHttpServer())
        .get("/api/v1/projects/to-delete")
        .set("Authorization", authHeader)
        .expect(404);
    });
  });
});
