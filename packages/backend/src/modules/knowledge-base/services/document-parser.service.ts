import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

/** 解析后的文档结构 */
export interface ParsedDocument {
  /** 纯文本内容（保留 Markdown 标题层级） */
  content: string;
  /** 文档标题（从文件名或内容提取） */
  title: string;
}

/**
 * 文档解析服务
 * 支持 PDF、DOCX、MD、TXT 格式
 */
@Injectable()
export class DocumentParserService {
  private readonly logger = new Logger(DocumentParserService.name);

  async parse(filePath: string, fileType: string): Promise<ParsedDocument> {
    const title = path.basename(filePath, path.extname(filePath));

    switch (fileType) {
      case 'pdf':
        return this.parsePdf(filePath, title);
      case 'docx':
        return this.parseDocx(filePath, title);
      case 'md':
      case 'txt':
        return this.parseText(filePath, title);
      default:
        throw new Error(`不支持的文件类型: ${fileType}`);
    }
  }

  private async parsePdf(filePath: string, title: string): Promise<ParsedDocument> {
    const { PDFParse } = await import('pdf-parse') as any;
    const buffer = await fs.readFile(filePath);
    // pdf-parse v2 构造函数接受 LoadParameters 对象，PDF 数据通过 data 属性传入
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const result = await parser.getText();
    // pdf-parse v2 的 TextResult 包含 pages 数组和拼接好的 text 属性
    const content = result.text || result.pages.map((p: { text: string }) => p.text).join('\n');
    return { content, title };
  }

  private async parseDocx(filePath: string, title: string): Promise<ParsedDocument> {
    const mammoth = await import('mammoth');
    const buffer = await fs.readFile(filePath);
    // mammoth 不支持 convertToMarkdown，使用 extractRawText 提取纯文本
    const result = await mammoth.extractRawText({ buffer });
    return { content: result.value, title };
  }

  private async parseText(filePath: string, title: string): Promise<ParsedDocument> {
    const content = await fs.readFile(filePath, 'utf-8');
    return { content, title };
  }
}
