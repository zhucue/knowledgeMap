import { Controller, Get, Query } from '@nestjs/common';
import { TopicService } from './topic.service';

@Controller('topics')
export class TopicController {
  constructor(private readonly topicService: TopicService) {}

  @Get('search')
  search(@Query('keyword') keyword: string) {
    return this.topicService.search(keyword || '');
  }

  @Get('hot')
  getHot(@Query('limit') limit?: string) {
    return this.topicService.getHot(limit ? parseInt(limit, 10) : 10);
  }
}
