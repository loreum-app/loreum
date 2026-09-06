import { Injectable, Logger } from "@nestjs/common";
import * as dns from "dns";
import * as http from "http";
import * as https from "https";
import * as net from "net";
import { z } from "zod";
import { OAuthClient } from "../../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AppConfig } from "../config/app.config";
import { OAuthError } from "./oauth.errors";
import { assertValidRedirectUri } from "./redirect-uris";

/**
 * OAuth Client ID Metadata Documents (draft-ietf-oauth-client-id-metadata-document).
 *
 * A client identifies itself with an HTTPS URL; the authorization server fetches
 * the JSON document at that URL to learn its name and redirect URIs. This is the
 * registration method MCP recommends and the one claude.ai prefers ("Anthropic's
 * hosted client metadata"): one stable client identity, no secret, no
 * per-connection registration.
 *
 * The fetch is attacker-controlled input, so it is SSRF-hardened: https only,
 * every resolved address must be globally routable, the socket is pinned to the
 * validated address (no DNS rebinding), no redirects, 5s timeout, 64 KiB cap.
 */

const MAX_BYTES = 64 * 1024;
const TIMEOUT_MS = 5_000;
const CACHE_TTL_MS = 60 * 60 * 1000;
export const CIMD_REGISTRATION = "cimd";

const DocumentSchema = z.object({
  client_id: z.string(),
  client_name: z.string().min(1).max(200),
  redirect_uris: z.array(z.string().min(1).max(2048)).min(1).max(20),
  client_uri: z.string().url().max(2048).optional(),
  logo_uri: z.string().url().max(2048).optional().or(z.literal("")),
  grant_types: z.array(z.string()).optional(),
  response_types: z.array(z.string()).optional(),
  token_endpoint_auth_method: z.string().optional(),
  scope: z.string().max(500).optional(),
  contacts: z.array(z.string().max(320)).max(10).optional(),
  software_id: z.string().max(200).optional(),
  software_version: z.string().max(100).optional(),
});

/** Is this client_id a metadata-document URL rather than a registered id? */
export function isCimdClientId(clientId: string): boolean {
  if (!/^https?:\/\//i.test(clientId)) return false;
  try {
    const url = new URL(clientId);
    return (
      url.pathname.length > 1 && !url.hash && !url.username && !url.password
    );
  } catch {
    return false;
  }
}

/** RFC 1918/6598/3927/5737/6890 and friends: anything not globally routable. */
export function isPrivateAddress(address: string): boolean {
  if (net.isIPv4(address)) {
    const [a, b] = address.split(".").map(Number) as [number, number];
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    );
  }
  if (net.isIPv6(address)) {
    const lower = address.toLowerCase();
    if (lower === "::" || lower === "::1") return true;
    if (lower.startsWith("::ffff:")) return isPrivateAddress(lower.slice(7));
    if (/^f[cd]/.test(lower)) return true; // fc00::/7 unique local
    if (/^fe[89ab]/.test(lower)) return true; // fe80::/10 link local
    if (lower.startsWith("2001:db8")) return true; // documentation
    return false;
  }
  return true;
}

@Injectable()
export class CimdService {
  private readonly logger = new Logger(CimdService.name);

  constructor(
    private prisma: PrismaService,
    private config: AppConfig,
  ) {}

