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
    it("removes the type but keeps its entities, now detached from any type", async () => {
      const weapons = await createType({ name: "Weapons" });
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

      const entities = await authed(
        request(app.getHttpServer()).get(
          `/v1/projects/${projectSlug}/entities?type=ITEM`,
        ),
      ).expect(200);

      const sting = entities.body.find(
        (e: { name: string }) => e.name === "Sting",
      );
      expect(sting).toBeDefined();
      expect(sting.item.itemTypeId).toBeNull();
    });
  });
});
