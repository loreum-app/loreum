import { ForbiddenException, Injectable } from "@nestjs/common";
import { Plan } from "../../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AppConfig } from "../config/app.config";

export type Feature = "mcp" | "api_keys" | "public_wiki";

export interface PlanLimits {
  /** null = unlimited */
  maxProjects: number | null;
}

/**
 * What each plan includes. Edit this table when pricing changes; nothing else
 * needs to know plan names. Mirrors the public pricing page.
 */
export const PLAN_FEATURES: Record<Plan, Record<Feature, boolean>> = {
  FREE: { mcp: true, api_keys: true, public_wiki: true },
  PRO: { mcp: true, api_keys: true, public_wiki: true },
  TEAM: { mcp: true, api_keys: true, public_wiki: true },
};

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  FREE: { maxProjects: 1 },
  PRO: { maxProjects: null },
  TEAM: { maxProjects: null },
};

/** The plan everyone is treated as while billing is disabled. */
const UNGATED_PLAN: Plan = "TEAM";

/**
 * Plan gating. Dormant unless BILLING_ENABLED=true: with billing off every
 * user is treated as being on the top plan so no feature or limit applies.
 * There is no payment provider yet; the Subscription row is the source of
 * truth for a user's plan and is meant to be written by a future Stripe (or
 * other) webhook handler.
 */
@Injectable()
export class EntitlementsService {
  constructor(
    private prisma: PrismaService,
    private config: AppConfig,
  ) {}

  get enabled(): boolean {
    return this.config.billing.enabled;
  }

  /** The plan a user is billed on (FREE when no subscription row exists). */
  async getSubscribedPlan(userId: string): Promise<Plan> {
    const sub = await this.prisma.subscription.findUnique({
      where: { userId },
      select: { plan: true, status: true },
    });
    if (!sub || sub.status === "CANCELED") return "FREE";
    return sub.plan;
  }

  /** The plan whose features/limits actually apply right now. */
  async getEffectivePlan(userId: string): Promise<Plan> {
    if (!this.enabled) return UNGATED_PLAN;
    return this.getSubscribedPlan(userId);
  }

  async can(userId: string, feature: Feature): Promise<boolean> {
    const plan = await this.getEffectivePlan(userId);
    return PLAN_FEATURES[plan][feature];
  }

  async assertFeature(userId: string, feature: Feature): Promise<void> {
    if (!(await this.can(userId, feature))) {
      throw new ForbiddenException(
        `Your current plan does not include ${feature.replace("_", " ")}. Upgrade to continue.`,
      );
    }
  }

  async limits(userId: string): Promise<PlanLimits> {
    return PLAN_LIMITS[await this.getEffectivePlan(userId)];
  }

  /** Summary for the account UI. */
  async summary(userId: string) {
    const [plan, effective] = await Promise.all([
      this.getSubscribedPlan(userId),
      this.getEffectivePlan(userId),
    ]);
    return {
      billingEnabled: this.enabled,
      plan,
      effectivePlan: effective,
      features: PLAN_FEATURES[effective],
      limits: PLAN_LIMITS[effective],
    };
  }
}
