import { IsString, IsOptional, IsInt, MinLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type { CreateChapterRequest } from "@loreum/types";

export class CreateChapterDto implements CreateChapterRequest {
  @ApiProperty({ example: "A Long-Expected Party" })
  @IsString()
  @MinLength(1)
  title!: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  sequenceNumber!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
