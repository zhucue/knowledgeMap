import { Injectable } from '@nestjs/common';

/** 分块结果 */
export interface ChunkResult {
  content: string;
  headingPath: string;
  tokenCount: number;
  chunkIndex: number;
}

/**
 * 语义分块服务
 * 按 Markdown 标题层级 + 段落边界切分文档
 */
@Injectable()
export class ChunkingService {
  private readonly targetTokens = 500;
  private readonly overlapTokens = 50;

  /**
   * 将文档内容分块
   * @param content 文档文本内容
   * @returns 分块结果数组
   */
  chunk(content: string): ChunkResult[] {
    const sections = this.splitBySections(content);
    const chunks: ChunkResult[] = [];
    let chunkIndex = 0;

    for (const section of sections) {
      const sectionChunks = this.splitSection(section.content, section.headingPath);
      for (const chunk of sectionChunks) {
        chunks.push({ ...chunk, chunkIndex: chunkIndex++ });
      }
    }

    return chunks;
  }

  /** 按标题层级拆分为章节 */
  private splitBySections(content: string): { content: string; headingPath: string }[] {
    const lines = content.split('\n');
    const sections: { content: string; headingPath: string }[] = [];
    const headingStack: string[] = [];
    let currentContent = '';

    for (const line of lines) {
      const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
      if (headingMatch) {
        // 保存之前的内容
        if (currentContent.trim()) {
          sections.push({
            content: currentContent.trim(),
            headingPath: headingStack.join(' > '),
          });
        }
        // 更新标题栈
        const level = headingMatch[1].length;
        const title = headingMatch[2].trim();
        headingStack.splice(level - 1);
        headingStack[level - 1] = title;
        currentContent = '';
      } else {
        currentContent += line + '\n';
      }
    }

    // 最后一段
    if (currentContent.trim()) {
      sections.push({
        content: currentContent.trim(),
        headingPath: headingStack.join(' > '),
      });
    }

    // 如果没有标题结构，整体作为一个 section
    if (sections.length === 0) {
      sections.push({ content: content.trim(), headingPath: '' });
    }

    return sections;
  }

  /** 将单个章节按 token 限制进一步拆分 */
  private splitSection(content: string, headingPath: string): Omit<ChunkResult, 'chunkIndex'>[] {
    const tokens = this.estimateTokens(content);
    if (tokens <= this.targetTokens) {
      return [{ content, headingPath, tokenCount: tokens }];
    }

    const paragraphs = content.split(/\n\n+/);
    const chunks: Omit<ChunkResult, 'chunkIndex'>[] = [];
    let current = '';
    let currentTokens = 0;

    for (const para of paragraphs) {
      const paraTokens = this.estimateTokens(para);
      if (currentTokens + paraTokens > this.targetTokens && current) {
        chunks.push({ content: current.trim(), headingPath, tokenCount: currentTokens });
        // overlap: 保留最后一段的部分内容
        const overlapText = current.slice(-this.overlapTokens * 4);
        current = overlapText + '\n\n' + para;
        currentTokens = this.estimateTokens(current);
      } else {
        current += (current ? '\n\n' : '') + para;
        currentTokens += paraTokens;
      }
    }

    if (current.trim()) {
      chunks.push({ content: current.trim(), headingPath, tokenCount: this.estimateTokens(current) });
    }

    return chunks;
  }

  /** 粗略估算 token 数（中文约 1.5 字/token，英文约 4 字符/token） */
  private estimateTokens(text: string): number {
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const otherChars = text.length - chineseChars;
    return Math.ceil(chineseChars / 1.5 + otherChars / 4);
  }
}
