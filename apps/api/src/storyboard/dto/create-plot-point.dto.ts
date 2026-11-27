import { IsString, IsOptional, IsInt, IsArray } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type { CreatePlotPointRequest } from "@loreum/types";

export class CreatePlotPointDto implements CreatePlotPointRequest {
  @ApiProperty({ example: "Inciting Incident" })
  @IsString()
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: "inciting incident" })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  sequenceNumber!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sceneId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  timelineEventId?: string;

  @ApiPropertyOptional({ description: "Entity slugs for this beat" })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  entitySlugs?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locationSlug?: string;
}
