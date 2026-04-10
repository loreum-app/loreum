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

describe("Lore (integration)", () => {
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
      .send({ name: "Lore World" });
    projectSlug = proj.body.slug;
  });

  const base = () => `/api/v1/projects/${projectSlug}/lore`;

  it("creates a lore article", async () => {
    const res = await request(app.getHttpServer())
      .post(base())
      .set("Authorization", authHeader)
      .send({
        title: "The One Ring",
        content: "Forged by Sauron in the fires of Mount Doom.",
        category: "artifacts",
      })
      .expect(201);

    expect(res.body).toMatchObject({
      title: "The One Ring",
      slug: "the-one-ring",
      category: "artifacts",
    });
  });

  it("lists lore articles", async () => {
    await request(app.getHttpServer())
      .post(base())
      .set("Authorization", authHeader)
      .send({ title: "Article A", content: "Content A" });
    await request(app.getHttpServer())
      .post(base())
      .set("Authorization", authHeader)
      .send({ title: "Article B", content: "Content B" });

    const res = await request(app.getHttpServer())
      .get(base())
      .set("Authorization", authHeader)
      .expect(200);

    expect(res.body).toHaveLength(2);
  });

  it("gets a lore article by slug", async () => {
    await request(app.getHttpServer())
      .post(base())
      .set("Authorization", authHeader)
      .send({ title: "History of Gondor", content: "Long ago..." });

    const res = await request(app.getHttpServer())
      .get(`${base()}/history-of-gondor`)
      .set("Authorization", authHeader)
      .expect(200);

    expect(res.body.title).toBe("History of Gondor");
  });

  it("updates a lore article", async () => {
    await request(app.getHttpServer())
      .post(base())
      .set("Authorization", authHeader)
      .send({ title: "Draft Article", content: "v1" });

    const res = await request(app.getHttpServer())
      .patch(`${base()}/draft-article`)
      .set("Authorization", authHeader)
      .send({ content: "v2 revised" })
      .expect(200);

    expect(res.body.content).toBe("v2 revised");
  });

  it("deletes a lore article", async () => {
    await request(app.getHttpServer())
      .post(base())
      .set("Authorization", authHeader)
      .send({ title: "Temp", content: "delete me" });

    await request(app.getHttpServer())
      .delete(`${base()}/temp`)
      .set("Authorization", authHeader)
      .expect(204);

    await request(app.getHttpServer())
      .get(`${base()}/temp`)
      .set("Authorization", authHeader)
      .expect(404);
  });
});
