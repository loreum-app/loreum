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

    it("gives the same name in two different types distinct slugs", async () => {
      const character = await request(app.getHttpServer())
        .post(base())
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .send({ type: "CHARACTER", name: "Rivendell" })
        .expect(201);

      const location = await request(app.getHttpServer())
        .post(base())
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .send({ type: "LOCATION", name: "Rivendell" })
        .expect(201);

      expect(character.body.slug).toBe("rivendell");
      expect(location.body.slug).toBe("rivendell-1");
    });
  });

  // -------------------------------------------------------------------------
  // FILTERING BY CUSTOM ITEM TYPE
  // -------------------------------------------------------------------------

  describe("GET (list) ?itemType", () => {
    const createType = async (name: string) => {
      const res = await request(app.getHttpServer())
        .post(`/v1/projects/${projectSlug}/entity-types`)
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .send({ name })
        .expect(201);
      return res.body as { id: string; slug: string };
    };

    const createEntity = (body: Record<string, unknown>) =>
      request(app.getHttpServer())
        .post(base())
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .send(body)
        .expect(201);

    const names = async (query: string) => {
      const res = await request(app.getHttpServer())
        .get(`${base()}${query}`)
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .expect(200);
      return (res.body as { name: string }[]).map((e) => e.name).sort();
    };

    beforeEach(async () => {
      const weapons = await createType("Weapons");
      await createEntity({
        type: "ITEM",
        name: "Sting",
        item: { itemTypeId: weapons.id },
      });
      await createEntity({ type: "ITEM", name: "Loose Pebble" });
      await createEntity({ type: "CHARACTER", name: "Bilbo" });
    });

    it("returns only the items of one custom type", async () => {
      expect(await names("?type=ITEM&itemType=weapons")).toEqual(["Sting"]);
    });

    it("returns only items with no custom type when asked for none", async () => {
      expect(await names("?type=ITEM&itemType=none")).toEqual(["Loose Pebble"]);
    });

    it("returns every item when no custom type is given", async () => {
      expect(await names("?type=ITEM")).toEqual(["Loose Pebble", "Sting"]);
    });
  });

  // -------------------------------------------------------------------------
  // NAME UNIQUENESS (per project + type + custom item type)
  // -------------------------------------------------------------------------

  describe("name uniqueness", () => {
    const createType = async (name: string) => {
      const res = await request(app.getHttpServer())
        .post(`/v1/projects/${projectSlug}/entity-types`)
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .send({ name })
        .expect(201);
      return res.body.id as string;
    };

    const createEntity = (body: Record<string, unknown>) =>
      request(app.getHttpServer())
        .post(base())
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .send(body);

    it("refuses a second character with the same name", async () => {
      await createEntity({ type: "CHARACTER", name: "Guard" }).expect(201);

      const res = await createEntity({
        type: "CHARACTER",
        name: "Guard",
      }).expect(409);

      expect(res.body.message).toMatch(/already/i);
    });

    it("compares names case-insensitively and ignoring surrounding space", async () => {
      await createEntity({ type: "CHARACTER", name: "Guard" }).expect(201);
      await createEntity({ type: "CHARACTER", name: "  guard " }).expect(409);
    });

    it("allows the same name under a different built-in type", async () => {
      await createEntity({ type: "CHARACTER", name: "Guard" }).expect(201);
      await createEntity({ type: "LOCATION", name: "Guard" }).expect(201);
    });

    it("allows the same name under two different custom item types", async () => {
      const weapons = await createType("Weapons");
      const relics = await createType("Relics");

      await createEntity({
        type: "ITEM",
        name: "Excalibur",
        item: { itemTypeId: weapons },
      }).expect(201);
      await createEntity({
        type: "ITEM",
        name: "Excalibur",
        item: { itemTypeId: relics },
      }).expect(201);
    });

    it("refuses a duplicate name within the same custom item type", async () => {
      const weapons = await createType("Weapons");

      await createEntity({
        type: "ITEM",
        name: "Excalibur",
        item: { itemTypeId: weapons },
      }).expect(201);
      await createEntity({
        type: "ITEM",
        name: "Excalibur",
        item: { itemTypeId: weapons },
      }).expect(409);
    });

    it("treats untyped items as their own group", async () => {
      const weapons = await createType("Weapons");

      await createEntity({ type: "ITEM", name: "Oddment" }).expect(201);
      // A typed item may reuse the name...
      await createEntity({
        type: "ITEM",
        name: "Oddment",
        item: { itemTypeId: weapons },
      }).expect(201);
      // ...but a second untyped one may not.
      await createEntity({ type: "ITEM", name: "Oddment" }).expect(409);
    });

    it("refuses a rename onto a name already used in the same type", async () => {
      await createEntity({ type: "CHARACTER", name: "Frodo" }).expect(201);
      await createEntity({ type: "CHARACTER", name: "Sam" }).expect(201);

      await request(app.getHttpServer())
        .patch(`${base()}/sam`)
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .send({ name: "Frodo" })
        .expect(409);
    });

    it("allows saving an entity under its own existing name", async () => {
      await createEntity({ type: "CHARACTER", name: "Frodo" }).expect(201);

      await request(app.getHttpServer())
        .patch(`${base()}/frodo`)
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .send({ name: "Frodo", summary: "Ring-bearer" })
        .expect(200);
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
