import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { GraphService } from './graph.service';
import { GraphGenerationWorkflow } from '../llm/langgraph/graph-generation.workflow';

@Controller('graph')
export class GraphController {
  constructor(
    private readonly graphService: GraphService,
    private readonly workflow: GraphGenerationWorkflow,
  ) {}

  /**
   * SSE 流式生成图谱
   */
  @Get('generate/stream')
  async generateStream(
    @Query('topic') topic: string,
    @Query('userId') userId: string,
    @Query('provider') provider: string,
    @Res() res: Response,
  ) {
    if (!topic) {
      throw new HttpException('topic is required', HttpStatus.BAD_REQUEST);
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    try {
      const result = await this.workflow.run(topic, {
        userId: userId ? parseInt(userId, 10) : undefined,
        provider,
        onProgress: (event) => {
          res.write(`data: ${JSON.stringify(event)}\n\n`);
        },
      });

      // Send final complete graph data
      const graph = await this.graphService.findById(result.graphId);
      res.write(
        `data: ${JSON.stringify({
          step: 'complete',
          progress: 100,
          message: '图谱生成完成',
          data: { graphId: result.graphId, graph },
        })}\n\n`,
      );
      res.end();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      res.write(
        `data: ${JSON.stringify({
          step: 'error',
          progress: 0,
          message: msg,
        })}\n\n`,
      );
      res.end();
    }
  }

  /**
   * POST 生成图谱 (非流式)
   */
  @Post('generate')
  async generate(
    @Body() body: { topic: string; userId?: number; provider?: string },
  ) {
    if (!body.topic) {
      throw new HttpException('topic is required', HttpStatus.BAD_REQUEST);
    }

    const result = await this.workflow.run(body.topic, {
      userId: body.userId,
      provider: body.provider,
    });

    return this.graphService.findById(result.graphId);
  }

  /**
   * 展开子节点
   */
  @Post(':id/expand/:nodeId')
  async expandNode(
    @Param('id') graphId: string,
    @Param('nodeId') nodeId: string,
    @Body() body: { depth?: number } = {},
  ) {
    const gId = parseInt(graphId, 10);
    const nId = parseInt(nodeId, 10);

    const graph = await this.graphService.findById(gId);
    if (!graph) {
      throw new HttpException('Graph not found', HttpStatus.NOT_FOUND);
    }

    const { node, path } = await this.graphService.getNodeWithPath(nId);
    if (!node) {
      throw new HttpException('Node not found', HttpStatus.NOT_FOUND);
    }

    const result = await this.workflow.run(graph.topic?.name || graph.title, {
      graphId: gId,
      parentNodeContext: {
        nodeId: nId,
        nodeLabel: node.label,
        nodeDescription: node.description || '',
        path,
      },
      config: {
        generateDepth: body.depth || 2,
      },
    });

    // Return newly created child nodes
    const updatedGraph = await this.graphService.findById(gId);
    const newNodes = updatedGraph?.nodes.filter(
      (n) => n.parentId === nId && n.id !== nId,
    );

    return { parentNodeId: nId, newNodes };
  }

  /**
   * 根据ID获取图谱详情
   */
  @Get(':id')
  getGraph(@Param('id') id: string) {
    return this.graphService.findById(parseInt(id, 10));
  }

  /**
   * 获取用户的图谱历史记录
   */
  @Get('history')
  getHistory(
    @Query('userId') userId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.graphService.findByUserId(
      parseInt(userId, 10),
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 20,
    );
  }
}
