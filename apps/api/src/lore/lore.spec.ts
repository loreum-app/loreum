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
      .send({ name: "Lore World" });
    projectSlug = proj.body.slug;
  });

  const base = () => `/v1/projects/${projectSlug}/lore`;

  it("creates a lore article", async () => {
    const res = await request(app.getHttpServer())
      .post(base())
      .set("Cookie", authCookie)
      .set("x-csrf-token", csrfToken)
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
      .set("Cookie", authCookie)
      .set("x-csrf-token", csrfToken)
      .send({ title: "Article A", content: "Content A" });
    await request(app.getHttpServer())
      .post(base())
      .set("Cookie", authCookie)
      .set("x-csrf-token", csrfToken)
      .send({ title: "Article B", content: "Content B" });

    const res = await request(app.getHttpServer())
      .get(base())
      .set("Cookie", authCookie)
      .set("x-csrf-token", csrfToken)
      .expect(200);

    expect(res.body).toHaveLength(2);
  });

  it("gets a lore article by slug", async () => {
    await request(app.getHttpServer())
      .post(base())
      .set("Cookie", authCookie)
      .set("x-csrf-token", csrfToken)
      .send({ title: "History of Gondor", content: "Long ago..." });

    const res = await request(app.getHttpServer())
      .get(`${base()}/history-of-gondor`)
      .set("Cookie", authCookie)
      .set("x-csrf-token", csrfToken)
      .expect(200);

    expect(res.body.title).toBe("History of Gondor");
  });

  it("updates a lore article", async () => {
    await request(app.getHttpServer())
      .post(base())
      .set("Cookie", authCookie)
      .set("x-csrf-token", csrfToken)
      .send({ title: "Draft Article", content: "v1" });

    const res = await request(app.getHttpServer())
      .patch(`${base()}/draft-article`)
      .set("Cookie", authCookie)
      .set("x-csrf-token", csrfToken)
      .send({ content: "v2 revised" })
      .expect(200);

    expect(res.body.content).toBe("v2 revised");
  });

  it("deletes a lore article", async () => {
    await request(app.getHttpServer())
      .post(base())
      .set("Cookie", authCookie)
      .set("x-csrf-token", csrfToken)
      .send({ title: "Temp", content: "delete me" });

    await request(app.getHttpServer())
      .delete(`${base()}/temp`)
      .set("Cookie", authCookie)
      .set("x-csrf-token", csrfToken)
      .expect(204);

    await request(app.getHttpServer())
      .get(`${base()}/temp`)
      .set("Cookie", authCookie)
      .set("x-csrf-token", csrfToken)
      .expect(404);
  });
});
