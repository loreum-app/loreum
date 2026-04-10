import { IsString, IsOptional, IsEnum, MinLength, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

const WORK_STATUS = ['concept', 'outlining', 'drafting', 'revision', 'complete'] as const;

export class UpdateWorkDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  synopsis?: string;

  @ApiPropertyOptional({ enum: WORK_STATUS })
  @IsOptional()
  @IsEnum(WORK_STATUS)
  status?: 'concept' | 'outlining' | 'drafting' | 'revision' | 'complete';
}
