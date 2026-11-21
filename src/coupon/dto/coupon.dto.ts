import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateCouponDto {
  @ApiProperty({ example: 'EID20' })
  @IsString()
  code: string;

  @ApiProperty({ enum: ['percentage', 'fixed'] })
  @IsIn(['percentage', 'fixed'])
  type: 'percentage' | 'fixed';

  @ApiProperty({ example: 20 })
  @Type(() => Number)
  @IsNumber()
  value: number;

  @ApiProperty({ example: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxUsage: number;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class UpdateCouponDto {
  @ApiPropertyOptional({ example: 'EID20' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ enum: ['percentage', 'fixed'] })
  @IsOptional()
  @IsIn(['percentage', 'fixed'])
  type?: 'percentage' | 'fixed';

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  value?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxUsage?: number;

  @ApiPropertyOptional({ nullable: true, example: null })
  @IsOptional()
  @IsDateString()
  expiresAt?: string | null;
}

export class ApplyCouponDto {
  @ApiProperty({ example: 'EID20' })
  @IsString()
  code: string;

  @ApiProperty({ example: 1000 })
  @Type(() => Number)
  @IsNumber()
  subtotal: number;
}
