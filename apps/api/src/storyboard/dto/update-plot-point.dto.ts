import { IsString, IsOptional, IsInt, IsArray } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdatePlotPointDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sequenceNumber?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sceneId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  timelineEventId?: string | null;

  @ApiPropertyOptional({ description: "Entity slugs for this beat" })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  entitySlugs?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locationSlug?: string | null;
}
