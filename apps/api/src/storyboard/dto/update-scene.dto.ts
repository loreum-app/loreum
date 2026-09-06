import { IsString, IsOptional, IsInt } from "class-validator";
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locationSlug?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  timelineEventId?: string | null;
}
