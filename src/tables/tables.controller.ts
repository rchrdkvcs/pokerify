import { Controller, Get, Post, Param } from '@nestjs/common';
import { TablesService } from './tables.service';

@Controller('tables')
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Get()
  findAll() {
    return this.tablesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tablesService.findOne(+id);
  }

  @Post(':id/:action')
  makeAction(@Param('id') id: string, @Param('action') action: string) {
    return this.tablesService.makeAction(+id, action);
  }

  @Get(':id')
  joinTable(@Param('id') id: string) {
    return this.tablesService.joinTable(+id);
  }

  @Get(':id')
  leaveTable(@Param('id') id: string) {
    return this.tablesService.leaveTable(+id);
  }
}
