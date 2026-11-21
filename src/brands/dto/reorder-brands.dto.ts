import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class ReorderBrandItemDto {
  @ApiProperty({ description: 'Brand ID being positioned' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Zero-based position in the brand list' })
  @IsInt()
  @Min(0)
  sortOrder: number;
}

export class ReorderBrandsDto {
  @ApiProperty({ type: [ReorderBrandItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReorderBrandItemDto)
  items: ReorderBrandItemDto[];
}
