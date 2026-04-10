import { IsString, IsOptional, MinLength, MaxLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type { CreateProjectRequest } from "@loreum/types";

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
}
