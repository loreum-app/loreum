import { describe, expect, it } from "vitest";
import { ArgumentsHost } from "@nestjs/common";
import { PrismaClientValidationError } from "../../../generated/prisma/internal/prismaNamespace";
import { PrismaExceptionFilter } from "./prisma-exception.filter";

function captureResponse() {
  const captured: { status?: number; body?: unknown } = {};
  const response = {
    status(code: number) {
      captured.status = code;
      return response;
    },
    json(body: unknown) {
      captured.body = body;
      return response;
    },
  };
  const host = {
    switchToHttp: () => ({ getResponse: () => response }),
  } as unknown as ArgumentsHost;
  return { captured, host };
}

describe("PrismaExceptionFilter", () => {
  it("answers a query the Prisma client rejects as a server error, not a bad request", () => {
    // A client generated from an older schema rejects fields it does not know.
    // The caller's input was fine, so a 400 would blame them for a server fault.
    const { captured, host } = captureResponse();
    const error = new PrismaClientValidationError(
      "Unknown argument `description`. Available options are marked with ?.",
      { clientVersion: "7.10.0" },
    );

    new PrismaExceptionFilter().catch(error, host);

    expect(captured).toEqual({
      status: 500,
      body: { statusCode: 500, message: "Internal server error" },
    });
  });
});
