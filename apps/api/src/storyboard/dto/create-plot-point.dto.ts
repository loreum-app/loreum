import { IsString, IsOptional, IsInt } from "class-validator";
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  entitySlug?: string;
}
