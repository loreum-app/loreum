export type Plan = "FREE" | "PRO" | "TEAM";

export type Feature = "mcp" | "api_keys" | "public_wiki";

export interface PlanLimits {
  /** null = unlimited */
  maxProjects: number | null;
}

/** Response of GET /billing/me. */
export interface BillingSummary {
  /** False until a payment provider is wired up; every account is then ungated. */
  billingEnabled: boolean;
  /** The plan the user is subscribed to (FREE when there is no subscription). */
  plan: Plan;
  /** The plan whose features and limits currently apply. */
  effectivePlan: Plan;
  features: Record<Feature, boolean>;
  /** Limits in force right now (from effectivePlan). */
  limits: PlanLimits;
  /** Limits of the subscribed plan, i.e. what will apply once billing is enabled. */
  planLimits: PlanLimits;
}
