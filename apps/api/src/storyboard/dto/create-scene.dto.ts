import { IsString, IsOptional, IsInt, IsArray } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type { CreateSceneRequest } from "@loreum/types";

export class CreateSceneDto implements CreateSceneRequest {
  @ApiProperty()
  @IsString()
  chapterId!: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  sequenceNumber!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: "Narrative prose of the scene" })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  plotlineSlug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  povCharacterSlug?: string;

  @ApiPropertyOptional({ description: "Non-POV character entity slugs" })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  characterSlugs?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locationSlug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  timelineEventId?: string;

  @ApiPropertyOptional({ description: "Scene-specific style notes" })
  @IsOptional()
  @IsString()
  styleNotes?: string;
}
