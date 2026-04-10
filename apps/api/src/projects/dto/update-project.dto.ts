import {
  IsString,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import type { UpdateProjectRequest } from "@loreum/types";

const VISIBILITY = ["PRIVATE", "PUBLIC", "UNLISTED"] as const;

export class UpdateProjectDto implements UpdateProjectRequest {
  @ApiPropertyOptional({ example: "Echo Chronicles" })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: "A world of embodied emotions" })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ enum: VISIBILITY, example: "PUBLIC" })
  @IsOptional()
  @IsEnum(VISIBILITY)
  visibility?: "PRIVATE" | "PUBLIC" | "UNLISTED";
}
