import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KnowledgeBaseEntity } from './entities/knowledge-base.entity';
import { KbCollaboratorEntity } from './entities/kb-collaborator.entity';
import { KbDocumentEntity } from './entities/kb-document.entity';
import { KbChunkEntity } from './entities/kb-chunk.entity';
import { KnowledgeBaseController } from './knowledge-base.controller';
import { KnowledgeBaseService } from './knowledge-base.service';
import { RetrievalService } from './services/retrieval.service';
import { VectorStoreService } from './services/vector-store.service';
import { DocumentParserService } from './services/document-parser.service';
import { ChunkingService } from './services/chunking.service';
import { EmbeddingService } from './services/embedding.service';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      KnowledgeBaseEntity,
      KbCollaboratorEntity,
      KbDocumentEntity,
      KbChunkEntity,
    ]),
    AuthModule,
    UserModule,
  ],
  controllers: [KnowledgeBaseController],
  providers: [
    KnowledgeBaseService,
    RetrievalService,
    VectorStoreService,
    DocumentParserService,
    ChunkingService,
    EmbeddingService,
  ],
  exports: [RetrievalService, KnowledgeBaseService],
})
export class KnowledgeBaseModule {}
