import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ReorderCategoriesDto } from './dto/reorder-categories.dto';

@Injectable()
export class CategoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
  ) {}

  async create(
    createCategoryDto: CreateCategoryDto,
    image?: Express.Multer.File,
  ) {
    const {
      parentId,
      imageUrl: _imageUrl,
      image: _image,
      ...data
    } = createCategoryDto;
    // Only set imageUrl when an actual image file is uploaded; otherwise null.
    let finalImageUrl: string | null = null;

    // If parentId is provided, validate that the parent category exists
    if (parentId) {
      const parentCategory = await this.prisma.category.findUnique({
        where: { id: parentId },
      });

      if (!parentCategory) {
        throw new BadRequestException(
          `Parent category with ID ${parentId} not found`,
        );
      }
    }

    if (image) {
      finalImageUrl = await this.uploadService.uploadFile(image, 'categories');
    }

    try {
      return await this.prisma.category.create({
        data: {
          ...data,
          imageUrl: finalImageUrl,
          parent: parentId
            ? {
                connect: { id: parentId },
              }
            : undefined,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `A category with slug "${data.slug}" already exists`,
        );
      }
      throw error;
    }
  }

  findAll() {
    const byOrder = [
      { sortOrder: 'asc' as const },
      { createdAt: 'desc' as const },
    ];

    return this.prisma.category.findMany({
      where: {
        parentId: null,
      },
      orderBy: byOrder,
      include: {
        _count: { select: { products: { where: { deletedAt: null } } } },
        children: {
          orderBy: byOrder,
          include: {
            _count: { select: { products: { where: { deletedAt: null } } } },
            children: {
              orderBy: byOrder,
              include: {
                _count: { select: { products: { where: { deletedAt: null } } } },
              },
            },
          },
        },
      },
    });
  }

  /**
   * Persist a new tree layout. The client sends the full flat list of
   * categories with their new parentId + zero-based sortOrder. We validate
   * that every id exists, that referenced parents exist, and that the
   * resulting hierarchy contains no cycles, then apply every change in a
   * single transaction so the tree can never end up half-updated.
   */
  async reorder(dto: ReorderCategoriesDto) {
    const items = dto.items;

    // Reject duplicate ids up front — they make ordering ambiguous.
    const ids = new Set<string>();
    for (const item of items) {
      if (ids.has(item.id)) {
        throw new BadRequestException(
          `Category ${item.id} appears more than once`,
        );
      }
      ids.add(item.id);
    }

    // Every id in the payload must be a real category.
    const existing = await this.prisma.category.findMany({
      where: { id: { in: [...ids] } },
      select: { id: true },
    });
    if (existing.length !== ids.size) {
      const found = new Set(existing.map((c) => c.id));
      const missing = [...ids].filter((id) => !found.has(id));
      throw new BadRequestException(
        `Unknown category id(s): ${missing.join(', ')}`,
      );
    }

    // Build a parent lookup and reject cycles / unknown parents.
    const parentOf = new Map<string, string | null>();
    for (const item of items) {
      const parentId = item.parentId ?? null;
      if (parentId === item.id) {
        throw new BadRequestException(
          `Category ${item.id} cannot be its own parent`,
        );
      }
      if (parentId && !ids.has(parentId)) {
        throw new BadRequestException(
          `Parent ${parentId} is missing from the payload`,
        );
      }
      parentOf.set(item.id, parentId);
    }

    for (const startId of ids) {
      const seen = new Set<string>();
      let current: string | null | undefined = startId;
      while (current) {
        if (seen.has(current)) {
          throw new BadRequestException(
            'Reorder would create a category cycle',
          );
        }
        seen.add(current);
        current = parentOf.get(current) ?? null;
      }
    }

    await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.category.update({
          where: { id: item.id },
          data: {
            sortOrder: item.sortOrder,
            parentId: item.parentId ?? null,
          },
        }),
      ),
    );

    return this.findAll();
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: {
        id,
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
    image?: Express.Multer.File,
  ) {
    const existingCategory = await this.findOne(id);
    const { parentId, imageUrl, image: _image, ...data } = updateCategoryDto;
    let finalImageUrl: string | null | undefined = imageUrl;

    // If parentId is provided, validate that the parent category exists
    if (parentId !== undefined) {
      if (parentId) {
        const parentCategory = await this.prisma.category.findUnique({
          where: { id: parentId },
        });

        if (!parentCategory) {
          throw new BadRequestException(
            `Parent category with ID ${parentId} not found`,
          );
        }
      }
    }

    if (image) {
      // Delete old image if it exists
      if (existingCategory.imageUrl) {
        await this.uploadService.deleteFile(existingCategory.imageUrl);
      }
      finalImageUrl = await this.uploadService.uploadFile(image, 'categories');
    } else if (imageUrl === '') {
      if (existingCategory.imageUrl) {
        await this.uploadService.deleteFile(existingCategory.imageUrl);
      }
      finalImageUrl = null;
    }

    try {
      return await this.prisma.category.update({
        where: {
          id,
        },
        data: {
          ...data,
          imageUrl: finalImageUrl,
          parent:
            parentId !== undefined
              ? parentId
                ? {
                    connect: { id: parentId },
                  }
                : {
                    disconnect: true,
                  }
              : undefined,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `A category with slug "${data.slug}" already exists`,
        );
      }
      throw error;
    }
  }

  async remove(id: string) {
    const category = await this.findOne(id);
    const activeProductCount = await this.prisma.product.count({
      where: { categoryId: id, deletedAt: null },
    });

    if (activeProductCount > 0) {
      throw new ConflictException(
        `Cannot delete "${category.name}" because ${activeProductCount} active product(s) still use this category. Reassign or delete those products first.`,
      );
    }

    let deletedCategory;
    try {
      deletedCategory = await this.prisma.$transaction(async (tx) => {
        await tx.product.updateMany({
          where: { categoryId: id, deletedAt: { not: null } },
          data: { categoryId: null },
        });
        return tx.category.delete({ where: { id } });
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === 'P2003' || error.code === 'P2014')
      ) {
        throw new ConflictException(
          `Cannot delete "${category.name}" while products still use this category. Reassign or delete those products first.`,
        );
      }
      throw error;
    }

    if (category.imageUrl) {
      try {
        await this.uploadService.deleteFile(category.imageUrl);
      } catch {
        // Keep a successful database deletion successful if image cleanup fails.
      }
    }

    return deletedCategory;
  }

  async removeMany(ids: string[]) {
    if (!ids || ids.length === 0) {
      return { message: 'No category IDs provided', count: 0 };
    }

    const uniqueIds = [...new Set(ids)];
    const categories = await this.prisma.category.findMany({
      where: { id: { in: uniqueIds } },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        _count: { select: { products: { where: { deletedAt: null } } } },
      },
    });

    const categoriesInUse = categories.filter(
      (category) => category._count.products > 0,
    );
    if (categoriesInUse.length > 0) {
      const details = categoriesInUse
        .map(
          (category) =>
            `${category.name} (${category._count.products} active product(s))`,
        )
        .join(', ');
      throw new ConflictException(
        this.bulkCategoryDeleteConflictMessage(details),
      );
    }

    let result;
    try {
      result = await this.prisma.$transaction(async (tx) => {
        await tx.product.updateMany({
          where: {
            categoryId: { in: uniqueIds },
            deletedAt: { not: null },
          },
          data: { categoryId: null },
        });
        return tx.category.deleteMany({
          where: { id: { in: uniqueIds } },
        });
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === 'P2003' || error.code === 'P2014')
      ) {
        throw new ConflictException(
          'Cannot delete the selected categories while products still use them. Reassign or delete those products first.',
        );
      }
      throw error;
    }

    for (const category of categories) {
      if (category.imageUrl) {
        try {
          await this.uploadService.deleteFile(category.imageUrl);
        } catch {
          // Keep successful database deletions successful if image cleanup fails.
        }
      }
    }

    return {
      message: 'Categories deleted successfully',
      count: result.count,
      failed: uniqueIds.length - result.count,
    };
  }

  private bulkCategoryDeleteConflictMessage(details: string) {
    return `Cannot delete selected categories because active products still use: ${details}. Reassign or delete those products first.`;
  }
}
