import {
  IsString,
  IsOptional,
  IsArray,
  IsObject,
  ValidateNested,
  MinLength,
  MaxLength,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";
import type { UpdateEntityRequest } from "@loreum/types";

class CharacterFieldsDto {
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() species?: string;
  @IsOptional() @IsString() age?: string;
  @IsOptional() @IsString() role?: string;
}

class LocationFieldsDto {
  @IsOptional() @IsString() region?: string;
  @IsOptional() @IsString() condition?: string;
  @IsOptional() @IsString() mapId?: string;
}

class OrganizationFieldsDto {
  @IsOptional() @IsString() ideology?: string;
  @IsOptional() @IsString() territory?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() parentOrgId?: string;
}

class ItemFieldsDto {
  @IsOptional() @IsString() itemTypeId?: string;
  @IsOptional() @IsObject() fields?: Record<string, unknown>;
}

export class UpdateEntityDto implements UpdateEntityRequest {
  @ApiPropertyOptional({ example: "Gandalf the White" })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  backstory?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  secrets?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ example: ["wizard", "fellowship"] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => CharacterFieldsDto)
  character?: CharacterFieldsDto;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationFieldsDto)
  location?: LocationFieldsDto;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => OrganizationFieldsDto)
  organization?: OrganizationFieldsDto;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => ItemFieldsDto)
  item?: ItemFieldsDto;
}
