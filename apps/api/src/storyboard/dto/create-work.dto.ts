import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  MinLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type { CreateWorkRequest } from "@loreum/types";

const WORK_STATUS = [
  "concept",
  "outlining",
  "drafting",
  "revision",
  "complete",
] as const;

export class CreateWorkDto implements CreateWorkRequest {
  @ApiProperty({ example: "The Fellowship of the Ring" })
  @IsString()
  @MinLength(1)
  title!: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  chronologicalOrder!: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  releaseOrder!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  synopsis?: string;

  @ApiPropertyOptional({ enum: WORK_STATUS })
  @IsOptional()
  @IsEnum(WORK_STATUS)
  status?: "concept" | "outlining" | "drafting" | "revision" | "complete";
}
