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

describe("Entities (integration)", () => {
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

    // Create a project for entity tests
    const res = await request(app.getHttpServer())
      .post("/v1/projects")
      .set("Cookie", authCookie)
      .set("x-csrf-token", csrfToken)
      .send({ name: "Test World" });
    projectSlug = res.body.slug;
  });

  const base = () => `/v1/projects/${projectSlug}/entities`;

  // -------------------------------------------------------------------------
  // CREATE
  // -------------------------------------------------------------------------

  describe("POST", () => {
    it("creates a CHARACTER entity", async () => {
      const res = await request(app.getHttpServer())
        .post(base())
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .send({
          type: "CHARACTER",
          name: "Gandalf",
          summary: "A wizard",
          character: { species: "Maia", role: "Wizard" },
        })
        .expect(201);

      expect(res.body).toMatchObject({
        name: "Gandalf",
        slug: "gandalf",
        type: "CHARACTER",
        summary: "A wizard",
      });
      expect(res.body.character).toMatchObject({
        species: "Maia",
        role: "Wizard",
      });
    });

    it("creates a LOCATION entity", async () => {
      const res = await request(app.getHttpServer())
        .post(base())
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .send({
          type: "LOCATION",
          name: "The Shire",
          location: { region: "Eriador" },
        })
        .expect(201);

      expect(res.body.type).toBe("LOCATION");
      expect(res.body.location.region).toBe("Eriador");
    });

    it("creates an ORGANIZATION entity", async () => {
      const res = await request(app.getHttpServer())
        .post(base())
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .send({
          type: "ORGANIZATION",
          name: "The Fellowship",
          organization: { ideology: "Destroy the Ring" },
        })
        .expect(201);

      expect(res.body.organization.ideology).toBe("Destroy the Ring");
    });

    it("rejects invalid entity type", async () => {
      await request(app.getHttpServer())
        .post(base())
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .send({ type: "INVALID", name: "Bad Type" })
        .expect(400);
    });

    it("rejects missing name", async () => {
      await request(app.getHttpServer())
        .post(base())
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .send({ type: "CHARACTER" })
        .expect(400);
    });

    it("generates unique slugs for duplicate names", async () => {
      await request(app.getHttpServer())
        .post(base())
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .send({ type: "CHARACTER", name: "Aragorn" });

      const res = await request(app.getHttpServer())
        .post(base())
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .send({ type: "CHARACTER", name: "Aragorn" })
        .expect(201);

      expect(res.body.slug).toBe("aragorn-1");
    });
  });

  // -------------------------------------------------------------------------
  // READ
  // -------------------------------------------------------------------------

  describe("GET (list)", () => {
    it("lists all entities in a project", async () => {
      await request(app.getHttpServer())
        .post(base())
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .send({ type: "CHARACTER", name: "Frodo" });
      await request(app.getHttpServer())
        .post(base())
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .send({ type: "LOCATION", name: "Mordor" });

      const res = await request(app.getHttpServer())
        .get(base())
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .expect(200);

      expect(res.body).toHaveLength(2);
    });

    it("filters by type", async () => {
      await request(app.getHttpServer())
        .post(base())
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .send({ type: "CHARACTER", name: "Sam" });
      await request(app.getHttpServer())
        .post(base())
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .send({ type: "LOCATION", name: "Rivendell" });

      const res = await request(app.getHttpServer())
        .get(base())
        .query({ type: "CHARACTER" })
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe("Sam");
    });

    it("searches by name", async () => {
      await request(app.getHttpServer())
        .post(base())
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .send({ type: "CHARACTER", name: "Legolas" });
      await request(app.getHttpServer())
        .post(base())
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .send({ type: "CHARACTER", name: "Gimli" });

      const res = await request(app.getHttpServer())
        .get(base())
        .query({ q: "leg" })
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe("Legolas");
    });
  });

  describe("GET (single)", () => {
    it("returns entity with hub data", async () => {
      await request(app.getHttpServer())
        .post(base())
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .send({ type: "CHARACTER", name: "Boromir" });

      const res = await request(app.getHttpServer())
        .get(`${base()}/boromir`)
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .expect(200);

      expect(res.body.name).toBe("Boromir");
      // Hub includes should be present (even if empty)
      expect(res.body).toHaveProperty("sourceRelationships");
      expect(res.body).toHaveProperty("targetRelationships");
      expect(res.body).toHaveProperty("entityTags");
    });

    it("returns 404 for non-existent entity", async () => {
      await request(app.getHttpServer())
        .get(`${base()}/nope`)
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .expect(404);
    });
  });

  // -------------------------------------------------------------------------
  // UPDATE
  // -------------------------------------------------------------------------

  describe("PATCH", () => {
    it("updates entity fields", async () => {
      await request(app.getHttpServer())
        .post(base())
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .send({ type: "CHARACTER", name: "Pippin", summary: "A hobbit" });

      const res = await request(app.getHttpServer())
        .patch(`${base()}/pippin`)
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .send({ summary: "A Took", description: "Peregrin Took" })
        .expect(200);

      expect(res.body.summary).toBe("A Took");
      expect(res.body.description).toBe("Peregrin Took");
    });

    it("regenerates slug when name changes", async () => {
      await request(app.getHttpServer())
        .post(base())
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .send({ type: "CHARACTER", name: "Strider" });

      const res = await request(app.getHttpServer())
        .patch(`${base()}/strider`)
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .send({ name: "Aragorn" })
        .expect(200);

      expect(res.body.slug).toBe("aragorn");
    });

    it("upserts extension fields", async () => {
      await request(app.getHttpServer())
        .post(base())
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .send({ type: "CHARACTER", name: "Elrond" });

      const res = await request(app.getHttpServer())
        .patch(`${base()}/elrond`)
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .send({ character: { species: "Elf", role: "Lord of Rivendell" } })
        .expect(200);

      expect(res.body.character.species).toBe("Elf");
    });
  });

  // -------------------------------------------------------------------------
  // DELETE
  // -------------------------------------------------------------------------

  describe("DELETE", () => {
    it("deletes an entity", async () => {
      await request(app.getHttpServer())
        .post(base())
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .send({ type: "CHARACTER", name: "Saruman" });

      await request(app.getHttpServer())
        .delete(`${base()}/saruman`)
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .expect(204);

      await request(app.getHttpServer())
        .get(`${base()}/saruman`)
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .expect(404);
    });
  });
});
