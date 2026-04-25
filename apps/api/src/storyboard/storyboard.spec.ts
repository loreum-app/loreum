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
  let authCookie: string;
  let csrfToken: string;
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
    authCookie = auth.cookie;
    csrfToken = auth.csrfToken;

    const proj = await request(app.getHttpServer())
      .post("/v1/projects")
      .set("Cookie", authCookie)
      .set("x-csrf-token", csrfToken)
      .send({ name: "Story World" });
    projectSlug = proj.body.slug;
  });

  const base = () => `/v1/projects/${projectSlug}/storyboard`;

  // -------------------------------------------------------------------------
  // Plotlines
  // -------------------------------------------------------------------------

  describe("Plotlines", () => {
    it("creates a plotline", async () => {
      const res = await request(app.getHttpServer())
        .post(`${base()}/plotlines`)
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
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
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .send({ name: "Plotline A" });
      await request(app.getHttpServer())
        .post(`${base()}/plotlines`)
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .send({ name: "Plotline B" });

      const res = await request(app.getHttpServer())
        .get(`${base()}/plotlines`)
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .expect(200);

      expect(res.body).toHaveLength(2);
    });

    it("deletes a plotline", async () => {
      await request(app.getHttpServer())
        .post(`${base()}/plotlines`)
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .send({ name: "Temp Plot" });

      await request(app.getHttpServer())
        .delete(`${base()}/plotlines/temp-plot`)
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
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
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
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
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .send({
          title: "Book One",
          chronologicalOrder: 1,
          releaseOrder: 1,
        });

      // Create chapter
      const chapter = await request(app.getHttpServer())
        .post(`${base()}/works/${work.body.slug}/chapters`)
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .send({ title: "Chapter 1", sequenceNumber: 1 })
        .expect(201);

      expect(chapter.body.title).toBe("Chapter 1");

      // Create scene
      const scene = await request(app.getHttpServer())
        .post(`${base()}/scenes`)
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
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
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
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
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .send({ name: "Main Arc" });

      const res = await request(app.getHttpServer())
        .post(`${base()}/plotlines/main-arc/points`)
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .send({ title: "Inciting Incident", sequenceNumber: 1 })
        .expect(201);

      expect(res.body.title).toBe("Inciting Incident");
    });
  });
});
