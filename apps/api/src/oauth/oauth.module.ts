import { Module } from "@nestjs/common";
import { ProjectsModule } from "../projects/projects.module";
import { OAuthClientsService } from "./oauth-clients.service";
import { CimdService } from "./cimd.service";
import { ConnectionsService } from "./connections.service";
import { OAuthService } from "./oauth.service";
import { OAuthController } from "./oauth.controller";
import { WellKnownController } from "./well-known.controller";
import { ConnectionsController } from "./connections.controller";

/**
 * OAuth 2.1 authorization server + connection (grant) management for MCP.
 * ConnectionsService is exported for the MCP guard's token resolution.
 */
@Module({
  imports: [ProjectsModule],
  controllers: [OAuthController, WellKnownController, ConnectionsController],
  providers: [
    CimdService,
    OAuthClientsService,
    ConnectionsService,
    OAuthService,
  ],
  exports: [ConnectionsService, OAuthClientsService],
})
export class OAuthModule {}
