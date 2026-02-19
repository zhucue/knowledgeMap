import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { KnowledgeBaseService } from './knowledge-base.service';
import { RetrievalService } from './services/retrieval.service';

@Controller('knowledge-bases')
@UseGuards(JwtAuthGuard)
export class KnowledgeBaseController {
  constructor(
    private readonly kbService: KnowledgeBaseService,
    private readonly retrievalService: RetrievalService,
  ) {}

  @Post()
  async create(
    @CurrentUser('userId') userId: number,
    @Body() body: { name: string; description?: string; visibility?: string },
  ) {
    return this.kbService.create(userId, body);
  }

  @Get()
  async list(
    @CurrentUser('userId') userId: number,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.kbService.listForUser(userId, Number(page) || 1, Number(pageSize) || 20);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('userId') userId: number,
  ) {
    await this.kbService.checkAccess(id, userId, 'view');
    return this.kbService.findById(id);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('userId') userId: number,
    @Body() body: { name?: string; description?: string; visibility?: string },
  ) {
    return this.kbService.update(id, userId, body);
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('userId') userId: number,
  ) {
    await this.kbService.remove(id, userId);
    return { success: true };
  }

  // ========== 协作者 ==========

  @Post(':id/collaborators')
  async addCollaborator(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('userId') userId: number,
    @Body() body: { email: string; role?: string },
  ) {
    return this.kbService.addCollaborator(id, userId, body.email, body.role);
  }

  @Delete(':id/collaborators/:targetUserId')
  async removeCollaborator(
    @Param('id', ParseIntPipe) id: number,
    @Param('targetUserId', ParseIntPipe) targetUserId: number,
    @CurrentUser('userId') userId: number,
  ) {
    await this.kbService.removeCollaborator(id, userId, targetUserId);
    return { success: true };
  }

  // ========== 文档 ==========

  @Post(':id/documents')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/kb',
        filename: (_req, file, cb) => {
          const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    }),
  )
  async uploadDocument(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('userId') userId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // Multer 以 Latin-1 编码存储 originalname，需转为 UTF-8 以正确显示中文文件名
    let originalname: string;
    try {
      originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    } catch {
      originalname = file.originalname;
    }
    return this.kbService.uploadDocument(id, userId, {
      path: file.path,
      originalname,
      size: file.size,
      mimetype: file.mimetype,
    });
  }

  @Get(':id/documents')
  async listDocuments(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('userId') userId: number,
  ) {
    return this.kbService.listDocuments(id, userId);
  }

  @Delete(':id/documents/:docId')
  async removeDocument(
    @Param('id', ParseIntPipe) id: number,
    @Param('docId', ParseIntPipe) docId: number,
    @CurrentUser('userId') userId: number,
  ) {
    await this.kbService.removeDocument(id, docId, userId);
    return { success: true };
  }

  // ========== 检索测试 ==========

  @Post('retrieve')
  async retrieve(
    @CurrentUser('userId') userId: number,
    @Body() body: { query: string; topK?: number },
  ) {
    const kbIds = await this.kbService.getAccessibleKbIds(userId);
    return this.retrievalService.retrieve(body.query, kbIds, body.topK);
  }

  /** 重建所有文档的向量索引 */
  @Post('reindex')
  async reindex() {
    return this.kbService.reindexAllChunks();
  }
}