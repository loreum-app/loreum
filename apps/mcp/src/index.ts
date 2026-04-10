import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API_BASE_URL =
  process.env.MCP_API_BASE_URL || "http://localhost:3021/api/v1";

const server = new McpServer({
  name: "loreum",
  version: "0.1.0",
});

// ---------------------------------------------------------------------------
// Helper: call the Loreum API
// ---------------------------------------------------------------------------

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      // Bearer auth for MCP
      ...(process.env.MCP_API_TOKEN && {
        Authorization: `Bearer ${process.env.MCP_API_TOKEN}`,
      }),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Query Tools (read-only)
// ---------------------------------------------------------------------------

server.registerTool(
  "search_project",
  {
    description: "Search across all content in a project",
    inputSchema: {
      projectSlug: z.string(),
      query: z.string(),
      types: z
        .array(z.enum(["entity", "lore", "scene", "timeline"]))
        .optional(),
      limit: z.number().optional(),
    },
  },
  async ({ projectSlug, query, types, limit }) => {
    const params = new URLSearchParams({ q: query });
    if (types) params.set("types", types.join(","));
    if (limit) params.set("limit", String(limit));

    const results = await api(`/projects/${projectSlug}/search?${params}`);
    return {
      content: [
        { type: "text" as const, text: JSON.stringify(results, null, 2) },
      ],
    };
  },
);

server.registerTool(
  "get_entity",
  {
    description:
      "Retrieve a specific entity with relationships and linked content",
    inputSchema: {
      projectSlug: z.string(),
      entitySlug: z.string(),
      include: z
        .array(z.enum(["relationships", "lore", "timeline", "scenes"]))
        .optional(),
    },
  },
  async ({ projectSlug, entitySlug, include }) => {
    const params = include ? `?include=${include.join(",")}` : "";
    const entity = await api(
      `/projects/${projectSlug}/entities/${entitySlug}${params}`,
    );
    return {
      content: [
        { type: "text" as const, text: JSON.stringify(entity, null, 2) },
      ],
    };
  },
);

server.registerTool(
  "get_entity_hub",
  {
    description:
      "Get the full aggregated lore page for an entity — everything connected to it",
    inputSchema: {
      projectSlug: z.string(),
      entitySlug: z.string(),
    },
  },
  async ({ projectSlug, entitySlug }) => {
    const hub = await api(
      `/projects/${projectSlug}/entities/${entitySlug}/hub`,
    );
    return {
      content: [{ type: "text" as const, text: JSON.stringify(hub, null, 2) }],
    };
  },
);

server.registerTool(
  "list_entities",
  {
    description: "List and filter entities in a project",
    inputSchema: {
      projectSlug: z.string(),
      type: z.string().optional(),
      tag: z.string().optional(),
      q: z.string().optional(),
    },
  },
  async ({ projectSlug, type, tag, q }) => {
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (tag) params.set("tag", tag);
    if (q) params.set("q", q);
    const query = params.toString() ? `?${params}` : "";

    const entities = await api(`/projects/${projectSlug}/entities${query}`);
    return {
      content: [
        { type: "text" as const, text: JSON.stringify(entities, null, 2) },
      ],
    };
  },
);

server.registerTool(
  "get_storyboard",
  {
    description:
      "Get the narrative structure: plotlines, books, chapters, scenes",
    inputSchema: {
      projectSlug: z.string(),
      bookSlug: z.string().optional(),
      detail: z.enum(["outline", "full"]).optional(),
    },
  },
  async ({ projectSlug, bookSlug, detail }) => {
    const params = new URLSearchParams();
    if (bookSlug) params.set("book", bookSlug);
    if (detail) params.set("detail", detail);
    const query = params.toString() ? `?${params}` : "";

    const storyboard = await api(`/projects/${projectSlug}/storyboard${query}`);
    return {
      content: [
        { type: "text" as const, text: JSON.stringify(storyboard, null, 2) },
      ],
    };
  },
);

server.registerTool(
  "get_entity_types",
  {
    description: "List all entity types and their field schemas for a project",
    inputSchema: {
      projectSlug: z.string(),
    },
  },
  async ({ projectSlug }) => {
    const types = await api(`/projects/${projectSlug}/entity-types`);
    return {
      content: [
        { type: "text" as const, text: JSON.stringify(types, null, 2) },
      ],
    };
  },
);

// ---------------------------------------------------------------------------
// Mutation Tools
// ---------------------------------------------------------------------------

server.registerTool(
  "create_entity",
  {
    description: "Create a new entity in a project",
    inputSchema: {
      projectSlug: z.string(),
      type: z.enum(["CHARACTER", "LOCATION", "ORGANIZATION", "ITEM"]),
      name: z.string(),
      summary: z.string().optional(),
      description: z.string().optional(),
      backstory: z.string().optional(),
      secrets: z.string().optional(),
      notes: z.string().optional(),
      tags: z.array(z.string()).optional(),
    },
  },
  async ({ projectSlug, ...data }) => {
    const entity = await api(`/projects/${projectSlug}/entities`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return {
      content: [
        { type: "text" as const, text: JSON.stringify(entity, null, 2) },
      ],
    };
  },
);

server.registerTool(
  "update_entity",
  {
    description: "Update an existing entity",
    inputSchema: {
      projectSlug: z.string(),
      entitySlug: z.string(),
      updates: z.record(z.string(), z.any()),
    },
  },
  async ({ projectSlug, entitySlug, updates }) => {
    const entity = await api(
      `/projects/${projectSlug}/entities/${entitySlug}`,
      { method: "PATCH", body: JSON.stringify(updates) },
    );
    return {
      content: [
        { type: "text" as const, text: JSON.stringify(entity, null, 2) },
      ],
    };
  },
);

server.registerTool(
  "create_relationship",
  {
    description: "Create a relationship between two entities",
    inputSchema: {
      projectSlug: z.string(),
      sourceEntitySlug: z.string(),
      targetEntitySlug: z.string(),
      type: z.string(),
      label: z.string().optional(),
      metadata: z.record(z.string(), z.any()).optional(),
      bidirectional: z.boolean().optional(),
    },
  },
  async ({ projectSlug, ...data }) => {
    const rel = await api(`/projects/${projectSlug}/relationships`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return {
      content: [{ type: "text" as const, text: JSON.stringify(rel, null, 2) }],
    };
  },
);

server.registerTool(
  "create_lore_article",
  {
    description: "Create a lore article linked to entities",
    inputSchema: {
      projectSlug: z.string(),
      title: z.string(),
      content: z.string(),
      category: z.string().optional(),
      tags: z.array(z.string()).optional(),
      entitySlugs: z.array(z.string()).optional(),
    },
  },
  async ({ projectSlug, ...data }) => {
    const article = await api(`/projects/${projectSlug}/lore`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return {
      content: [
        { type: "text" as const, text: JSON.stringify(article, null, 2) },
      ],
    };
  },
);

// ---------------------------------------------------------------------------
// Resources
// ---------------------------------------------------------------------------

server.resource(
  "project_overview",
  "loreum://project/{projectSlug}/overview",
  async (uri) => {
    const projectSlug = uri.pathname.split("/")[2];
    const overview = await api(`/projects/${projectSlug}`);
    return {
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(overview, null, 2),
        },
      ],
    };
  },
);

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Loreum MCP server running on stdio");
}

main().catch(console.error);
