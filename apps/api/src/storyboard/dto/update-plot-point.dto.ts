import { IsString, IsOptional, IsInt } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  entitySlug?: string | null;
}
