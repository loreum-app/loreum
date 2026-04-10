import { IsString, IsOptional, MinLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type { CreatePlotlineRequest } from "@loreum/types";

export class CreatePlotlineDto implements CreatePlotlineRequest {
  @ApiProperty({ example: "The Quest for the Ring" })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  thematicStatement?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  parentPlotlineSlug?: string;
}
