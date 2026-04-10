import { IsString, IsOptional, IsArray, MinLength } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import type { UpdateLoreArticleRequest } from "@loreum/types";

export class UpdateLoreArticleDto implements UpdateLoreArticleRequest {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  content?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  entitySlugs?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
