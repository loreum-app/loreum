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

describe("Timeline (integration)", () => {
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
      .send({ name: "Timeline World" });
    projectSlug = proj.body.slug;
  });

  // -------------------------------------------------------------------------
  // Events
  // -------------------------------------------------------------------------

  const eventsBase = () => `/v1/projects/${projectSlug}/timeline`;

  it("creates a timeline event", async () => {
    const res = await request(app.getHttpServer())
      .post(eventsBase())
      .set("Cookie", authCookie)
      .set("x-csrf-token", csrfToken)
      .send({
        name: "Battle of Helm's Deep",
        date: "TA 3019-03-03",
        sortOrder: 1,
        significance: "critical",
      })
      .expect(201);

    expect(res.body).toMatchObject({
      name: "Battle of Helm's Deep",
      significance: "critical",
    });
  });

  it("lists timeline events", async () => {
    await request(app.getHttpServer())
      .post(eventsBase())
      .set("Cookie", authCookie)
      .set("x-csrf-token", csrfToken)
      .send({ name: "Event A", date: "1000", sortOrder: 1 });
    await request(app.getHttpServer())
      .post(eventsBase())
      .set("Cookie", authCookie)
      .set("x-csrf-token", csrfToken)
      .send({ name: "Event B", date: "2000", sortOrder: 2 });

    const res = await request(app.getHttpServer())
      .get(eventsBase())
      .set("Cookie", authCookie)
      .set("x-csrf-token", csrfToken)
      .expect(200);

    expect(res.body).toHaveLength(2);
  });

  it("deletes a timeline event", async () => {
    const created = await request(app.getHttpServer())
      .post(eventsBase())
      .set("Cookie", authCookie)
      .set("x-csrf-token", csrfToken)
      .send({ name: "Temp Event", date: "500", sortOrder: 1 });

    await request(app.getHttpServer())
      .delete(`${eventsBase()}/${created.body.id}`)
      .set("Cookie", authCookie)
      .set("x-csrf-token", csrfToken)
      .expect(204);
  });

  // -------------------------------------------------------------------------
  // Eras
  // -------------------------------------------------------------------------

  const erasBase = () => `/v1/projects/${projectSlug}/timeline/eras`;

  it("creates an era", async () => {
    const res = await request(app.getHttpServer())
      .post(erasBase())
      .set("Cookie", authCookie)
      .set("x-csrf-token", csrfToken)
      .send({
        name: "The Third Age",
        startDate: 1,
        endDate: 3021,
        color: "#3b82f6",
      })
      .expect(201);

    expect(res.body).toMatchObject({
      name: "The Third Age",
      slug: "the-third-age",
    });
  });

  it("lists eras", async () => {
    await request(app.getHttpServer())
      .post(erasBase())
      .set("Cookie", authCookie)
      .set("x-csrf-token", csrfToken)
      .send({ name: "First Age", startDate: 0, endDate: 500 });
    await request(app.getHttpServer())
      .post(erasBase())
      .set("Cookie", authCookie)
      .set("x-csrf-token", csrfToken)
      .send({ name: "Second Age", startDate: 500, endDate: 3441 });

    const res = await request(app.getHttpServer())
      .get(erasBase())
      .set("Cookie", authCookie)
      .set("x-csrf-token", csrfToken)
      .expect(200);

    expect(res.body).toHaveLength(2);
  });

  it("deletes an era", async () => {
    await request(app.getHttpServer())
      .post(erasBase())
      .set("Cookie", authCookie)
      .set("x-csrf-token", csrfToken)
      .send({ name: "Delete Me", startDate: 0, endDate: 1 });

    await request(app.getHttpServer())
      .delete(`${erasBase()}/delete-me`)
      .set("Cookie", authCookie)
      .set("x-csrf-token", csrfToken)
      .expect(204);
  });
});
