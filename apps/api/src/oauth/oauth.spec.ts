import { INestApplication } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import * as crypto from "crypto";
import * as nodeHttp from "http";
import { AddressInfo } from "net";
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
import { isCimdClientId, isPrivateAddress } from "./cimd.service";

const ISSUER = "http://localhost:3021";
const CALLBACK = "https://claude.ai/api/mcp/auth_callback";

function pkce() {
  const verifier = crypto.randomBytes(48).toString("base64url");
  const challenge = crypto
    .createHash("sha256")
    .update(verifier)
    .digest("base64url");
  return { verifier, challenge };
}

describe("MCP OAuth authorization server (integration)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let module: TestingModule;
  let cookie: string;
  let csrfToken: string;
  let projectSlug: string;
  let otherProjectSlug: string;
  let foreignProjectSlug: string;
  let clientId: string;

  const http = () => request(app.getHttpServer());
  const http_ = http;

  /** Runs authorize → consent(allow) and returns the code + redirect URL. */
  async function authorizeAndConsent(opts: {
    challenge: string;
    redirectUri?: string;
    resource?: string;
    projectSlug?: string;
    permissions?: "READ_ONLY" | "READ_WRITE";
    scope?: string;
    state?: string;
  }) {
    const params: Record<string, string> = {
      response_type: "code",
      client_id: clientId,
      redirect_uri: opts.redirectUri ?? CALLBACK,
      code_challenge: opts.challenge,
      code_challenge_method: "S256",
      state: opts.state ?? "xyz",
    };
    if (opts.resource) params.resource = opts.resource;
    if (opts.scope) params.scope = opts.scope;

    const auth = await http().get("/v1/oauth/authorize").query(params);
    expect(auth.status).toBe(302);
    const consentUrl = new URL(auth.headers.location!);
    expect(consentUrl.origin + consentUrl.pathname).toBe(
      "http://localhost:3020/authorize",
    );
    expect(consentUrl.searchParams.get("client_id")).toBe(clientId);

    const consent = await http()
      .post("/v1/oauth/consent")
      .set("Cookie", cookie)
      .set("x-csrf-token", csrfToken)
      .send({
        decision: "allow",
        projectSlug: opts.projectSlug,
        permissions: opts.permissions,
        ...params,
      });
    return consent;
  }

  async function exchange(
    code: string,
    verifier: string,
    extra: Record<string, string> = {},
  ) {
    return http()
      .post("/v1/oauth/token")
      .type("form")
      .send({
        grant_type: "authorization_code",
        client_id: clientId,
        code,
        code_verifier: verifier,
        redirect_uri: CALLBACK,
        ...extra,
      });
  }

  async function fullFlow(
    opts: {
      resource?: string;
      projectSlug?: string;
      permissions?: "READ_ONLY" | "READ_WRITE";
    } = {},
  ) {
    const { verifier, challenge } = pkce();
    const consent = await authorizeAndConsent({ challenge, ...opts });
    expect(consent.status, JSON.stringify(consent.body)).toBe(200);
    const redirect = new URL(consent.body.redirect);
    const code = redirect.searchParams.get("code")!;
    const token = await exchange(code, verifier);
    expect(token.status, JSON.stringify(token.body)).toBe(200);
    return token.body as {
      access_token: string;
      refresh_token: string;
      scope: string;
      expires_in: number;
    };
  }

  beforeAll(async () => {
    ({ app, prisma, module } = await createTestApp());
    await cleanDatabase(prisma);

    const auth = await createAuthenticatedUser(prisma, module, {
      email: "oauth-owner@example.com",
    });
    cookie = auth.cookie;
    csrfToken = auth.csrfToken;

    const projectsService = module.get(ProjectsService);
    projectSlug = (
      await projectsService.create(auth.user.id, { name: "OAuth World" })
    ).slug;
    otherProjectSlug = (
      await projectsService.create(auth.user.id, { name: "Second World" })
    ).slug;

    const stranger = await createAuthenticatedUser(prisma, module, {
      email: "stranger@example.com",
    });
    foreignProjectSlug = (
      await projectsService.create(stranger.user.id, { name: "Not Yours" })
    ).slug;
  });

  afterAll(async () => {
    await app.close();
  });

  // ---------------------------------------------------------------------------

  describe("discovery", () => {
    it("serves RFC 8414 authorization server metadata at the origin root", async () => {
      const res = await http().get("/.well-known/oauth-authorization-server");
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        issuer: ISSUER,
        authorization_endpoint: `${ISSUER}/v1/oauth/authorize`,
        token_endpoint: `${ISSUER}/v1/oauth/token`,
        registration_endpoint: `${ISSUER}/v1/oauth/register`,
        code_challenge_methods_supported: ["S256"],
        response_types_supported: ["code"],
      });
      expect(res.body.token_endpoint_auth_methods_supported).toContain("none");
      expect(res.body.grant_types_supported).toEqual([
        "authorization_code",
        "refresh_token",
      ]);
    });

    it("serves RFC 9728 protected resource metadata per project", async () => {
      const res = await http().get(
        `/.well-known/oauth-protected-resource/v1/mcp/${projectSlug}`,
      );
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        resource: `${ISSUER}/v1/mcp/${projectSlug}`,
        authorization_servers: [ISSUER],
        scopes_supported: ["read", "write"],
        bearer_methods_supported: ["header"],
      });
    });

    it("does not advertise a project-less protected resource", async () => {
      const res = await http().get("/.well-known/oauth-protected-resource");
      expect(res.status).toBe(404);
    });

    it("allows any origin to read discovery documents", async () => {
      const res = await http()
        .get("/.well-known/oauth-authorization-server")
        .set("Origin", "https://inspector.example");
      expect(res.headers["access-control-allow-origin"]).toBe("*");
    });
  });

  // ---------------------------------------------------------------------------

  describe("dynamic client registration (RFC 7591)", () => {
    it("registers a public client", async () => {
      const res = await http()
        .post("/v1/oauth/register")
        .send({
          client_name: "Claude",
          redirect_uris: [
            CALLBACK,
            "http://localhost/callback",
            "http://127.0.0.1/callback",
          ],
          token_endpoint_auth_method: "none",
          grant_types: ["authorization_code", "refresh_token"],
          response_types: ["code"],
        });
      expect(res.status, JSON.stringify(res.body)).toBe(201);
      expect(res.body.client_id).toBeTruthy();
      expect(res.body.client_secret).toBeUndefined();
      expect(res.body.token_endpoint_auth_method).toBe("none");
      clientId = res.body.client_id;
    });

    it("issues a secret to confidential clients and accepts it at the token endpoint via Basic auth", async () => {
      const reg = await http()
        .post("/v1/oauth/register")
        .send({ client_name: "Confidential", redirect_uris: [CALLBACK] });
      expect(reg.status).toBe(201);
      expect(reg.body.client_secret).toMatch(/^lrms_/);
      expect(reg.body.token_endpoint_auth_method).toBe("client_secret_basic");

      const basic = Buffer.from(
        `${reg.body.client_id}:${reg.body.client_secret}`,
      ).toString("base64");
      const res = await http()
        .post("/v1/oauth/token")
        .set("Authorization", `Basic ${basic}`)
        .type("form")
        .send({
          grant_type: "authorization_code",
          code: "nope",
          code_verifier: "x".repeat(43),
        });
      // Authenticated fine; the code itself is bogus.
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("invalid_grant");

      const wrong = await http()
        .post("/v1/oauth/token")
        .type("form")
        .send({
          grant_type: "authorization_code",
          client_id: reg.body.client_id,
          client_secret: "bad",
          code: "nope",
          code_verifier: "x".repeat(43),
        });
      expect(wrong.status).toBe(401);
      expect(wrong.body.error).toBe("invalid_client");
    });

    it("rejects dangerous or non-loopback http redirect URIs", async () => {
      for (const uri of [
        "javascript:alert(1)",
        "http://evil.example/callback",
      ]) {
        const res = await http()
          .post("/v1/oauth/register")
          .send({ redirect_uris: [uri] });
        expect(res.status, uri).toBe(400);
        expect(res.body.error).toBe("invalid_redirect_uri");
      }
    });
  });

  // ---------------------------------------------------------------------------

  describe("authorization endpoint", () => {
    it("rejects unknown clients directly (never redirects to an unverified URI)", async () => {
      const res = await http().get("/v1/oauth/authorize").query({
        response_type: "code",
        client_id: "nope",
        redirect_uri: "https://attacker.example/cb",
        code_challenge: "abc",
        code_challenge_method: "S256",
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("invalid_client");
    });

    it("rejects unregistered redirect URIs directly", async () => {
      const res = await http().get("/v1/oauth/authorize").query({
        response_type: "code",
        client_id: clientId,
        redirect_uri: "https://attacker.example/cb",
        code_challenge: "abc",
        code_challenge_method: "S256",
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("invalid_request");
    });

    it("reports missing PKCE by redirecting with an error", async () => {
      const res = await http().get("/v1/oauth/authorize").query({
        response_type: "code",
        client_id: clientId,
        redirect_uri: CALLBACK,
        state: "s1",
      });
      expect(res.status).toBe(302);
      const url = new URL(res.headers.location!);
      expect(url.origin + url.pathname).toBe(CALLBACK);
      expect(url.searchParams.get("error")).toBe("invalid_request");
      expect(url.searchParams.get("state")).toBe("s1");
    });

    it("accepts Claude Code style loopback redirects with any port", async () => {
      const { challenge } = pkce();
      const res = await http().get("/v1/oauth/authorize").query({
        response_type: "code",
        client_id: clientId,
        redirect_uri: "http://localhost:3118/callback",
        code_challenge: challenge,
        code_challenge_method: "S256",
      });
      expect(res.status).toBe(302);
      expect(res.headers.location).toContain(
        "http://localhost:3020/authorize?",
      );
    });

    it("rejects a resource that is not a project MCP URL", async () => {
      const { challenge } = pkce();
      const res = await http().get("/v1/oauth/authorize").query({
        response_type: "code",
        client_id: clientId,
        redirect_uri: CALLBACK,
        code_challenge: challenge,
        code_challenge_method: "S256",
        resource: "https://elsewhere.example/mcp",
      });
      expect(res.status).toBe(302);
      expect(new URL(res.headers.location!).searchParams.get("error")).toBe(
        "invalid_target",
      );
    });
  });

  // ---------------------------------------------------------------------------

  describe("consent", () => {
    it("describes the client and the requested project to the signed-in user", async () => {
      const { challenge } = pkce();
      const res = await http()
        .get("/v1/oauth/consent")
        .set("Cookie", cookie)
        .query({
          response_type: "code",
          client_id: clientId,
          redirect_uri: CALLBACK,
          code_challenge: challenge,
          code_challenge_method: "S256",
          resource: `${ISSUER}/v1/mcp/${projectSlug}`,
        });
      expect(res.status).toBe(200);
      expect(res.body.client).toMatchObject({
        name: "Claude",
        redirectHost: "claude.ai",
        isLoopbackRedirect: false,
      });
      expect(res.body.project).toMatchObject({ slug: projectSlug });
      expect(res.body.requestedScopes).toEqual(["read", "write"]);
      expect(res.body.projects.map((p: { slug: string }) => p.slug)).toContain(
        otherProjectSlug,
      );
    });

    it("requires a signed-in user", async () => {
      const res = await http()
        .get("/v1/oauth/consent")
        .query({ client_id: clientId });
      expect(res.status).toBe(401);
    });

    it("denial redirects with access_denied", async () => {
      const { challenge } = pkce();
      const res = await http()
        .post("/v1/oauth/consent")
        .set("Cookie", cookie)
        .set("x-csrf-token", csrfToken)
        .send({
          decision: "deny",
          response_type: "code",
          client_id: clientId,
          redirect_uri: CALLBACK,
          code_challenge: challenge,
          code_challenge_method: "S256",
          state: "s2",
        });
      expect(res.status).toBe(200);
      const url = new URL(res.body.redirect);
      expect(url.searchParams.get("error")).toBe("access_denied");
      expect(url.searchParams.get("state")).toBe("s2");
    });

    it("refuses to grant a project the user does not own", async () => {
      const { challenge } = pkce();
      const res = await authorizeAndConsent({
        challenge,
        resource: `${ISSUER}/v1/mcp/${foreignProjectSlug}`,
      });
      expect([403, 404]).toContain(res.status);
    });

    it("refuses a project selection that contradicts the requested resource", async () => {
      const { challenge } = pkce();
      const res = await authorizeAndConsent({
        challenge,
        resource: `${ISSUER}/v1/mcp/${projectSlug}`,
        projectSlug: otherProjectSlug,
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("invalid_target");
    });
  });

  // ---------------------------------------------------------------------------

  describe("token exchange and MCP access", () => {
    it("exchanges a PKCE code for audience-bound tokens and calls MCP", async () => {
      const { verifier, challenge } = pkce();
      const consent = await authorizeAndConsent({
        challenge,
        resource: `${ISSUER}/v1/mcp/${projectSlug}`,
        state: "st8",
      });
      expect(consent.status, JSON.stringify(consent.body)).toBe(200);
      const redirect = new URL(consent.body.redirect);
      expect(redirect.origin + redirect.pathname).toBe(CALLBACK);
      expect(redirect.searchParams.get("state")).toBe("st8");
      expect(redirect.searchParams.get("iss")).toBe(ISSUER);
      const code = redirect.searchParams.get("code")!;
      expect(code).toMatch(/^lrmc_/);

      const token = await exchange(code, verifier, {
        resource: `${ISSUER}/v1/mcp/${projectSlug}`,
      });
      expect(token.status, JSON.stringify(token.body)).toBe(200);
      expect(token.headers["cache-control"]).toContain("no-store");
      expect(token.body).toMatchObject({
        token_type: "Bearer",
        scope: "read write",
      });
      expect(token.body.access_token).toMatch(/^lrma_/);
      expect(token.body.refresh_token).toMatch(/^lrmr_/);
      expect(token.body.expires_in).toBe(3600);

      const mcp = new TestMcpClient(
        app,
        `/v1/mcp/${projectSlug}`,
        token.body.access_token,
      );
      const tools = await mcp.listTools();
      expect(tools).toContain("create_entity");

      // Same server, different project: audience mismatch.
      const wrong = new TestMcpClient(
        app,
        `/v1/mcp/${otherProjectSlug}`,
        token.body.access_token,
      );
      expect((await wrong.rpc("tools/list")).status).toBe(401);

      // OAuth tokens are not accepted on the project-less legacy URL.
      const legacy = new TestMcpClient(app, "/v1/mcp", token.body.access_token);
      expect((await legacy.rpc("tools/list")).status).toBe(401);

      // The code is single use; a replay revokes the connection.
      const replay = await exchange(code, verifier);
      expect(replay.status).toBe(400);
      expect(replay.body.error).toBe("invalid_grant");
      expect((await mcp.rpc("tools/list")).status).toBe(401);
    });

    it("rejects a wrong PKCE verifier", async () => {
      const { challenge } = pkce();
      const consent = await authorizeAndConsent({ challenge, projectSlug });
      const code = new URL(consent.body.redirect).searchParams.get("code")!;
      const res = await exchange(code, "wrong-verifier-" + "x".repeat(40));
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("invalid_grant");
    });

    it("lets the user pick a project when the client sent no resource, and honours read-only consent", async () => {
      const tokens = await fullFlow({
        projectSlug: otherProjectSlug,
        permissions: "READ_ONLY",
      });
      expect(tokens.scope).toBe("read");
      const mcp = new TestMcpClient(
        app,
        `/v1/mcp/${otherProjectSlug}`,
        tokens.access_token,
      );
      const tools = await mcp.listTools();
      expect(tools).toContain("list_entities");
      expect(tools).not.toContain("create_entity");
    });

    it("never grants more than the client requested", async () => {
      const { verifier, challenge } = pkce();
      const consent = await authorizeAndConsent({
        challenge,
        projectSlug,
        scope: "read",
        permissions: "READ_WRITE",
      });
      const code = new URL(consent.body.redirect).searchParams.get("code")!;
      const token = await exchange(code, verifier);
      expect(token.body.scope).toBe("read");
    });

    it("rotates refresh tokens and revokes the connection on reuse", async () => {
      const first = await fullFlow({
        resource: `${ISSUER}/v1/mcp/${projectSlug}`,
      });

      const refreshed = await http().post("/v1/oauth/token").type("form").send({
        grant_type: "refresh_token",
        client_id: clientId,
        refresh_token: first.refresh_token,
      });
      expect(refreshed.status, JSON.stringify(refreshed.body)).toBe(200);
      expect(refreshed.body.refresh_token).not.toBe(first.refresh_token);
      expect(refreshed.body.access_token).not.toBe(first.access_token);

      const mcp = new TestMcpClient(
        app,
        `/v1/mcp/${projectSlug}`,
        refreshed.body.access_token,
      );
      expect((await mcp.rpc("tools/list")).status).toBe(200);

      const reuse = await http().post("/v1/oauth/token").type("form").send({
        grant_type: "refresh_token",
        client_id: clientId,
        refresh_token: first.refresh_token,
      });
      expect(reuse.status).toBe(400);
      expect(reuse.body.error).toBe("invalid_grant");

      // Theft detected: everything on the connection is dead, including the new access token.
      expect((await mcp.rpc("tools/list")).status).toBe(401);
    });

    it("returns invalid_grant for an unknown refresh token", async () => {
      const res = await http().post("/v1/oauth/token").type("form").send({
        grant_type: "refresh_token",
        client_id: clientId,
        refresh_token: "lrmr_nope",
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("invalid_grant");
    });

    it("rejects unsupported grant types", async () => {
      const res = await http()
        .post("/v1/oauth/token")
        .type("form")
        .send({ grant_type: "client_credentials", client_id: clientId });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("unsupported_grant_type");
    });
  });

  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------

  describe("client id metadata documents (CIMD)", () => {
    let docServer: nodeHttp.Server;
    let docUrl: string;
    let docHits = 0;
    let docBody: Record<string, unknown> = {};

    beforeAll(async () => {
      docServer = nodeHttp.createServer((req, res) => {
        docHits++;
        if (req.url === "/client.json") {
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ ...docBody, client_id: docUrl }));
        } else if (req.url === "/mismatch.json") {
          res.setHeader("content-type", "application/json");
          res.end(
            JSON.stringify({
              ...docBody,
              client_id: "https://elsewhere.example/x",
            }),
          );
        } else {
          res.statusCode = 404;
          res.end();
        }
      });
      await new Promise<void>((r) => docServer.listen(0, "127.0.0.1", r));
      const port = (docServer.address() as AddressInfo).port;
      docUrl = `http://127.0.0.1:${port}/client.json`;
      docBody = {
        client_name: "CIMD Client",
        client_uri: "https://cimd.example",
        redirect_uris: [CALLBACK, "http://localhost/callback"],
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
        token_endpoint_auth_method: "none",
      };
    });

    afterAll(async () => {
      await new Promise<void>((r) => docServer.close(() => r()));
    });

    const authorizeParams = (clientId: string, challenge: string) => ({
      response_type: "code",
      client_id: clientId,
      redirect_uri: CALLBACK,
      code_challenge: challenge,
      code_challenge_method: "S256",
      state: "cimd",
      resource: `${ISSUER}/v1/mcp/${projectSlug}`,
    });

    it("advertises support in the authorization server metadata", async () => {
      const res = await http_().get("/.well-known/oauth-authorization-server");
      expect(res.body.client_id_metadata_document_supported).toBe(true);
    });

    it("recognises URL client ids and non-routable addresses", () => {
      expect(isCimdClientId("https://claude.ai/oauth/client-metadata")).toBe(
        true,
      );
      expect(isCimdClientId("https://claude.ai/")).toBe(false);
      expect(isCimdClientId("https://claude.ai/x#frag")).toBe(false);
      expect(isCimdClientId("0462537b-d108-436e-b03f-7ca51678f879")).toBe(
        false,
      );
      for (const ip of [
        "127.0.0.1",
        "10.1.2.3",
        "172.16.0.1",
        "192.168.1.1",
        "169.254.169.254",
        "100.64.0.1",
        "0.0.0.0",
        "::1",
        "fc00::1",
        "fe80::1",
        "::ffff:10.0.0.1",
      ]) {
        expect(isPrivateAddress(ip), ip).toBe(true);
      }
      for (const ip of ["8.8.8.8", "160.79.104.10", "2606:4700::1111"]) {
        expect(isPrivateAddress(ip), ip).toBe(false);
      }
    });

    it("runs the whole flow with a metadata-document client and no secret", async () => {
      const { verifier, challenge } = pkce();
      const params = authorizeParams(docUrl, challenge);

      const auth = await http_().get("/v1/oauth/authorize").query(params);
      expect(auth.status, JSON.stringify(auth.body)).toBe(302);
      expect(auth.headers.location).toContain(
        "http://localhost:3020/authorize?",
      );

      const ctx = await http_()
        .get("/v1/oauth/consent")
        .set("Cookie", cookie)
        .query(params);
      expect(ctx.status).toBe(200);
      expect(ctx.body.client.name).toBe("CIMD Client");

      const consent = await http_()
        .post("/v1/oauth/consent")
        .set("Cookie", cookie)
        .set("x-csrf-token", csrfToken)
        .send({ decision: "allow", permissions: "READ_WRITE", ...params });
      expect(consent.status, JSON.stringify(consent.body)).toBe(200);
      const code = new URL(consent.body.redirect).searchParams.get("code")!;

      const token = await http_()
        .post("/v1/oauth/token")
        .type("form")
        .send({
          grant_type: "authorization_code",
          client_id: docUrl,
          code,
          code_verifier: verifier,
          redirect_uri: CALLBACK,
          resource: `${ISSUER}/v1/mcp/${projectSlug}`,
        });
      expect(token.status, JSON.stringify(token.body)).toBe(200);

      const mcp = new TestMcpClient(
        app,
        `/v1/mcp/${projectSlug}`,
        token.body.access_token,
      );
      expect(await mcp.listTools()).toContain("get_project");

      const list = await http_()
        .get(`/v1/projects/${projectSlug}/connections`)
        .set("Cookie", cookie);
      expect(
        list.body.some(
          (c: { client: { name: string } }) => c.client.name === "CIMD Client",
        ),
      ).toBe(true);

      // Refresh works for the public client too.
      const refreshed = await http_()
        .post("/v1/oauth/token")
        .type("form")
        .send({
          grant_type: "refresh_token",
          client_id: docUrl,
          refresh_token: token.body.refresh_token,
        });
      expect(refreshed.status, JSON.stringify(refreshed.body)).toBe(200);
    });

    it("caches the document instead of refetching on every request", async () => {
      const before = docHits;
      const { challenge } = pkce();
      for (let i = 0; i < 3; i++) {
        const res = await http_()
          .get("/v1/oauth/authorize")
          .query(authorizeParams(docUrl, challenge));
        expect(res.status).toBe(302);
      }
      expect(docHits).toBe(before);
    });

    it("rejects a document whose client_id does not match its URL", async () => {
      const { challenge } = pkce();
      const bad = docUrl.replace("client.json", "mismatch.json");
      const res = await http_()
        .get("/v1/oauth/authorize")
        .query(authorizeParams(bad, challenge));
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("invalid_client");
      expect(res.body.error_description).toContain("does not match");
    });

    it("rejects an unreachable document", async () => {
      const { challenge } = pkce();
      const res = await http_()
        .get("/v1/oauth/authorize")
        .query(
          authorizeParams(
            docUrl.replace("client.json", "nope.json"),
            challenge,
          ),
        );
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("invalid_client");
    });
  });

  describe("connections (connected apps)", () => {
    it("lists and revokes connections from project settings", async () => {
      const tokens = await fullFlow({
        resource: `${ISSUER}/v1/mcp/${projectSlug}`,
      });
      const mcp = new TestMcpClient(
        app,
        `/v1/mcp/${projectSlug}`,
        tokens.access_token,
      );
      expect((await mcp.rpc("tools/list")).status).toBe(200);

      const list = await http()
        .get(`/v1/projects/${projectSlug}/connections`)
        .set("Cookie", cookie);
      expect(list.status).toBe(200);
      const conn =
        list.body.find(
          (c: { lastUsedAt: string | null }) => c.lastUsedAt !== null,
        ) ?? list.body[0];
      expect(conn.client.name).toBe("Claude");
      expect(conn.permissions).toBe("READ_WRITE");

      const del = await http()
        .delete(`/v1/projects/${projectSlug}/connections/${conn.id}`)
        .set("Cookie", cookie)
        .set("x-csrf-token", csrfToken);
      expect(del.status).toBe(204);

      const after = await http()
        .get(`/v1/projects/${projectSlug}/connections`)
        .set("Cookie", cookie);
      expect(
        after.body.find((c: { id: string }) => c.id === conn.id),
      ).toBeUndefined();
    });

    it("supports RFC 7009 revocation by the client", async () => {
      const tokens = await fullFlow({
        resource: `${ISSUER}/v1/mcp/${projectSlug}`,
      });
      const mcp = new TestMcpClient(
        app,
        `/v1/mcp/${projectSlug}`,
        tokens.access_token,
      );
      expect((await mcp.rpc("tools/list")).status).toBe(200);

      const res = await http()
        .post("/v1/oauth/revoke")
        .type("form")
        .send({ client_id: clientId, token: tokens.refresh_token });
      expect(res.status).toBe(200);
      expect((await mcp.rpc("tools/list")).status).toBe(401);
    });

    it("cannot list another user's project connections", async () => {
      const res = await http()
        .get(`/v1/projects/${foreignProjectSlug}/connections`)
        .set("Cookie", cookie);
      expect([403, 404]).toContain(res.status);
    });
  });
});
