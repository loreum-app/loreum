import {
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  IsArray,
  IsEnum,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type { CreateTimelineEventRequest } from "@loreum/types";

const SIGNIFICANCE = ["minor", "moderate", "major", "critical"] as const;

export class CreateTimelineEventDto implements CreateTimelineEventRequest {
  @ApiProperty({ example: "Battle of Helm's Deep" })
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: "TA 3019-03-03" })
  @IsString()
  date!: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  sortOrder!: number;

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

  @ApiPropertyOptional({
    example: 35421.5,
    description: "Numeric date value for gantt mapping",
  })
  @IsOptional()
  @IsNumber()
  dateValue?: number;

  @ApiPropertyOptional({
    description: "End date string (for standard calendar)",
  })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({
    description: "Numeric end date value (for custom timeline)",
  })
  @IsOptional()
  @IsNumber()
  endDateValue?: number;

  @ApiPropertyOptional({ description: "Era slug to associate with" })
  @IsOptional()
  @IsString()
  eraSlug?: string;

  @ApiPropertyOptional({ example: ["aragorn", "legolas"] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  entitySlugs?: string[];
}
