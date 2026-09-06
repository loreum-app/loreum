import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";
import { ApiKeyPermission } from "../../../generated/prisma/client";

/** Body of POST /v1/oauth/consent — the original authorize params plus the decision. */
export class ConsentDto {
  @IsIn(["allow", "deny"])
  decision!: "allow" | "deny";

  @IsOptional()
  @IsString()
  @MaxLength(100)
  projectSlug?: string;

  @IsOptional()
  @IsIn(["READ_ONLY", "READ_WRITE"])
  permissions?: ApiKeyPermission;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  response_type?: string;

  @IsString()
  @MaxLength(500)
  client_id!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  redirect_uri?: string;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  code_challenge?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  code_challenge_method?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  scope?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  state?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  resource?: string;
}
