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

describe("Relationships (integration)", () => {
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
      .send({ name: "Rel World" });
    projectSlug = proj.body.slug;

    // Create two entities to relate
    await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectSlug}/entities`)
      .set("Authorization", authHeader)
      .send({ type: "CHARACTER", name: "Gandalf" });
    await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectSlug}/entities`)
      .set("Authorization", authHeader)
      .send({ type: "CHARACTER", name: "Frodo" });
  });

  const base = () => `/api/v1/projects/${projectSlug}/relationships`;

  it("creates a relationship between entities", async () => {
    const res = await request(app.getHttpServer())
      .post(base())
      .set("Authorization", authHeader)
      .send({
        sourceEntitySlug: "gandalf",
        targetEntitySlug: "frodo",
        label: "Mentor",
        description: "Guides Frodo",
      })
      .expect(201);

    expect(res.body).toMatchObject({ label: "Mentor" });
    expect(res.body.id).toBeDefined();
  });

  it("lists relationships for a project", async () => {
    await request(app.getHttpServer())
      .post(base())
      .set("Authorization", authHeader)
      .send({
        sourceEntitySlug: "gandalf",
        targetEntitySlug: "frodo",
        label: "Mentor",
      });

    const res = await request(app.getHttpServer())
      .get(base())
      .set("Authorization", authHeader)
      .expect(200);

    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it("deletes a relationship", async () => {
    const created = await request(app.getHttpServer())
      .post(base())
      .set("Authorization", authHeader)
      .send({
        sourceEntitySlug: "gandalf",
        targetEntitySlug: "frodo",
        label: "Mentor",
      });

    await request(app.getHttpServer())
      .delete(`${base()}/${created.body.id}`)
      .set("Authorization", authHeader)
      .expect(204);
  });
});
