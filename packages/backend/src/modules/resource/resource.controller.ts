import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { ResourceService } from './resource.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CreateResourceSchema, CreateResourceInput } from '@knowledge-map/shared';

@Controller('resources')
export class ResourceController {
  constructor(private readonly resourceService: ResourceService) {}

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('domain') domain?: string,
    @Query('resourceType') resourceType?: string,
  ) {
    return this.resourceService.findAll(
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 20,
      domain,
      resourceType,
    );
  }

  @Get('search')
  search(@Query('keyword') keyword: string, @Query('domain') domain?: string) {
    return this.resourceService.search(keyword || '', domain);
  }

  @Get('node/:nodeId')
  getByNodeId(@Param('nodeId') nodeId: string) {
    return this.resourceService.getByNodeId(parseInt(nodeId, 10));
  }

  @Get('history')
  getBrowseHistory(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    // TODO: get userId from JWT
    return this.resourceService.getBrowseHistory(
      1,
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 20,
    );
  }

  @Post()
  create(@Body(new ZodValidationPipe(CreateResourceSchema)) body: CreateResourceInput) {
    return this.resourceService.create(body);
  }

  @Post(':id/browse')
  recordBrowse(@Param('id') id: string, @Body() body: { graphNodeId?: number }) {
    // TODO: get userId from JWT
    return this.resourceService.recordBrowse(1, parseInt(id, 10), body.graphNodeId);
  }
}
