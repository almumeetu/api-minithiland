import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

const toBoolean = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  return undefined;
};

const toInt = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = parseInt(String(value), 10);
  return isNaN(parsed) ? undefined : parsed;
};

export class QueryVideoDto {
  @ApiProperty({ required: false, default: 1 })
  @IsInt()
  @IsOptional()
  @Transform(toInt)
  page?: number = 1;

  @ApiProperty({ required: false, default: 20 })
  @IsInt()
  @IsOptional()
  @Transform(toInt)
  limit?: number = 20;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({ required: false, enum: ['reel', 'video'] })
  @IsEnum(['reel', 'video'])
  @IsOptional()
  type?: 'reel' | 'video';

  @ApiProperty({ required: false, enum: ['facebook', 'upload'] })
  @IsEnum(['facebook', 'upload'])
  @IsOptional()
  source?: 'facebook' | 'upload';

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  productId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  @Transform(toBoolean)
  isFeatured?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  @Transform(toBoolean)
  isActive?: boolean;

  @ApiProperty({ required: false, enum: ['latest', 'views', 'likes', 'order', 'featured'] })
  @IsString()
  @IsOptional()
  sort?: 'latest' | 'views' | 'likes' | 'order' | 'featured';
}

export class ReorderVideoItemDto {
  id: string;
  sortOrder: number;
}

export class ReorderVideosDto {
  items: ReorderVideoItemDto[];
}
