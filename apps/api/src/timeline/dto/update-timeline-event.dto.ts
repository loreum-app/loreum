import {
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  IsArray,
  IsEnum,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import type { UpdateTimelineEventRequest } from "@loreum/types";

const SIGNIFICANCE = ["minor", "moderate", "major", "critical"] as const;

export class UpdateTimelineEventDto implements UpdateTimelineEventRequest {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  periodStart?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  periodEnd?: string;

  @ApiPropertyOptional({ enum: SIGNIFICANCE })
  @IsOptional()
  @IsEnum(SIGNIFICANCE)
  significance?: "minor" | "moderate" | "major" | "critical";

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  dateValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  endDateValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  eraSlug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  entitySlugs?: string[];
}
