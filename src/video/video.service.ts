import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { QueryVideoDto, ReorderVideoItemDto } from './dto/query-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';

@Injectable()
export class VideoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Helper to validate and clean Facebook video/reel URL.
   */
  validateFacebookUrl(url: string): string {
    const trimmed = url.trim();
    const fbRegex =
      /^(https?:\/\/)?(www\.|m\.|web\.)?(facebook\.com|fb\.watch)\/.+$/i;
    if (!fbRegex.test(trimmed)) {
      throw new BadRequestException(
        'Invalid Facebook URL. Please provide a valid Facebook video or reel link.',
      );
    }
    return trimmed;
  }

  /**
   * Standard include for linked product
   */
  private readonly productInclude = {
    id: true,
    name: true,
    slug: true,
    description: true,
    category: {
      select: {
        id: true,
        name: true,
        slug: true,
      },
    },
    brand: {
      select: {
        id: true,
        name: true,
        slug: true,
      },
    },
    variants: {
      select: {
        id: true,
        sku: true,
        price: true,
        cost: true,
        stockQuantity: true,
        isDefault: true,
      },
    },
    media: {
      select: {
        id: true,
        isFeatured: true,
        sortOrder: true,
        media: {
          select: {
            id: true,
            url: true,
            type: true,
          },
        },
      },
    },
  };

  /**
   * Public list of active videos with pagination and filters
   */
  async findPublic(query: QueryVideoDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.VideoWhereInput = {
      isActive: true,
    };

    if (query.type) {
      where.type = query.type;
    }

    if (query.source) {
      where.source = query.source;
    }

    if (query.isFeatured !== undefined) {
      where.isFeatured = query.isFeatured;
    }

    if (query.productId) {
      where.productId = query.productId;
    }

    if (query.category) {
      where.product = {
        category: {
          OR: [
            { slug: { contains: query.category, mode: 'insensitive' } },
            { name: { contains: query.category, mode: 'insensitive' } },
          ],
        },
      };
    }

    if (query.search) {
      const term = query.search.trim();
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { caption: { contains: term, mode: 'insensitive' } },
      ];
    }

    // Determine sort
    let orderBy: Prisma.VideoOrderByWithRelationInput[] = [
      { sortOrder: 'asc' },
      { createdAt: 'desc' },
    ];

    if (query.sort === 'latest') {
      orderBy = [{ createdAt: 'desc' }];
    } else if (query.sort === 'featured') {
      orderBy = [{ isFeatured: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }];
    } else if (query.sort === 'views') {
      orderBy = [{ views: 'desc' }, { createdAt: 'desc' }];
    }

    const [total, items] = await Promise.all([
      this.prisma.video.count({ where }),
      this.prisma.video.findMany({
        where,
        include: {
          product: {
            select: this.productInclude,
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Admin list of all videos (active + drafts)
   */
  async findAllAdmin(query: QueryVideoDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(200, Number(query.limit) || 50));
    const skip = (page - 1) * limit;

    const where: Prisma.VideoWhereInput = {};

    if (query.type) {
      where.type = query.type;
    }

    if (query.source) {
      where.source = query.source;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.isFeatured !== undefined) {
      where.isFeatured = query.isFeatured;
    }

    if (query.productId) {
      where.productId = query.productId;
    }

    if (query.search) {
      const term = query.search.trim();
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { caption: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.video.count({ where }),
      this.prisma.video.findMany({
        where,
        include: {
          product: {
            select: this.productInclude,
          },
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
    ]);

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Get single video by ID
   */
  async findOne(id: string) {
    const video = await this.prisma.video.findUnique({
      where: { id },
      include: {
        product: {
          select: this.productInclude,
        },
      },
    });

    if (!video) {
      throw new NotFoundException(`Video with ID "${id}" not found`);
    }

    return video;
  }

  /**
   * Get videos linked to a specific product
   */
  async findByProduct(productId: string) {
    return this.prisma.video.findMany({
      where: {
        productId,
        isActive: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Create a new video
   */
  async create(
    dto: CreateVideoDto,
    files?: {
      video?: Express.Multer.File;
      thumbnail?: Express.Multer.File;
    },
  ) {
    let finalVideoUrl = dto.videoUrl || null;
    let finalThumbnailUrl = dto.thumbnailUrl || null;
    let finalSource = dto.source || 'facebook';

    // Handle uploaded files if any
    if (files?.video) {
      finalVideoUrl = await this.uploadService.uploadFile(files.video, 'videos');
      finalSource = 'upload';
    }

    if (files?.thumbnail) {
      finalThumbnailUrl = await this.uploadService.uploadFile(
        files.thumbnail,
        'videos/thumbnails',
      );
    }

    // Facebook URL validation
    let finalFacebookUrl = dto.facebookUrl || null;
    if (finalFacebookUrl) {
      finalFacebookUrl = this.validateFacebookUrl(finalFacebookUrl);
      if (!files?.video && !dto.videoUrl) {
        finalSource = 'facebook';
      }
    }

    // Fallback thumbnail if none provided
    if (!finalThumbnailUrl) {
      if (dto.productId) {
        // Try getting thumbnail from linked product
        const product = await this.prisma.product.findUnique({
          where: { id: dto.productId },
          include: {
            media: {
              include: { media: true },
              orderBy: { sortOrder: 'asc' },
              take: 1,
            },
          },
        });
        if (product?.media?.[0]?.media?.url) {
          finalThumbnailUrl = product.media[0].media.url;
        }
      }

      if (!finalThumbnailUrl) {
        // High quality luxury placeholder thumbnail
        finalThumbnailUrl =
          'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80';
      }
    }

    return this.prisma.video.create({
      data: {
        title: dto.title,
        caption: dto.caption || null,
        type: dto.type || 'reel',
        source: finalSource,
        facebookUrl: finalFacebookUrl,
        videoUrl: finalVideoUrl,
        thumbnailUrl: finalThumbnailUrl,
        durationSec: dto.durationSec || 0,
        views: dto.views || '1.2K',
        likes: dto.likes || '250',
        productId: dto.productId || null,
        isFeatured: dto.isFeatured ?? false,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder || 0,
      },
      include: {
        product: {
          select: this.productInclude,
        },
      },
    });
  }

  /**
   * Update video
   */
  async update(
    id: string,
    dto: UpdateVideoDto,
    files?: {
      video?: Express.Multer.File;
      thumbnail?: Express.Multer.File;
    },
  ) {
    await this.findOne(id);

    const updateData: Prisma.VideoUpdateInput = {};

    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.caption !== undefined) updateData.caption = dto.caption || null;
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.source !== undefined) updateData.source = dto.source;
    if (dto.durationSec !== undefined) updateData.durationSec = dto.durationSec;
    if (dto.views !== undefined) updateData.views = dto.views;
    if (dto.likes !== undefined) updateData.likes = dto.likes;
    if (dto.isFeatured !== undefined) updateData.isFeatured = dto.isFeatured;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.sortOrder !== undefined) updateData.sortOrder = dto.sortOrder;

    if (dto.facebookUrl !== undefined) {
      updateData.facebookUrl = dto.facebookUrl
        ? this.validateFacebookUrl(dto.facebookUrl)
        : null;
    }

    if (dto.productId !== undefined) {
      if (dto.productId) {
        updateData.product = { connect: { id: dto.productId } };
      } else {
        updateData.product = { disconnect: true };
      }
    }

    if (dto.videoUrl !== undefined) {
      updateData.videoUrl = dto.videoUrl || null;
    }

    if (dto.thumbnailUrl !== undefined) {
      updateData.thumbnailUrl = dto.thumbnailUrl;
    }

    if (files?.video) {
      updateData.videoUrl = await this.uploadService.uploadFile(
        files.video,
        'videos',
      );
      updateData.source = 'upload';
    }

    if (files?.thumbnail) {
      updateData.thumbnailUrl = await this.uploadService.uploadFile(
        files.thumbnail,
        'videos/thumbnails',
      );
    }

    return this.prisma.video.update({
      where: { id },
      data: updateData,
      include: {
        product: {
          select: this.productInclude,
        },
      },
    });
  }

  /**
   * Remove a video
   */
  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.video.delete({ where: { id } });
  }

  /**
   * Reorder videos in bulk
   */
  async reorder(items: ReorderVideoItemDto[]) {
    if (!items || !items.length) {
      return { success: true, count: 0 };
    }

    await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.video.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        }),
      ),
    );

    return { success: true, count: items.length };
  }

  /**
   * Toggle active or featured status
   */
  async toggle(id: string, field: 'isActive' | 'isFeatured') {
    const video = await this.findOne(id);
    const newValue = !video[field];

    return this.prisma.video.update({
      where: { id },
      data: { [field]: newValue },
      include: {
        product: {
          select: this.productInclude,
        },
      },
    });
  }

  /**
   * Facebook Graph API Integration
   */
  getFacebookCredentials(customPageId?: string, customToken?: string) {
    const pageId =
      customPageId ||
      this.configService.get<string>('FB_PAGE_ID') ||
      process.env.FB_PAGE_ID;
    const token =
      customToken ||
      this.configService.get<string>('FB_PAGE_TOKEN') ||
      process.env.FB_PAGE_TOKEN;

    return { pageId, token, isConfigured: Boolean(pageId && token) };
  }

  /**
   * Preview videos from Facebook Page
   */
  async previewFacebookVideos(customPageId?: string, customToken?: string) {
    const { pageId, token, isConfigured } = this.getFacebookCredentials(
      customPageId,
      customToken,
    );

    if (!isConfigured) {
      return {
        configured: false,
        message:
          'Facebook Page Credentials (FB_PAGE_ID and FB_PAGE_TOKEN) are not configured. You can either configure them in environment variables or import manually.',
        videos: [],
      };
    }

    try {
      const url = `https://graph.facebook.com/v19.0/${pageId}/videos?fields=id,title,description,permalink_url,picture,length,created_time,views&limit=15&access_token=${token}`;
      const res = await fetch(url);
      if (!res.ok) {
        const errorText = await res.text();
        return {
          configured: true,
          error: true,
          message: `Facebook Graph API error: ${errorText}`,
          videos: [],
        };
      }

      const json = await res.json();
      const videos = (json.data || []).map((v: any) => ({
        fbId: v.id,
        title: v.title || v.description?.slice(0, 60) || `Facebook Video ${v.id}`,
        caption: v.description || '',
        facebookUrl: v.permalink_url || `https://www.facebook.com/watch/?v=${v.id}`,
        thumbnailUrl: v.picture || '',
        durationSec: Math.round(Number(v.length || 0)),
        createdTime: v.created_time,
        views: v.views ? `${v.views}` : '1.5K',
      }));

      return {
        configured: true,
        videos,
      };
    } catch (err: any) {
      return {
        configured: true,
        error: true,
        message: err.message || 'Failed to connect to Facebook Graph API',
        videos: [],
      };
    }
  }

  /**
   * Import selected videos from Facebook into Video table
   */
  async importFacebookVideos(
    items: {
      fbId: string;
      title: string;
      caption?: string;
      facebookUrl: string;
      thumbnailUrl?: string;
      durationSec?: number;
      productId?: string;
    }[],
  ) {
    const created: any[] = [];

    for (const item of items) {
      // Check if already imported
      const existing = await this.prisma.video.findFirst({
        where: {
          facebookUrl: item.facebookUrl,
        },
      });

      if (existing) {
        created.push(existing);
        continue;
      }

      const video = await this.prisma.video.create({
        data: {
          title: item.title,
          caption: item.caption || null,
          type: 'reel',
          source: 'facebook',
          facebookUrl: item.facebookUrl,
          thumbnailUrl:
            item.thumbnailUrl ||
            'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80',
          durationSec: item.durationSec || 45,
          views: '2.5K',
          likes: '350',
          productId: item.productId || null,
          isActive: true,
          isFeatured: false,
        },
        include: {
          product: {
            select: this.productInclude,
          },
        },
      });

      created.push(video);
    }

    return {
      success: true,
      importedCount: created.length,
      data: created,
    };
  }
}
