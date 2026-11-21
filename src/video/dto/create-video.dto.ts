import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

const toBoolean = ({ value }: { value: unknown }) => {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  return value;
};

const toInt = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = parseInt(String(value), 10);
  return isNaN(parsed) ? undefined : parsed;
};

export class CreateVideoDto {
  @ApiProperty({ description: 'Video title', example: 'Thai Cord Set — Rose Pink Special' })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  title: string;

  @ApiProperty({ description: 'Video caption (Bengali / English)', required: false })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  caption?: string;

  @ApiProperty({ description: 'Video type', enum: ['reel', 'video'], default: 'reel', required: false })
  @IsEnum(['reel', 'video'])
  @IsOptional()
  type?: 'reel' | 'video';

  @ApiProperty({ description: 'Video source', enum: ['facebook', 'upload'], default: 'facebook', required: false })
  @IsEnum(['facebook', 'upload'])
  @IsOptional()
  source?: 'facebook' | 'upload';

  @ApiProperty({ description: 'Facebook video or reel URL', required: false })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  facebookUrl?: string;

  @ApiProperty({ description: 'Uploaded video URL or HLS URL', required: false })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  videoUrl?: string;

  @ApiProperty({ description: 'Thumbnail URL', required: false })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  thumbnailUrl?: string;

  @ApiProperty({ description: 'Duration in seconds', required: false, default: 0 })
  @IsInt()
  @IsOptional()
  @Transform(toInt)
  durationSec?: number;

  @ApiProperty({ description: 'Views count (display string)', required: false, example: '18.4K' })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  views?: string;

  @ApiProperty({ description: 'Likes count (display string)', required: false, example: '1.2K' })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  likes?: string;

  @ApiProperty({ description: 'Linked product ID', required: false })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  productId?: string;

  @ApiProperty({ description: 'Whether video is featured on homepage / top', required: false, default: false })
  @IsBoolean()
  @IsOptional()
  @Transform(toBoolean)
  isFeatured?: boolean;

  @ApiProperty({ description: 'Whether video is active and publicly visible', required: false, default: true })
  @IsBoolean()
  @IsOptional()
  @Transform(toBoolean)
  isActive?: boolean;

  @ApiProperty({ description: 'Sorting order index', required: false, default: 0 })
  @IsInt()
  @IsOptional()
  @Transform(toInt)
  sortOrder?: number;
}