  /**
   * Resolve a metadata-document client id to a client row, fetching and
   * validating the document when there is no fresh cached copy.
   */
  async resolve(clientId: string): Promise<OAuthClient> {
    const cached = await this.prisma.oAuthClient.findUnique({
      where: { clientId },
    });
    if (
      cached &&
      cached.registration === CIMD_REGISTRATION &&
      Date.now() - cached.updatedAt.getTime() < CACHE_TTL_MS
    ) {
      return cached;
    }

    const doc = await this.fetchDocument(clientId);
    const data = {
      clientId,
      secretHash: null,
      secretExpiresAt: null,
      name: doc.client_name,
      uri: doc.client_uri ?? null,
      logoUri: doc.logo_uri || null,
      redirectUris: doc.redirect_uris,
      grantTypes: doc.grant_types?.length
        ? doc.grant_types
        : ["authorization_code", "refresh_token"],
      responseTypes: doc.response_types?.length ? doc.response_types : ["code"],
      // Metadata-document clients are public clients: PKCE, never a secret.
      tokenEndpointAuthMethod: "none",
      scope: doc.scope ?? null,
      contacts: doc.contacts ?? [],
      softwareId: doc.software_id ?? null,
      softwareVersion: doc.software_version ?? null,
      registration: CIMD_REGISTRATION,
    };
    const client = await this.prisma.oAuthClient.upsert({
      where: { clientId },
      create: data,
      update: data,
    });
    this.logger.log(
      `resolved client metadata document ${clientId} (${doc.client_name})`,
    );
    return client;
  }

  private async fetchDocument(
    clientId: string,
  ): Promise<z.infer<typeof DocumentSchema>> {
    const fail = (msg: string): never => {
      throw new OAuthError(
        "invalid_client",
        `Client metadata document: ${msg}`,
        { status: 401 },
      );
    };
    let url: URL;
    try {
      url = new URL(clientId);
    } catch {
      return fail("client_id is not a valid URL");
    }
    const insecure = this.config.oauth.cimdAllowInsecure;
    if (url.protocol !== "https:" && !(insecure && url.protocol === "http:")) {
      return fail("client_id must be an https URL");
    }
    if (url.pathname.length <= 1) return fail("client_id must contain a path");

    // Resolve once, validate every address, then pin the socket to one of them.
    let addresses: dns.LookupAddress[];
    try {
      addresses = await dns.promises.lookup(url.hostname, { all: true });
    } catch {
      return fail(`cannot resolve ${url.hostname}`);
    }
    if (!addresses.length) return fail(`cannot resolve ${url.hostname}`);
    if (!insecure && addresses.some((a) => isPrivateAddress(a.address))) {
      return fail(`${url.hostname} resolves to a non-public address`);
    }
    const pinned = addresses[0]!;

    const raw = await new Promise<string>((resolve, reject) => {
      const lib = url.protocol === "https:" ? https : http;
      const req = lib.request(
        url,
        {
          method: "GET",
          headers: {
            accept: "application/json",
            "user-agent": "loreum-oauth/1.0",
          },
          timeout: TIMEOUT_MS,
          lookup: (_host, _opts, cb) =>
            (cb as (err: null, address: string, family: number) => void)(
              null,
              pinned.address,
              pinned.family,
            ),
        },
        (res) => {
          if (res.statusCode !== 200) {
            res.resume();
            reject(new Error(`HTTP ${res.statusCode}`));
            return;
          }
          let size = 0;
          const chunks: Buffer[] = [];
          res.on("data", (chunk: Buffer) => {
            size += chunk.length;
            if (size > MAX_BYTES) {
              req.destroy(new Error(`document exceeds ${MAX_BYTES} bytes`));
              return;
            }
            chunks.push(chunk);
          });
          res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
          res.on("error", reject);
        },
      );
      req.on("timeout", () => req.destroy(new Error("timed out")));
      req.on("error", reject);
      req.end();
    }).catch((err: Error) => fail(`fetch failed (${err.message})`));

    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      return fail("not valid JSON");
    }
    const parsed = DocumentSchema.safeParse(json);
    if (!parsed.success) {
      return fail(
        parsed.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; "),
      );
    }
    if (parsed.data.client_id !== clientId) {
      return fail("client_id in the document does not match the URL");
    }
    for (const uri of parsed.data.redirect_uris) {
      try {
        assertValidRedirectUri(uri);
      } catch (err) {
        return fail(err instanceof Error ? err.message : String(err));
      }
    }
    return parsed.data;
  }
}
