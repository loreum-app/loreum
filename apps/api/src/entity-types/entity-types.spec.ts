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

describe("Entity types (integration)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let module: TestingModule;
  let authCookie: string;
  let csrfToken: string;
  let projectSlug: string;

  const authed = (req: request.Test) =>
    req.set("Cookie", authCookie).set("x-csrf-token", csrfToken);

  const createType = (body: Record<string, unknown>) =>
    authed(
      request(app.getHttpServer()).post(
        `/v1/projects/${projectSlug}/entity-types`,
      ),
    ).send(body);

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

    const project = await authed(
      request(app.getHttpServer()).post("/v1/projects"),
    ).send({ name: "Type World" });
    projectSlug = project.body.slug;
  });

  describe("POST /v1/projects/:slug/entity-types", () => {
    it("creates a type with its description and a slug from the name", async () => {
      const res = await createType({
        name: "Ancient Relics",
        description: "Artifacts from before the Sundering.",
        color: "#aa5500",
      }).expect(201);

      expect(res.body).toMatchObject({
        name: "Ancient Relics",
        slug: "ancient-relics",
        description: "Artifacts from before the Sundering.",
        icon: null,
        color: "#aa5500",
      });
    });

    it("rejects a description longer than 500 characters", async () => {
      await createType({
        name: "Relics",
        description: "x".repeat(501),
      }).expect(400);
    });
  });

  describe("GET /v1/projects/:slug/entity-types", () => {
    it("lists types alphabetically with how many entities use each", async () => {
      const weapons = await createType({ name: "Weapons" });
      await createType({ name: "Armor" });

      await authed(
        request(app.getHttpServer()).post(
          `/v1/projects/${projectSlug}/entities`,
        ),
      )
        .send({
          type: "ITEM",
          name: "Sting",
          item: { itemTypeId: weapons.body.id },
        })
        .expect(201);

      const res = await authed(
        request(app.getHttpServer()).get(
          `/v1/projects/${projectSlug}/entity-types`,
        ),
      ).expect(200);

      expect(
        res.body.map((t: { name: string; _count: { items: number } }) => [
          t.name,
          t._count.items,
        ]),
      ).toEqual([
        ["Armor", 0],
        ["Weapons", 1],
      ]);
    });
  });

  describe("PATCH /v1/projects/:slug/entity-types/:typeSlug", () => {
    it("renames a type and moves it to a slug derived from the new name", async () => {
      await createType({ name: "Wepons" });

      const res = await authed(
        request(app.getHttpServer()).patch(
          `/v1/projects/${projectSlug}/entity-types/wepons`,
        ),
      )
        .send({ name: "Weapons" })
        .expect(200);

      expect(res.body).toMatchObject({ name: "Weapons", slug: "weapons" });

      await authed(
        request(app.getHttpServer()).get(
          `/v1/projects/${projectSlug}/entity-types/wepons`,
        ),
      ).expect(404);
    });

    it("updates the description without changing the slug", async () => {
      await createType({ name: "Weapons" });

      const res = await authed(
        request(app.getHttpServer()).patch(
          `/v1/projects/${projectSlug}/entity-types/weapons`,
        ),
      )
        .send({ description: "Things that cut, crush, or pierce." })
        .expect(200);

      expect(res.body).toMatchObject({
        slug: "weapons",
        description: "Things that cut, crush, or pierce.",
      });
    });

    it("clears the description to null when an empty string is sent", async () => {
      await createType({ name: "Weapons", description: "Sharp things." });

      const res = await authed(
        request(app.getHttpServer()).patch(
          `/v1/projects/${projectSlug}/entity-types/weapons`,
        ),
      )
        .send({ description: "" })
        .expect(200);

      expect(res.body.description).toBeNull();
    });

    it("returns 404 for a type that does not exist", async () => {
      await authed(
        request(app.getHttpServer()).patch(
          `/v1/projects/${projectSlug}/entity-types/nope`,
        ),
      )
        .send({ name: "Anything" })
        .expect(404);
    });
  });

  describe("DELETE /v1/projects/:slug/entity-types/:typeSlug", () => {
    const addItem = (name: string, itemTypeId: string) =>
      authed(
        request(app.getHttpServer()).post(
          `/v1/projects/${projectSlug}/entities`,
        ),
      )
        .send({ type: "ITEM", name, item: { itemTypeId } })
        .expect(201);

    const listItems = async () => {
      const res = await authed(
        request(app.getHttpServer()).get(
          `/v1/projects/${projectSlug}/entities?type=ITEM`,
        ),
      ).expect(200);
      return res.body as {
        name: string;
        item: { itemTypeId: string | null };
      }[];
    };

    it("deletes a type that has no entities", async () => {
      await createType({ name: "Weapons" });

      await authed(
        request(app.getHttpServer()).delete(
          `/v1/projects/${projectSlug}/entity-types/weapons`,
        ),
      ).expect(204);

      await authed(
        request(app.getHttpServer()).get(
          `/v1/projects/${projectSlug}/entity-types/weapons`,
        ),
      ).expect(404);
    });

    it("refuses to delete a type that still has entities when no disposition is given", async () => {
      const weapons = await createType({ name: "Weapons" });
      await addItem("Sting", weapons.body.id);

      const res = await authed(
        request(app.getHttpServer()).delete(
          `/v1/projects/${projectSlug}/entity-types/weapons`,
        ),
      ).expect(409);

      expect(res.body.message).toMatch(/1 entity/i);

      // The type and its entity both survive the refusal.
      await authed(
        request(app.getHttpServer()).get(
          `/v1/projects/${projectSlug}/entity-types/weapons`,
        ),
      ).expect(200);
      expect((await listItems()).map((e) => e.name)).toEqual(["Sting"]);
    });

    it("moves the entities to another type when asked", async () => {
      const weapons = await createType({ name: "Weapons" });
      const relics = await createType({ name: "Relics" });
      await addItem("Sting", weapons.body.id);

      await authed(
        request(app.getHttpServer()).delete(
          `/v1/projects/${projectSlug}/entity-types/weapons?entities=move&to=relics`,
        ),
      ).expect(204);

      const items = await listItems();
      expect(items.map((e) => e.name)).toEqual(["Sting"]);
      expect(items[0]!.item.itemTypeId).toBe(relics.body.id);
    });

    it("deletes the entities along with the type when asked", async () => {
      const weapons = await createType({ name: "Weapons" });
      await addItem("Sting", weapons.body.id);
      await addItem("Glamdring", weapons.body.id);

      await authed(
        request(app.getHttpServer()).delete(
          `/v1/projects/${projectSlug}/entity-types/weapons?entities=delete`,
        ),
      ).expect(204);

      expect(await listItems()).toEqual([]);
    });

    it("rejects a move to a type that does not exist, changing nothing", async () => {
      const weapons = await createType({ name: "Weapons" });
      await addItem("Sting", weapons.body.id);

      await authed(
        request(app.getHttpServer()).delete(
          `/v1/projects/${projectSlug}/entity-types/weapons?entities=move&to=nowhere`,
        ),
      ).expect(404);

      await authed(
        request(app.getHttpServer()).get(
          `/v1/projects/${projectSlug}/entity-types/weapons`,
        ),
      ).expect(200);
      expect((await listItems()).map((e) => e.name)).toEqual(["Sting"]);
    });

    it("rejects a move onto the type being deleted", async () => {
      const weapons = await createType({ name: "Weapons" });
      await addItem("Sting", weapons.body.id);

      await authed(
        request(app.getHttpServer()).delete(
          `/v1/projects/${projectSlug}/entity-types/weapons?entities=move&to=weapons`,
        ),
      ).expect(400);
    });
  });

  describe("GET /v1/projects/:slug/entity-types/:typeSlug/deletion-impact", () => {
    it("counts the entities and the links that a cascade delete would remove", async () => {
      const weapons = await createType({ name: "Weapons" });
      const sting = await authed(
        request(app.getHttpServer()).post(
          `/v1/projects/${projectSlug}/entities`,
        ),
      )
        .send({
          type: "ITEM",
          name: "Sting",
          item: { itemTypeId: weapons.body.id },
          tags: ["elvish"],
        })
        .expect(201);
      const frodo = await authed(
        request(app.getHttpServer()).post(
          `/v1/projects/${projectSlug}/entities`,
        ),
      )
        .send({ type: "CHARACTER", name: "Frodo" })
        .expect(201);

      await authed(
        request(app.getHttpServer()).post(
          `/v1/projects/${projectSlug}/relationships`,
        ),
      )
        .send({
          sourceEntitySlug: frodo.body.slug,
          targetEntitySlug: sting.body.slug,
          label: "carries",
        })
        .expect(201);

      const res = await authed(
        request(app.getHttpServer()).get(
          `/v1/projects/${projectSlug}/entity-types/weapons/deletion-impact`,
        ),
      ).expect(200);

      expect(res.body).toEqual({
        entities: 1,
        relationships: 1,
        timelineEventLinks: 0,
        loreArticleLinks: 0,
        sceneAppearances: 0,
        tagLinks: 1,
      });
    });

    it("reports all zeros for a type with no entities", async () => {
      await createType({ name: "Weapons" });

      const res = await authed(
        request(app.getHttpServer()).get(
          `/v1/projects/${projectSlug}/entity-types/weapons/deletion-impact`,
        ),
      ).expect(200);

      expect(res.body).toEqual({
        entities: 0,
        relationships: 0,
        timelineEventLinks: 0,
        loreArticleLinks: 0,
        sceneAppearances: 0,
        tagLinks: 0,
      });
    });
  });
});
