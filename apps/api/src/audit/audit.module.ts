import { Global, Module } from "@nestjs/common";
import { ProjectsModule } from "../projects/projects.module";
import { AuditLedgerService } from "./audit-ledger.service";
import { AuditController } from "./audit.controller";

@Global()
@Module({
  imports: [ProjectsModule],
  controllers: [AuditController],
  providers: [AuditLedgerService],
  exports: [AuditLedgerService],
})
export class AuditModule {}
