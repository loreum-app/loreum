import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { INestApplication } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import { PrismaService } from "../prisma/prisma.service";
import {
  createTestApp,
  createAuthenticatedUser,
  cleanDatabase,
  giveSubscription,
} from "../test/helpers";

describe("Billing (integration)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let module: TestingModule;
  let authCookie: string;
  let csrfToken: string;
  let userId: string;

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
    userId = auth.user.id;
  });

  describe("GET /v1/billing/me", () => {
    it("reports the top plan as effective while billing is disabled, alongside the subscribed plan's own limits", async () => {
      const res = await request(app.getHttpServer())
        .get("/v1/billing/me")
        .set("Cookie", authCookie)
        .set("x-csrf-token", csrfToken)
        .expect(200);

      expect(res.body).toEqual({
        billingEnabled: false,
        plan: "FREE",
        effectivePlan: "TEAM",
        features: { mcp: true, api_keys: true, public_wiki: true },
        limits: { maxProjects: null },
        planLimits: { maxProjects: 1 },
      });
    });

    it("reports a subscriber's plan as both subscribed and effective once billing is enabled", async () => {
      await giveSubscription(prisma, userId, "PRO");
      process.env.BILLING_ENABLED = "true";
      try {
        const res = await request(app.getHttpServer())
          .get("/v1/billing/me")
          .set("Cookie", authCookie)
          .set("x-csrf-token", csrfToken)
          .expect(200);

        expect(res.body).toEqual({
          billingEnabled: true,
          plan: "PRO",
          effectivePlan: "PRO",
          features: { mcp: true, api_keys: true, public_wiki: true },
          limits: { maxProjects: null },
          planLimits: { maxProjects: null },
        });
      } finally {
        delete process.env.BILLING_ENABLED;
      }
    });
  });
});
