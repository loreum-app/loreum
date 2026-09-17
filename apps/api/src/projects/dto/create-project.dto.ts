import {
  IsString,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type { CreateProjectRequest, ProjectVisibility } from "@loreum/types";

const VISIBILITY = ["PRIVATE", "PUBLIC", "UNLISTED"] as const;

export class CreateProjectDto implements CreateProjectRequest {
  @ApiProperty({ example: "Echo Chronicles" })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ example: "A world of embodied emotions" })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ enum: VISIBILITY, example: "PRIVATE" })
  @IsOptional()
  @IsEnum(VISIBILITY)
  visibility?: ProjectVisibility;
}
