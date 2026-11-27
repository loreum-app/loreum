import { IsString, IsOptional, IsInt, IsArray } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateSceneDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sequenceNumber?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ description: "Narrative prose of the scene" })
  @IsOptional()
  @IsString()
  content?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  plotlineSlug?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  povCharacterSlug?: string | null;

  @ApiPropertyOptional({ description: "Non-POV character entity slugs" })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  characterSlugs?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locationSlug?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  timelineEventId?: string | null;

  @ApiPropertyOptional({ description: "Scene-specific style notes" })
  @IsOptional()
  @IsString()
  styleNotes?: string | null;
}
