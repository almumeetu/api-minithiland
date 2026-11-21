import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class BulkDeleteDto {
  @ApiProperty({ type: [String], description: 'Array of item IDs to delete' })
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}

