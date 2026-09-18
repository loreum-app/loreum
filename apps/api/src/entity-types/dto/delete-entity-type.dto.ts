import { IsEnum, IsOptional, IsString } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

/**
 * What to do with the entities of a type being deleted. Required whenever the
 * type still has entities: without it the entities would silently lose their
 * type and become unreachable in the UI, which only lists items by type.
 */
export class DeleteEntityTypeQueryDto {
  @ApiPropertyOptional({
    enum: ["move", "delete"],
    description:
      "move: reassign the entities to the type in `to`. delete: delete the entities too.",
  })
  @IsOptional()
  @IsEnum(["move", "delete"])
  entities?: "move" | "delete";

  @ApiPropertyOptional({
    example: "relics",
    description: "Slug of the destination type. Required when entities=move.",
  })
  @IsOptional()
  @IsString()
  to?: string;
}
