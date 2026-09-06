import { INestApplication } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import request from "supertest";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  createTestApp,
  createAuthenticatedUser,
  cleanDatabase,
} from "../test/helpers";
import { TestMcpClient } from "../test/mcp-client";
import { PrismaService } from "../prisma/prisma.service";
import { ProjectsService } from "../projects/projects.service";
import { ApiKeysService } from "../api-keys/api-keys.service";

const WRITE_TOOLS = [
  "create_entity",
  "update_entity",
  "delete_entity",
  "create_relationship",
  "update_relationship",
  "delete_relationship",
  "create_lore_article",
  "update_lore_article",
  "delete_lore_article",
  "create_timeline_event",
  "update_timeline_event",
  "delete_timeline_event",
  "create_era",
  "create_plotline",
  "create_plot_point",
  "update_plot_point",
  "create_work",
  "create_chapter",
  "create_scene",
  "update_scene",
];

const READ_TOOLS = [
  "get_project",
  "search_project",
  "get_entity_types",
  "list_tags",
  "list_entities",
  "get_entity",
  "list_relationships",
  "list_lore_articles",
  "get_lore_article",
  "get_timeline",
  "get_timeline_event",
  "list_eras",
  "get_storyboard",
  "get_plotline",
  "get_work",
  "list_scenes",
];

