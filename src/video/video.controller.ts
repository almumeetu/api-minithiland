import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateVideoDto } from './dto/create-video.dto';
import { QueryVideoDto, ReorderVideosDto } from './dto/query-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { VideoService } from './video.service';

@ApiTags('Videos')
@Controller('videos')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Get()
  @ApiOperation({ summary: 'Get active videos for public storefront (cached & paginated)' })
  findPublic(@Query() query: QueryVideoDto) {
    return this.videoService.findPublic(query);
  }

  @Get('product/:productId')
  @ApiOperation({ summary: 'Get videos linked to a specific product' })
  findByProduct(@Param('productId') productId: string) {
    return this.videoService.findByProduct(productId);
  }

  @Get('manage')
  @ApiOperation({ summary: 'Get all videos including inactive (Admin)' })
  findAllAdmin(@Query() query: QueryVideoDto) {
    return this.videoService.findAllAdmin(query);
  }

  @Get('fb-preview')
  @ApiOperation({ summary: 'Preview recent videos from Facebook Page' })
  previewFacebook(
    @Query('pageId') pageId?: string,
    @Query('token') token?: string,
  ) {
    return this.videoService.previewFacebookVideos(pageId, token);
  }

  @Post('fb-import')
  @ApiOperation({ summary: 'Import selected Facebook videos' })
  importFacebook(@Body() body: { items: any[] }) {
    return this.videoService.importFacebookVideos(body.items || []);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single video by ID' })
  findOne(@Param('id') id: string) {
    return this.videoService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create video' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'video', maxCount: 1 },
      { name: 'thumbnail', maxCount: 1 },
    ]),
  )
  create(
    @Body() createVideoDto: CreateVideoDto,
    @UploadedFiles()
    files?: {
      video?: Express.Multer.File[];
      thumbnail?: Express.Multer.File[];
    },
  ) {
    return this.videoService.create(createVideoDto, {
      video: files?.video?.[0],
      thumbnail: files?.thumbnail?.[0],
    });
  }

  @Patch('reorder')
  @ApiOperation({ summary: 'Bulk reorder videos' })
  reorder(@Body() body: ReorderVideosDto) {
    return this.videoService.reorder(body.items || []);
  }

  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Toggle video active or featured status' })
  toggle(
    @Param('id') id: string,
    @Body('field') field: 'isActive' | 'isFeatured',
  ) {
    return this.videoService.toggle(id, field || 'isActive');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update video' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'video', maxCount: 1 },
      { name: 'thumbnail', maxCount: 1 },
    ]),
  )
  update(
    @Param('id') id: string,
    @Body() updateVideoDto: UpdateVideoDto,
    @UploadedFiles()
    files?: {
      video?: Express.Multer.File[];
      thumbnail?: Express.Multer.File[];
    },
  ) {
    return this.videoService.update(id, updateVideoDto, {
      video: files?.video?.[0],
      thumbnail: files?.thumbnail?.[0],
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete video' })
  remove(@Param('id') id: string) {
    return this.videoService.remove(id);
  }
}
