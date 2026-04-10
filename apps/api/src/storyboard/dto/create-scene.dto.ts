import { IsString, IsOptional, IsInt } from "class-validator";
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  plotlineSlug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  povCharacterSlug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locationSlug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  timelineEventId?: string;
}
