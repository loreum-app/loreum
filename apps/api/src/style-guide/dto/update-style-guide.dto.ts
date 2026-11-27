import { IsString, IsOptional, IsIn } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import type { UpdateStyleGuideRequest } from "@loreum/types";

const POV_VALUES = [
  "first",
  "second",
  "third-limited",
  "third-omniscient",
] as const;
const TENSE_VALUES = ["past", "present"] as const;

export class UpdateStyleGuideDto implements UpdateStyleGuideRequest {
  @ApiPropertyOptional({ enum: POV_VALUES })
  @IsOptional()
  @IsString()
  @IsIn(POV_VALUES)
  pov?: string;

  @ApiPropertyOptional({ enum: TENSE_VALUES })
  @IsOptional()
  @IsString()
  @IsIn(TENSE_VALUES)
  tense?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  voice?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pacing?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dialogueRules?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  proseStyle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vocabulary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customRules?: string;
}
