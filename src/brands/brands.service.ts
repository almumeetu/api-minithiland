import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class BrandsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
  ) { }

  async create(createBrandDto: CreateBrandDto, file?: Express.Multer.File) {
    let logoUrl = createBrandDto.logoUrl;

    if (file) {
      logoUrl = await this.uploadService.uploadFile(file, 'brands');
    }

    const lastBrand = await this.prisma.brand.findFirst({
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    return this.prisma.brand.create({
      data: {
        ...createBrandDto,
        logoUrl,
        sortOrder: (lastBrand?.sortOrder ?? -1) + 1,
      },
    });
  }

  findAll() {
    return this.prisma.brand.findMany({
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
      include: { _count: { select: { products: true } } },
    });
  }

  async reorder(items: { id: string; sortOrder: number }[]) {
    const ids = new Set<string>();
    const positions = new Set<number>();

    for (const item of items) {
      if (ids.has(item.id)) {
        throw new BadRequestException(`Brand ${item.id} appears more than once`);
      }
      if (positions.has(item.sortOrder)) {
        throw new BadRequestException(`Brand position ${item.sortOrder} appears more than once`);
      }
      ids.add(item.id);
      positions.add(item.sortOrder);
    }

    const orderedPositions = [...positions].sort((a, b) => a - b);
    if (orderedPositions.some((position, index) => position !== index)) {
      throw new BadRequestException('Brand positions must be zero-based and contiguous');
    }

    const existing = await this.prisma.brand.findMany({ select: { id: true } });
    const existingIds = new Set(existing.map((brand) => brand.id));
    const missing = [...existingIds].filter((id) => !ids.has(id));
    const unknown = [...ids].filter((id) => !existingIds.has(id));
    if (missing.length || unknown.length) {
      throw new BadRequestException(
        'The reorder request must include every current brand and no unknown brands',
      );
    }

    await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.brand.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        }),
      ),
    );

    return this.findAll();
  }

  async findOne(id: string) {
    const brand = await this.prisma.brand.findUnique({
      where: { id },
    });

    if (!brand) {
      throw new NotFoundException(`Brand with ID ${id} not found`);
    }

    return brand;
  }

  async update(id: string, updateBrandDto: UpdateBrandDto, file?: Express.Multer.File) {
    const existingBrand = await this.findOne(id);
    let logoUrl: string | null | undefined = updateBrandDto.logoUrl;

    if (file) {
      // Delete old logo if it exists
      if (existingBrand.logoUrl) {
        await this.uploadService.deleteFile(existingBrand.logoUrl);
      }
      logoUrl = await this.uploadService.uploadFile(file, 'brands');
    } else if (updateBrandDto.logoUrl === '') {
      if (existingBrand.logoUrl) {
        await this.uploadService.deleteFile(existingBrand.logoUrl);
      }
      logoUrl = null;
    }

    return this.prisma.brand.update({
      where: { id },
      data: {
        ...updateBrandDto,
        logoUrl,
      },
    });
  }

  async uploadLogo(id: string, file: Express.Multer.File) {
    const existingBrand = await this.findOne(id);

    // Delete old logo if it exists
    if (existingBrand.logoUrl) {
      await this.uploadService.deleteFile(existingBrand.logoUrl);
    }

    const logoUrl = await this.uploadService.uploadFile(file, 'brands');

    return this.prisma.brand.update({
      where: { id },
      data: { logoUrl },
    });
  }

  async remove(id: string) {
    const brand = await this.findOne(id);
    const productCount = await this.prisma.product.count({
      where: { brandId: id },
    });

    if (productCount > 0) {
      throw new ConflictException(
        `Cannot delete "${brand.name}" because ${productCount} product(s) still use this brand. Reassign or delete those products first.`,
      );
    }

    let deletedBrand;
    try {
      deletedBrand = await this.prisma.brand.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === 'P2003' || error.code === 'P2014')
      ) {
        throw new ConflictException(
          `Cannot delete "${brand.name}" while products still use this brand. Reassign or delete those products first.`,
        );
      }
      throw error;
    }

    if (brand.logoUrl) {
      try {
        await this.uploadService.deleteFile(brand.logoUrl);
      } catch {
        // Keep a successful database deletion successful if logo cleanup fails.
      }
    }

    return deletedBrand;
  }

  async removeMany(ids: string[]) {
    if (!ids || ids.length === 0) {
      return { message: 'No brand IDs provided', count: 0 };
    }

    const uniqueIds = [...new Set(ids)];
    const brands = await this.prisma.brand.findMany({
      where: { id: { in: uniqueIds } },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        _count: { select: { products: true } },
      },
    });

    const brandsInUse = brands.filter((brand) => brand._count.products > 0);
    if (brandsInUse.length > 0) {
      const details = brandsInUse
        .map((brand) => `${brand.name} (${brand._count.products} product(s))`)
        .join(', ');
      throw new ConflictException(
        `Cannot delete selected brands because products still use: ${details}. Reassign or delete those products first.`,
      );
    }

    let result;
    try {
      result = await this.prisma.brand.deleteMany({
        where: { id: { in: uniqueIds } },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === 'P2003' || error.code === 'P2014')
      ) {
        throw new ConflictException(
          'Cannot delete the selected brands while products still use them. Reassign or delete those products first.',
        );
      }
      throw error;
    }

    for (const brand of brands) {
      if (brand.logoUrl) {
        try {
          await this.uploadService.deleteFile(brand.logoUrl);
        } catch {
          // Keep successful database deletions successful if logo cleanup fails.
        }
      }
    }

    return {
      message: 'Brands deleted successfully',
      count: result.count,
      failed: uniqueIds.length - result.count,
    };
  }
}
