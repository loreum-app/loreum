import { INestApplication } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
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

/**
 * ChatGPT connector contract: tools named `search` and `fetch` whose results
 * carry `structuredContent` mirrored as JSON text.
 */
describe("ChatGPT connector tools (integration)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let module: TestingModule;
  let projectSlug: string;
  let loreSlug: string;
  let rw: TestMcpClient;

  const structured = (msg: { result?: Record<string, unknown> }) =>
    msg.result?.structuredContent as Record<string, unknown>;

  beforeAll(async () => {
    ({ app, prisma, module } = await createTestApp());
    await cleanDatabase(prisma);
    const { user } = await createAuthenticatedUser(prisma, module, {
      email: "chatgpt-test@example.com",
    });
    const project = await module
      .get(ProjectsService)
      .create(user.id, { name: "ChatGPT World" });
    projectSlug = project.slug;
    const key = (
      await module
        .get(ApiKeysService)
        .create(project.id, user.id, { name: "rw", permissions: "READ_WRITE" })
    ).key;
    rw = new TestMcpClient(app, `/v1/mcp/${projectSlug}`, key);

    await rw.call("create_entity", {
      type: "CHARACTER",
      name: "Aragorn",
      summary: "Heir of Isildur",
      backstory: "Raised in Rivendell under the name Estel.",
    });
    const article = await rw.call<{ slug: string }>("create_lore_article", {
      title: "The Dúnedain",
      content:
        "The Dúnedain are the descendants of Númenor, Aragorn among them.",
      category: "peoples",
      entitySlugs: ["aragorn"],
    });
    loreSlug = article.data.slug;
    await rw.call("create_timeline_event", {
      name: "Aragorn is crowned",
      date: "TA 3019",
      entitySlugs: ["aragorn"],
    });
    const work = await rw.call<{ slug: string }>("create_work", {
      title: "Return of the King",
    });
    const chapter = await rw.call<{ id: string }>("create_chapter", {
      workSlug: work.data.slug,
      title: "The Steward and the King",
    });
    await rw.call("create_scene", {
      chapterId: chapter.data.id,
      title: "Coronation",
      content: "Aragorn took the crown from Frodo's hands.",
      povCharacterSlug: "aragorn",
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it("lists search and fetch right after the orientation tools", async () => {
    const tools = await rw.listTools();
    expect(tools.slice(0, 6)).toEqual([
      "get_project",
      "search_project",
      "get_entity_types",
      "list_tags",
      "search",
      "fetch",
    ]);
  });

  it("search returns structured results with ids, titles, and citation urls", async () => {
    const { message } = await rw.rpc("tools/call", {
      name: "search",
      arguments: { query: "aragorn" },
    });
    const data = structured(message!) as {
      results: { id: string; title: string; url: string }[];
    };
    expect(data.results.length).toBeGreaterThanOrEqual(4);
    const kinds = data.results.map((r) => r.id.split(":")[0]);
    for (const k of ["entity", "lore", "timeline", "scene"])
      expect(kinds).toContain(k);
    for (const r of data.results) {
      expect(r.url).toMatch(/^http:\/\/localhost:3020\/projects\//);
      expect(r.title).toBeTruthy();
    }
    // The text content mirrors the structured payload.
    expect(JSON.parse(message!.result!.content![0]!.text)).toEqual(data);
  });

  it("fetch returns each document kind with text and metadata", async () => {
    const { message: s } = await rw.rpc("tools/call", {
      name: "search",
      arguments: { query: "aragorn" },
    });
    const ids = (structured(s!) as { results: { id: string }[] }).results.map(
      (r) => r.id,
    );
    for (const id of ids) {
      const { message } = await rw.rpc("tools/call", {
        name: "fetch",
        arguments: { id },
      });
      expect(message!.result!.isError, id).toBeFalsy();
      const doc = structured(message!) as {
        id: string;
        title: string;
        text: string;
        url: string;
        metadata: { kind: string };
      };
      expect(doc.id).toBe(id);
      expect(doc.title).toBeTruthy();
      expect(doc.text).toContain("Aragorn");
      expect(doc.url).toContain("/projects/");
      expect(doc.metadata.kind).toBe(id.split(":")[0]);
    }
  });

  it("renders the entity document with its sections", async () => {
    const { message } = await rw.rpc("tools/call", {
      name: "fetch",
      arguments: { id: "entity:aragorn" },
    });
    const doc = structured(message!) as { text: string; url: string };
    expect(doc.text).toContain("## Backstory");
    expect(doc.text).toContain("## Lore");
    expect(doc.text).toContain("The Dúnedain");
    expect(doc.url).toBe(
      `http://localhost:3020/projects/${projectSlug}/entities/characters/aragorn`,
    );
  });

  it("links to the public wiki once the world is not private", async () => {
    await prisma.project.update({
      where: { slug: projectSlug },
      data: { visibility: "UNLISTED" },
    });
    const { message } = await rw.rpc("tools/call", {
      name: "fetch",
      arguments: { id: `lore:${loreSlug}` },
    });
    expect(message!.result!.isError).toBeFalsy();
    const doc = structured(message!) as { url: string };
    expect(doc.url).toBe(
      `http://localhost:3020/worlds/${projectSlug}/lore/${loreSlug}`,
    );
  });

  it("rejects malformed and unknown ids as tool errors", async () => {
    for (const id of ["nope", "entity:does-not-exist", "scene:missing"]) {
      const res = await rw.call<{ error: string }>("fetch", { id });
      expect(res.ok, id).toBe(false);
      expect(res.data.error).toBeTruthy();
    }
  });
});
