import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, api } from "./api";

function mockFetch(status: number, body: string, contentType = "text/plain") {
  return vi.fn(
    async () =>
      new Response(status === 204 ? null : body, {
        status,
        headers: { "content-type": contentType },
      }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("api", () => {
  it("returns the parsed body of a successful response", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch(
        200,
        JSON.stringify({ name: "Ember Coast" }),
        "application/json",
      ),
    );

    await expect(api<{ name: string }>("/projects")).resolves.toEqual({
      name: "Ember Coast",
    });
  });

  it("resolves without a body for 204 responses", async () => {
    vi.stubGlobal("fetch", mockFetch(204, ""));

    await expect(
      api("/projects/x", { method: "DELETE" }),
    ).resolves.toBeUndefined();
  });

  it("raises the server's message so callers can show it verbatim", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch(
        409,
        JSON.stringify({
          message: 'Another entity of this type is already called "Guard".',
        }),
        "application/json",
      ),
    );

    await expect(
      api("/projects/x/entities", { method: "POST" }),
    ).rejects.toThrow('Another entity of this type is already called "Guard".');
  });

  it("exposes the status on the raised error", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch(403, JSON.stringify({ message: "Nope" }), "application/json"),
    );

    const error = await api("/projects").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(403);
  });

  it("joins validation messages returned as a list", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch(
        400,
        JSON.stringify({
          message: ["name must not be empty", "type is invalid"],
        }),
        "application/json",
      ),
    );

    await expect(api("/projects", { method: "POST" })).rejects.toThrow(
      "name must not be empty; type is invalid",
    );
  });

  it("falls back to the status when the body is not JSON", async () => {
    vi.stubGlobal("fetch", mockFetch(500, ""));

    await expect(api("/projects")).rejects.toThrow("API error 500");
  });
});
