import { IsString, IsOptional, IsArray, MinLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type { CreateLoreArticleRequest } from "@loreum/types";

export class CreateLoreArticleDto implements CreateLoreArticleRequest {
  @ApiProperty({ example: "The One Ring" })
  @IsString()
  @MinLength(1)
  title!: string;

  @ApiProperty({ example: "The One Ring was forged by..." })
  @IsString()
  @MinLength(1)
  content!: string;

  @ApiPropertyOptional({ example: "artifacts" })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: ["sauron", "frodo"] })
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
