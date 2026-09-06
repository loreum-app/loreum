import { Global, Module } from "@nestjs/common";
import { EntitlementsService } from "./entitlements.service";
import { BillingController } from "./billing.controller";

/**
 * Plan/entitlement plumbing. Global so any service can gate on a feature.
 * No payment provider is wired; see EntitlementsService.
 */
@Global()
@Module({
  controllers: [BillingController],
  providers: [EntitlementsService],
  exports: [EntitlementsService],
})
export class BillingModule {}