describe("MCP endpoint (integration)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let module: TestingModule;
  let projectSlug: string;
  let otherProjectSlug: string;
  let readWriteKey: string;
  let readOnlyKey: string;
  let otherProjectKey: string;
  let rw: TestMcpClient;
  let ro: TestMcpClient;

  beforeAll(async () => {
    ({ app, prisma, module } = await createTestApp());
    await cleanDatabase(prisma);

    const { user } = await createAuthenticatedUser(prisma, module, {
      email: "mcp-test@example.com",
    });
    const projectsService = module.get(ProjectsService);
    const apiKeysService = module.get(ApiKeysService);

    const project = await projectsService.create(user.id, {
      name: "MCP Test World",
    });
    projectSlug = project.slug;
    const other = await projectsService.create(user.id, {
      name: "Other World",
    });
    otherProjectSlug = other.slug;

    readWriteKey = (
      await apiKeysService.create(project.id, user.id, {
        name: "rw",
        permissions: "READ_WRITE",
      })
    ).key;
    readOnlyKey = (
      await apiKeysService.create(project.id, user.id, {
        name: "ro",
        permissions: "READ_ONLY",
      })
    ).key;
    otherProjectKey = (
      await apiKeysService.create(other.id, user.id, {
        name: "other",
        permissions: "READ_WRITE",
      })
    ).key;

    rw = new TestMcpClient(app, `/v1/mcp/${projectSlug}`, readWriteKey);
    ro = new TestMcpClient(app, `/v1/mcp/${projectSlug}`, readOnlyKey);
  });

  afterAll(async () => {
    await app.close();
  });

  // ---------------------------------------------------------------------------
  // Authentication & audience binding
  // ---------------------------------------------------------------------------

  describe("authentication", () => {
    it("answers unauthenticated requests with 401 + protected resource metadata pointer", async () => {
      const anon = new TestMcpClient(app, `/v1/mcp/${projectSlug}`, null);
      const { status, headers } = await anon.rpc("tools/list");
      expect(status).toBe(401);
      expect(headers["www-authenticate"]).toContain("Bearer");
      expect(headers["www-authenticate"]).toContain(
        `resource_metadata="http://localhost:3021/.well-known/oauth-protected-resource/v1/mcp/${projectSlug}"`,
      );
    });

    it("rejects an unknown bearer token", async () => {
      const bad = new TestMcpClient(
        app,
        `/v1/mcp/${projectSlug}`,
        "lrm_definitely_not_a_key",
      );
      const { status, headers } = await bad.rpc("tools/list");
      expect(status).toBe(401);
      expect(headers["www-authenticate"]).toContain('error="invalid_token"');
    });

    it("rejects an API key presented to another project's URL", async () => {
      const wrong = new TestMcpClient(
        app,
        `/v1/mcp/${otherProjectSlug}`,
        readWriteKey,
      );
      const { status } = await wrong.rpc("tools/list");
      expect(status).toBe(401);

      const right = new TestMcpClient(
        app,
        `/v1/mcp/${otherProjectSlug}`,
        otherProjectKey,
      );
      expect((await right.rpc("tools/list")).status).toBe(200);
    });

    it("still serves the legacy project-less URL for API keys", async () => {
      const legacy = new TestMcpClient(app, "/v1/mcp", readWriteKey);
      const tools = await legacy.listTools();
      expect(tools).toContain("get_project");
    });

    it("responds to initialize (2025-era client) with server info", async () => {
      const { status, message } = await rw.initialize();
      expect(status).toBe(200);
      expect(message?.result?.serverInfo?.name).toBe("loreum");
    });

    it("answers GET with 405 (stateless: no SSE session stream)", async () => {
      const res = await request(app.getHttpServer())
        .get(`/v1/mcp/${projectSlug}`)
        .set("Authorization", `Bearer ${readWriteKey}`)
        .set("Accept", "text/event-stream");
      expect(res.status).toBe(405);
    });
  });

  // ---------------------------------------------------------------------------
  // Tool surface
  // ---------------------------------------------------------------------------

  describe("tool surface", () => {
    it("exposes read and write tools to a read-write credential, in stable order", async () => {
      const tools = await rw.listTools();
      for (const t of [...READ_TOOLS, ...WRITE_TOOLS])
        expect(tools).toContain(t);
      expect(await rw.listTools()).toEqual(tools);
    });

    it("hides write tools from a read-only credential", async () => {
      const tools = await ro.listTools();
      for (const t of READ_TOOLS) expect(tools).toContain(t);
      for (const t of WRITE_TOOLS) expect(tools).not.toContain(t);
    });

    it("refuses a write tool call from a read-only credential", async () => {
      const res = await ro.call("create_entity", {
        type: "CHARACTER",
        name: "Saruman",
      });
      expect(res.ok).toBe(false);
    });

    it("annotates every tool with a title and read-only/destructive hints", async () => {
      const tools = await rw.listToolsFull();
      for (const t of tools) {
        expect(t.annotations?.title, t.name).toBeTruthy();
        expect(typeof t.annotations?.readOnlyHint, t.name).toBe("boolean");
        expect(typeof t.annotations?.destructiveHint, t.name).toBe("boolean");
      }
      const del = tools.find((t) => t.name === "delete_entity")!;
      expect(del.annotations?.destructiveHint).toBe(true);
      const list = tools.find((t) => t.name === "list_entities")!;
      expect(list.annotations?.readOnlyHint).toBe(true);
    });

    it("returns domain errors as tool errors without leaking internals", async () => {
      const res = await rw.call<{ error: string }>("get_entity", {
        entitySlug: "does-not-exist",
      });
      expect(res.ok).toBe(false);
      expect(res.data.error).toBe("Entity not found");
      expect(res.text).not.toContain("at ");
    });

    it("returns schema validation problems as tool errors", async () => {
      const res = await rw.call("create_entity", {
        type: "DRAGON",
        name: "Smaug",
      });
      expect(res.ok).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // World building round trip
  // ---------------------------------------------------------------------------

  describe("world building round trip", () => {
    it("orients with get_project", async () => {
      const res = await rw.call<{
        name: string;
        counts: { entities: Record<string, number> };
      }>("get_project");
      expect(res.ok).toBe(true);
      expect(res.data.name).toBe("MCP Test World");
      expect(res.data.counts).toBeDefined();
    });

    it("creates entities with tags, relationships, and reads them back", async () => {
      const gandalf = await rw.call<{ slug: string; tags: string[] }>(
        "create_entity",
        {
          type: "CHARACTER",
          name: "Gandalf",
          summary: "A wizard",
          tags: ["wizard", "istari"],
          character: { species: "Maia", role: "mentor" },
        },
      );
      expect(gandalf.ok, gandalf.text).toBe(true);
      expect(gandalf.data.slug).toBe("gandalf");
      expect(gandalf.data.tags.sort()).toEqual(["istari", "wizard"]);

      const frodo = await rw.call<{ slug: string }>("create_entity", {
        type: "CHARACTER",
        name: "Frodo",
      });
      const shire = await rw.call<{ slug: string }>("create_entity", {
        type: "LOCATION",
        name: "The Shire",
        location: { region: "Eriador" },
      });
      expect(frodo.ok && shire.ok).toBe(true);

      const rel = await rw.call<{ id: string }>("create_relationship", {
        sourceEntitySlug: "gandalf",
        targetEntitySlug: "frodo",
        label: "Mentor",
      });
      expect(rel.ok, rel.text).toBe(true);

      const hub = await rw.call<{
        relationships: { label: string; other: { slug: string } }[];
        tags: string[];
      }>("get_entity", { entitySlug: "gandalf" });
      expect(hub.ok).toBe(true);
      expect(hub.data.relationships[0]).toMatchObject({
        label: "Mentor",
        other: { slug: "frodo" },
      });

      const listed = await ro.call<{ slug: string }[]>("list_entities", {
        type: "CHARACTER",
      });
      expect(listed.data.map((e) => e.slug).sort()).toEqual([
        "frodo",
        "gandalf",
      ]);

      const tags = await ro.call<{ name: string }[]>("list_tags");
      expect(tags.data.map((t) => t.name).sort()).toEqual(["istari", "wizard"]);

      const rels = await ro.call<unknown[]>("list_relationships", {
        entitySlug: "frodo",
      });
      expect(rels.data).toHaveLength(1);

      const updated = await rw.call<{ tags: string[]; summary: string }>(
        "update_entity",
        {
          entitySlug: "gandalf",
          summary: "Gandalf the Grey",
          tags: ["wizard"],
        },
      );
      expect(updated.ok).toBe(true);
      expect(updated.data.tags).toEqual(["wizard"]);

      const delRel = await rw.call("delete_relationship", {
        relationshipId: rel.data.id,
      });
      expect(delRel.ok).toBe(true);
    });

    it("writes and reads lore", async () => {
      const article = await rw.call<{
        slug: string;
        entities: { slug: string }[];
      }>("create_lore_article", {
        title: "The Istari",
        content: "Five wizards were sent to Middle-earth.",
        category: "history",
        entitySlugs: ["gandalf"],
        tags: ["wizard"],
      });
      expect(article.ok, article.text).toBe(true);
      expect(article.data.entities[0]?.slug).toBe("gandalf");

      const fetched = await ro.call<{ content: string; tags: string[] }>(
        "get_lore_article",
        { articleSlug: article.data.slug },
      );
      expect(fetched.data.content).toContain("Five wizards");

      const updated = await rw.call<{ content: string }>(
        "update_lore_article",
        {
          articleSlug: article.data.slug,
          content: "Five wizards, the Istari, were sent to Middle-earth.",
        },
      );
      expect(updated.data.content).toContain("Istari");

      const list = await ro.call<{ slug: string }[]>("list_lore_articles", {
        entitySlug: "gandalf",
      });
      expect(list.data).toHaveLength(1);
    });

    it("builds a timeline with eras", async () => {
      const era = await rw.call<{ slug: string }>("create_era", {
        name: "Third Age",
        startDate: 0,
        endDate: 3021,
      });
      expect(era.ok, era.text).toBe(true);

      const ev = await rw.call<{
        id: string;
        sortOrder: number;
        entities: { slug: string }[];
      }>("create_timeline_event", {
        name: "Bilbo's party",
        date: "TA 3001",
        dateValue: 3001,
        significance: "major",
        eraSlug: era.data.slug,
        entitySlugs: ["frodo", "gandalf"],
      });
      expect(ev.ok, ev.text).toBe(true);
      expect(ev.data.entities.map((e) => e.slug).sort()).toEqual([
        "frodo",
        "gandalf",
      ]);

      const second = await rw.call<{ sortOrder: number }>(
        "create_timeline_event",
        { name: "Council of Elrond", date: "TA 3018" },
      );
      expect(second.data.sortOrder).toBe(ev.data.sortOrder + 1);

      const timeline = await ro.call<{ id: string }[]>("get_timeline", {
        entitySlug: "frodo",
      });
      expect(timeline.data).toHaveLength(1);

      const one = await ro.call<{ name: string }>("get_timeline_event", {
        eventId: ev.data.id,
      });
      expect(one.data.name).toBe("Bilbo's party");

      const eras = await ro.call<unknown[]>("list_eras");
      expect(eras.data).toHaveLength(1);
    });

    it("builds a storyboard down to scene prose", async () => {
      const work = await rw.call<{ slug: string }>("create_work", {
        title: "The Fellowship of the Ring",
      });
      expect(work.ok, work.text).toBe(true);

      const chapter = await rw.call<{ id: string; sequenceNumber: number }>(
        "create_chapter",
        {
          workSlug: work.data.slug,
          title: "A Long-expected Party",
        },
      );
      expect(chapter.ok, chapter.text).toBe(true);
      expect(chapter.data.sequenceNumber).toBe(1);

      const scene = await rw.call<{ id: string; sequenceNumber: number }>(
        "create_scene",
        {
          chapterId: chapter.data.id,
          title: "The party",
          content: "When Mr. Bilbo Baggins of Bag End announced...",
          povCharacterSlug: "frodo",
          locationSlug: "the-shire",
        },
      );
      expect(scene.ok, scene.text).toBe(true);
      expect(scene.data.sequenceNumber).toBe(1);

      const scenes = await ro.call<
        {
          content: string;
          characters: { entity: { slug: string } }[];
          location: { slug: string };
        }[]
      >("list_scenes", { chapterId: chapter.data.id });
      expect(scenes.data[0]?.content).toContain("Bilbo Baggins");
      expect(scenes.data[0]?.characters[0]?.entity.slug).toBe("frodo");
      expect(scenes.data[0]?.location.slug).toBe("the-shire");

      const edited = await rw.call<{ content: string }>("update_scene", {
        sceneId: scene.data.id,
        content: "Revised opening.",
      });
      expect(edited.data.content).toBe("Revised opening.");

      const plotline = await rw.call<{ slug: string }>("create_plotline", {
        name: "The Ring",
      });
      const point = await rw.call<{ id: string }>("create_plot_point", {
        plotlineSlug: plotline.data.slug,
        title: "Inciting incident",
        sequenceNumber: 1,
        sceneId: scene.data.id,
        entitySlug: "frodo",
      });
      expect(point.ok, point.text).toBe(true);

      const pl = await ro.call<{ plotPoints: { title: string }[] }>(
        "get_plotline",
        { plotlineSlug: plotline.data.slug },
      );
      expect(pl.data.plotPoints[0]?.title).toBe("Inciting incident");

      const overview = await ro.call<{
        works: unknown[];
        plotlines: unknown[];
      }>("get_storyboard");
      expect(overview.data.works).toHaveLength(1);
      expect(overview.data.plotlines).toHaveLength(1);

      const w = await ro.call<{ chapters: unknown[] }>("get_work", {
        workSlug: work.data.slug,
      });
      expect(w.data.chapters).toHaveLength(1);
    });

    it("searches across every content kind", async () => {
      const all = await ro.call<{
        results: { kind: string; name: string }[];
        total: number;
      }>("search_project", { query: "bilbo" });
      expect(all.ok).toBe(true);
      const kinds = new Set(all.data.results.map((r) => r.kind));
      expect(kinds.has("timeline")).toBe(true);
      // "Bilbo" appears in the original scene prose which was later revised,
      // and in the timeline event name.
      const onlyLore = await ro.call<{ results: { kind: string }[] }>(
        "search_project",
        { query: "wizards", types: ["lore"] },
      );
      expect(onlyLore.data.results.every((r) => r.kind === "lore")).toBe(true);
      expect(onlyLore.data.results.length).toBeGreaterThan(0);
    });

    it("blocks cross-project references in write tools", async () => {
      const other = new TestMcpClient(
        app,
        `/v1/mcp/${otherProjectSlug}`,
        otherProjectKey,
      );
      const foreignEvent = await other.call<{ id: string }>(
        "create_timeline_event",
        { name: "Foreign", date: "1" },
      );
      expect(foreignEvent.ok, foreignEvent.text).toBe(true);

      const work = await rw.call<{ slug: string }>("create_work", {
        title: "Cross",
      });
      const chapter = await rw.call<{ id: string }>("create_chapter", {
        workSlug: work.data.slug,
        title: "C",
      });
      const res = await rw.call<{ error: string }>("create_scene", {
        chapterId: chapter.data.id,
        timelineEventId: foreignEvent.data.id,
      });
      expect(res.ok).toBe(false);
      expect(res.data.error).toContain("does not belong to this project");
    });

    it("deletes an entity (destructive tool)", async () => {
      const res = await rw.call("delete_entity", { entitySlug: "the-shire" });
      expect(res.ok).toBe(true);
      const gone = await ro.call("get_entity", { entitySlug: "the-shire" });
      expect(gone.ok).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // REST behaviour of API keys is unchanged
  // ---------------------------------------------------------------------------

  describe("REST API keys", () => {
    it("scopes REST access to the key's project", async () => {
      const own = await request(app.getHttpServer())
        .get(`/v1/projects/${projectSlug}/entities`)
        .set("Authorization", `Bearer ${readWriteKey}`);
      expect(own.status).toBe(200);

      const other = await request(app.getHttpServer())
        .get(`/v1/projects/${otherProjectSlug}/entities`)
        .set("Authorization", `Bearer ${readWriteKey}`);
      expect(other.status).toBe(403);
    });

    it("rejects REST writes with a read-only key", async () => {
      const res = await request(app.getHttpServer())
        .post(`/v1/projects/${projectSlug}/entities`)
        .set("Authorization", `Bearer ${readOnlyKey}`)
        .send({ type: "CHARACTER", name: "Radagast" });
      expect(res.status).toBe(403);
    });

    it("serves project search over REST", async () => {
      const res = await request(app.getHttpServer())
        .get(`/v1/projects/${projectSlug}/search?q=gandalf`)
        .set("Authorization", `Bearer ${readOnlyKey}`);
      expect(res.status).toBe(200);
      expect(res.body.results.length).toBeGreaterThan(0);
    });
  });
});
