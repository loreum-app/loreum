import { IsString, IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class AddOrgMemberDto {
  @ApiProperty({ description: "Slug of the character entity to add" })
  @IsString()
  characterSlug!: string;

  @ApiPropertyOptional({ description: "Role within the organization" })
  @IsOptional()
  @IsString()
  role?: string;
}
