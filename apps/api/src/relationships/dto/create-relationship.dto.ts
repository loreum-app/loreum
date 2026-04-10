import { IsString, IsOptional, IsObject, IsBoolean } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type { CreateRelationshipRequest } from "@loreum/types";

export class CreateRelationshipDto implements CreateRelationshipRequest {
  @ApiProperty({ example: "gandalf" })
  @IsString()
  sourceEntitySlug!: string;

  @ApiProperty({ example: "frodo" })
  @IsString()
  targetEntitySlug!: string;

  @ApiProperty({ example: "Mentor" })
  @IsString()
  label!: string;

  @ApiPropertyOptional({
    example: "Gandalf guides Frodo through the early stages of the quest.",
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  bidirectional?: boolean;
}
