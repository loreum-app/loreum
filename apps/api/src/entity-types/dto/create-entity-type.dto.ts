import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  MinLength,
  MaxLength,
  IsEnum,
  IsBoolean,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type {
  CreateItemTypeRequest,
  FieldDefinition,
  FieldType,
} from "@loreum/types";

const FIELD_TYPES = [
  "text",
  "textarea",
  "number",
  "boolean",
  "select",
  "multi_select",
  "date",
  "url",
  "entity_ref",
] as const;

export class FieldDefinitionDto implements FieldDefinition {
  @ApiProperty({ example: "age" })
  @IsString()
  key!: string;

  @ApiProperty({ example: "Age" })
  @IsString()
  label!: string;

  @ApiProperty({ enum: FIELD_TYPES, example: "number" })
  @IsEnum(FIELD_TYPES)
  type!: FieldType;

  @ApiPropertyOptional({ example: ["option1", "option2"] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  entityTypeSlug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateEntityTypeDto implements CreateItemTypeRequest {
  @ApiProperty({ example: "Weapon" })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name!: string;

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
