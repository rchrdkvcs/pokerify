import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TablesService } from './tables.service';
import { CreateTableDto } from './dto/create-table.dto';
import { PlayerActionDto } from './dto/player-action.dto';
import { Request } from 'express';
import { PayloadDto } from '../auth/dto/payload.dto';
import { AuthGuard } from '../auth/auth.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Tables')
@ApiBearerAuth('JWT-auth')
@Controller('tables')
@UseGuards(AuthGuard)
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new poker table' })
  @ApiResponse({ status: 201, description: 'Table successfully created.' })
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  create(@Body() createTableDto: CreateTableDto) {
    return this.tablesService.create(createTableDto);
  }

  @Post(':id/join')
  @ApiOperation({ summary: 'Join a poker table' })
  @ApiParam({ name: 'id', description: 'Table ID' })
  @ApiResponse({
    status: 200,
    description: 'Successfully joined the table. AI player added if alone.',
  })
  @ApiResponse({ status: 400, description: 'Table is full or already joined.' })
  @ApiResponse({ status: 404, description: 'Table not found.' })
  joinTable(
    @Param('id') tableId: string,
    @Req() request: Request & { user: PayloadDto },
  ) {
    return this.tablesService.joinTable(tableId, request);
  }

  @Post(':id/leave')
  @ApiOperation({ summary: 'Leave a poker table' })
  @ApiParam({ name: 'id', description: 'Table ID' })
  @ApiResponse({ status: 200, description: 'Successfully left the table.' })
  @ApiResponse({ status: 404, description: 'Table not found.' })
  leaveTable(
    @Param('id') tableId: string,
    @Req() request: Request & { user: PayloadDto },
  ) {
    return this.tablesService.leaveTable(tableId, request);
  }

  @Post(':id/start')
  @ApiOperation({ summary: 'Start the game at a poker table' })
  @ApiParam({ name: 'id', description: 'Table ID' })
  @ApiResponse({ status: 200, description: 'Game started successfully.' })
  @ApiResponse({
    status: 400,
    description: 'Need at least 2 players to start.',
  })
  @ApiResponse({ status: 404, description: 'Table not found.' })
  startTable(@Param('id') tableId: string) {
    return this.tablesService.startTable(tableId);
  }

  @Post(':id/action')
  @ApiOperation({
    summary: 'Perform a player action (fold, check, call, raise, all-in)',
  })
  @ApiParam({ name: 'id', description: 'Table ID' })
  @ApiResponse({ status: 200, description: 'Action successfully processed.' })
  @ApiResponse({ status: 400, description: 'Invalid action or not your turn.' })
  @ApiResponse({ status: 404, description: 'Table not found.' })
  playerAction(
    @Param('id') tableId: string,
    @Body() playerActionDto: PlayerActionDto,
    @Req() request: Request & { user: PayloadDto },
  ) {
    return this.tablesService.playerAction(
      tableId,
      request.user.id,
      playerActionDto.action,
      playerActionDto.amount,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all poker tables' })
  @ApiResponse({ status: 200, description: 'Returns list of all tables.' })
  findAll() {
    return this.tablesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific poker table by ID' })
  @ApiParam({ name: 'id', description: 'Table ID' })
  @ApiResponse({ status: 200, description: 'Returns the table details.' })
  @ApiResponse({ status: 404, description: 'Table not found.' })
  findOne(@Param('id') id: string) {
    return this.tablesService.findOne(id);
  }
}
