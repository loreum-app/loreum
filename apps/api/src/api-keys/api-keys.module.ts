import { Global, Module } from "@nestjs/common";
import { ProjectsModule } from "../projects/projects.module";
import { ApiKeysController } from "./api-keys.controller";
import { ApiKeysService } from "./api-keys.service";
import { ApiKeyAuthGuard } from "../auth/guards/api-key-auth.guard";

@Global()
@Module({
  imports: [ProjectsModule],
  controllers: [ApiKeysController],
  providers: [ApiKeysService, ApiKeyAuthGuard],
  exports: [ApiKeysService, ApiKeyAuthGuard],
})
export class ApiKeysModule {}
