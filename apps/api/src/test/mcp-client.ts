import { INestApplication } from "@nestjs/common";
import request from "supertest";

/**
 * Minimal 2025-era MCP client for integration tests: raw JSON-RPC over
 * Streamable HTTP. The stateless server answers legacy requests as SSE, so
 * responses are parsed from `data:` frames.
 */

export interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: number | string | null;
  result?: Record<string, unknown> & {
    tools?: { name: string; annotations?: Record<string, unknown> }[];
    content?: { type: string; text: string }[];
    isError?: boolean;
    serverInfo?: { name: string; version: string };
  };
  error?: { code: number; message: string; data?: unknown };
}

export function parseMcpBody(res: request.Response): JsonRpcResponse {
  const ct = res.headers["content-type"] ?? "";
  if (ct.includes("text/event-stream")) {
    const text: string =
      typeof res.text === "string" ? res.text : String(res.body);
    const messages = text
      .split(/\r?\n/)
      .filter((l) => l.startsWith("data:"))
      .map((l) => JSON.parse(l.slice(5).trim()) as JsonRpcResponse);
    // The last message is the response to our request; earlier ones would be notifications.
    return (
      messages.filter((m) => "id" in m && m.id !== null).at(-1) ??
      messages.at(-1)!
    );
  }
  return (
    typeof res.body === "object" && res.body ? res.body : JSON.parse(res.text)
  ) as JsonRpcResponse;
}

export class TestMcpClient {
  private nextId = 1;

  constructor(
    private app: INestApplication,
    private path: string,
    private token: string | null,
  ) {}

  raw(body: object) {
    let req = request(this.app.getHttpServer())
      .post(this.path)
      .set("Accept", "application/json, text/event-stream")
      .set("Content-Type", "application/json")
      .buffer(true)
      .parse((res, cb) => {
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (chunk: string) => (data += chunk));
        res.on("end", () => cb(null, data));
      });
    if (this.token) req = req.set("Authorization", `Bearer ${this.token}`);
    return req.send(body);
  }

  async rpc(method: string, params: object = {}) {
    const res = await this.raw({
      jsonrpc: "2.0",
      id: this.nextId++,
      method,
      params,
    });
    return {
      status: res.status,
      headers: res.headers,
      message: res.status === 200 ? parseMcpBody(res) : null,
      text: res.text,
    };
  }

  initialize() {
    return this.rpc("initialize", {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: "loreum-test", version: "1.0.0" },
    });
  }

  async listTools(): Promise<string[]> {
    const { status, message } = await this.rpc("tools/list");
    if (status !== 200 || !message?.result?.tools) {
      throw new Error(
        `tools/list failed: ${status} ${JSON.stringify(message)}`,
      );
    }
    return message.result.tools.map((t) => t.name);
  }

  async listToolsFull() {
    const { message } = await this.rpc("tools/list");
    return message!.result!.tools!;
  }

  /** Call a tool; returns the parsed JSON payload (or the error result). */
  async call<T = unknown>(
    name: string,
    args: object = {},
  ): Promise<{ ok: boolean; data: T; text: string; message: JsonRpcResponse }> {
    const { status, message } = await this.rpc("tools/call", {
      name,
      arguments: args,
    });
    if (status !== 200 || !message)
      throw new Error(`tools/call ${name} → HTTP ${status}`);
    if (message.error) {
      return {
        ok: false,
        data: message.error as unknown as T,
        text: message.error.message,
        message,
      };
    }
    const text = message.result?.content?.[0]?.text ?? "";
    let data: unknown = text;
    try {
      data = JSON.parse(text);
    } catch {
      /* plain text result */
    }
    return { ok: !message.result?.isError, data: data as T, text, message };
  }
}
