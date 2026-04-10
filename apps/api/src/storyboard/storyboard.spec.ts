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

describe("Storyboard (integration)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let module: TestingModule;
  let authHeader: string;
  let projectSlug: string;

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

    const proj = await request(app.getHttpServer())
      .post("/api/v1/projects")
      .set("Authorization", authHeader)
      .send({ name: "Story World" });
    projectSlug = proj.body.slug;
  });

  const base = () => `/api/v1/projects/${projectSlug}/storyboard`;

  // -------------------------------------------------------------------------
  // Plotlines
  // -------------------------------------------------------------------------

  describe("Plotlines", () => {
    it("creates a plotline", async () => {
      const res = await request(app.getHttpServer())
        .post(`${base()}/plotlines`)
        .set("Authorization", authHeader)
        .send({ name: "The Ring Quest", description: "Destroy the One Ring" })
        .expect(201);

      expect(res.body).toMatchObject({
        name: "The Ring Quest",
        slug: "the-ring-quest",
      });
    });

    it("lists plotlines", async () => {
      await request(app.getHttpServer())
        .post(`${base()}/plotlines`)
        .set("Authorization", authHeader)
        .send({ name: "Plotline A" });
      await request(app.getHttpServer())
        .post(`${base()}/plotlines`)
        .set("Authorization", authHeader)
        .send({ name: "Plotline B" });

      const res = await request(app.getHttpServer())
        .get(`${base()}/plotlines`)
        .set("Authorization", authHeader)
        .expect(200);

      expect(res.body).toHaveLength(2);
    });

    it("deletes a plotline", async () => {
      await request(app.getHttpServer())
        .post(`${base()}/plotlines`)
        .set("Authorization", authHeader)
        .send({ name: "Temp Plot" });

      await request(app.getHttpServer())
        .delete(`${base()}/plotlines/temp-plot`)
        .set("Authorization", authHeader)
        .expect(204);
    });
  });

  // -------------------------------------------------------------------------
  // Works → Chapters → Scenes (hierarchical)
  // -------------------------------------------------------------------------

  describe("Works / Chapters / Scenes", () => {
    it("creates a work", async () => {
      const res = await request(app.getHttpServer())
        .post(`${base()}/works`)
        .set("Authorization", authHeader)
        .send({
          title: "The Fellowship of the Ring",
          chronologicalOrder: 1,
          releaseOrder: 1,
        })
        .expect(201);

      expect(res.body).toMatchObject({
        title: "The Fellowship of the Ring",
        slug: "the-fellowship-of-the-ring",
      });
    });

    it("creates a full work → chapter → scene hierarchy", async () => {
      // Create work
      const work = await request(app.getHttpServer())
        .post(`${base()}/works`)
        .set("Authorization", authHeader)
        .send({
          title: "Book One",
          chronologicalOrder: 1,
          releaseOrder: 1,
        });

      // Create chapter
      const chapter = await request(app.getHttpServer())
        .post(`${base()}/works/${work.body.slug}/chapters`)
        .set("Authorization", authHeader)
        .send({ title: "Chapter 1", sequenceNumber: 1 })
        .expect(201);

      expect(chapter.body.title).toBe("Chapter 1");

      // Create scene
      const scene = await request(app.getHttpServer())
        .post(`${base()}/scenes`)
        .set("Authorization", authHeader)
        .send({
          chapterId: chapter.body.id,
          sequenceNumber: 1,
          title: "Opening Scene",
          description: "The story begins",
        })
        .expect(201);

      expect(scene.body.title).toBe("Opening Scene");

      // Verify the hierarchy via GET work
      const fullWork = await request(app.getHttpServer())
        .get(`${base()}/works/${work.body.slug}`)
        .set("Authorization", authHeader)
        .expect(200);

      expect(fullWork.body.chapters).toHaveLength(1);
      expect(fullWork.body.chapters[0]._count.scenes).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // Plot Points
  // -------------------------------------------------------------------------

  describe("Plot Points", () => {
    it("creates a plot point on a plotline", async () => {
      await request(app.getHttpServer())
        .post(`${base()}/plotlines`)
        .set("Authorization", authHeader)
        .send({ name: "Main Arc" });

      const res = await request(app.getHttpServer())
        .post(`${base()}/plotlines/main-arc/points`)
        .set("Authorization", authHeader)
        .send({ title: "Inciting Incident", sequenceNumber: 1 })
        .expect(201);

      expect(res.body.title).toBe("Inciting Incident");
    });
  });
});
