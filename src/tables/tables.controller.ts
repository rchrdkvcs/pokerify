import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { TablesService } from './tables.service';
import { CreateTableDto } from './dto/create-table.dto';
import { Request } from 'express';
import { PayloadDto } from '../auth/dto/payload.dto';

@Controller('tables')
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Post()
  create(@Body() createTableDto: CreateTableDto) {
    return this.tablesService.create(createTableDto);
  }

  @Post(':id/join')
  joinTable(
    @Param('id') tableId: string,
    @Req() request: Request & { user: PayloadDto },
  ) {
    return this.tablesService.joinTable(tableId, request);
  }

  @Post(':id/leave')
  leaveTable(
    @Param('id') tableId: string,
    @Req() request: Request & { user: PayloadDto },
  ) {
    return this.tablesService.leaveTable(tableId, request);
  }

  @Post(':id/start')
  startTable(@Param('id') tableId: string) {
    return this.tablesService.startTable(tableId);
  }

  @Get()
  findAll() {
    return this.tablesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tablesService.findOne(id);
  }
}
