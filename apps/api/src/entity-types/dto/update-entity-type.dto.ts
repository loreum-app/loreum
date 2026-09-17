import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  MinLength,
  MaxLength,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";
import type { UpdateItemTypeRequest } from "@loreum/types";
import { FieldDefinitionDto } from "./create-entity-type.dto";

export class UpdateEntityTypeDto implements UpdateItemTypeRequest {
  @ApiPropertyOptional({ example: "Weapon" })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional({ example: "Weapons, armor, and other gear." })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: "sword" })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ example: "#3b82f6" })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ type: [FieldDefinitionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldDefinitionDto)
  fieldSchema?: FieldDefinitionDto[];
}
