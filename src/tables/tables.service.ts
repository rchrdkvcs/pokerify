import { BadRequestException, Injectable, NotFoundException, } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GamePhase, Table, TableDocument } from './table.schema';
import { CreateTableDto } from './dto/create-table.dto';
import { Request } from 'express';
import { PayloadDto } from '../auth/dto/payload.dto';
import { UsersService } from '../users/users.service';
import { PlayersService } from '../players/players.service';
import { PokerGameService } from '../poker/poker-game.service';
import { PokerAiService } from '../ai/poker-ai.service';
import { Player, PlayerStatus, PlayerType } from '../players/player.schema';
import { PlayerAction } from '../poker/poker.types';

@Injectable()
export class TablesService {
  constructor(
    @InjectModel(Table.name) private tableModel: Model<TableDocument>,
    private usersService: UsersService,
    private playersService: PlayersService,
    private pokerGameService: PokerGameService,
    private pokerAiService: PokerAiService,
  ) {}

  async create(createTableDto: CreateTableDto) {
    const table = new this.tableModel({ ...createTableDto });
    return await table.save();
  }

  async findAll() {
    return await this.tableModel.find().exec();
  }

  async findOne(id: string) {
    return await this.tableModel.findById(id).exec();
  }

  async joinTable(id: string, req: Request & { user: PayloadDto }) {
    const user = await this.usersService.findOne(req.user.id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const table = await this.tableModel.findById(id).exec();

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    if (table.players.length >= table.maxPlayers) {
      throw new BadRequestException('Table is full');
    }

    const alreadyJoined = table.players.some(
      (player) => player.userId === user._id.toString(),
    );

    if (alreadyJoined) {
      throw new BadRequestException('You have already joined this table');
    }

    const position = table.players.length;
    const newPlayer: Player = {
      userId: user._id.toString(),
      username: user.username,
      type: PlayerType.HUMAN,
      stack: 1000,
      currentBet: 0,
      cards: [],
      position,
      status: PlayerStatus.ACTIVE,
      isDealer: false,
      hasActed: false,
    };

    table.players.push(newPlayer);

    // Add AI players if needed to reach minimum players
    const humanPlayers = table.players.filter(
      (p) => p.type === PlayerType.HUMAN,
    ).length;
    const aiPlayersNeeded = Math.max(0, 2 - humanPlayers);

    for (
      let i = 0;
      i < aiPlayersNeeded && table.players.length < table.maxPlayers;
      i++
    ) {
      const aiPosition = table.players.length;
      const aiPlayer: Player = {
        userId: `ai_${Date.now()}_${i}`,
        username: `AI Player ${i + 1}`,
        type: PlayerType.AI,
        stack: 1000,
        currentBet: 0,
        cards: [],
        position: aiPosition,
        status: PlayerStatus.ACTIVE,
        isDealer: false,
        hasActed: false,
      };
      table.players.push(aiPlayer);
    }

    return await table.save();
  }
  async leaveTable(id: string, req: Request & { user: PayloadDto }) {
    const user = await this.usersService.findOne(req.user.id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const table = await this.tableModel.findById(id).exec();

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    table.players = table.players.filter(
      (player) => player.userId !== user._id.toString(),
    );

    const hasHumanPlayers = table.players.some(
      (p) => p.type === PlayerType.HUMAN,
    );
    if (!hasHumanPlayers) {
      table.players = [];
      table.state = GamePhase.WAITING;
    }

    return await table.save();
  }

  async startTable(id: string) {
    const table = await this.tableModel.findById(id).exec();

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    if (table.players.length < 2) {
      throw new BadRequestException('Need at least 2 players to start');
    }

    this.pokerGameService.initializeGame(table);

    if (
      table.players.length > 0 &&
      table.players[table.currentPlayerIndex].type === PlayerType.AI
    ) {
      this.processAiTurns(table);
    }

    return await table.save();
  }

  async playerAction(
    tableId: string,
    playerId: string,
    action: PlayerAction,
    amount?: number,
  ) {
    const table = await this.tableModel.findById(tableId).exec();

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    const currentPlayer = table.players[table.currentPlayerIndex];

    if (!currentPlayer || currentPlayer.userId !== playerId) {
      throw new BadRequestException('Not your turn');
    }

    // Process the action
    this.pokerGameService.processAction(table, currentPlayer, action, amount);

    // Check if round is complete
    if (this.pokerGameService.isRoundComplete(table)) {
      this.pokerGameService.advanceToNextPhase(table);
    } else {
      // Move to next player
      table.currentPlayerIndex = this.playersService.getNextActivePlayerIndex(
        table.currentPlayerIndex,
        table.players,
      );
    }

    // Process any subsequent AI turns
    this.processAiTurns(table);

    return await table.save();
  }

  private processAiTurns(table: TableDocument) {
    while (
      table.players[table.currentPlayerIndex].type === PlayerType.AI &&
      !this.pokerGameService.isRoundComplete(table)
    ) {
      const aiPlayer = table.players[table.currentPlayerIndex];

      if (
        aiPlayer.status !== PlayerStatus.ACTIVE &&
        aiPlayer.status !== PlayerStatus.ALL_IN
      ) {
        table.currentPlayerIndex = this.playersService.getNextActivePlayerIndex(
          table.currentPlayerIndex,
          table.players,
        );
        continue;
      }

      const decision = this.pokerAiService.makeDecision(
        aiPlayer,
        table.currentBet,
      );

      this.pokerGameService.processAction(
        table,
        aiPlayer,
        decision.action,
        decision.amount,
      );

      if (this.pokerGameService.isRoundComplete(table)) {
        this.pokerGameService.advanceToNextPhase(table);
        continue;
      }

      table.currentPlayerIndex = this.playersService.getNextActivePlayerIndex(
        table.currentPlayerIndex,
        table.players,
      );
    }
  }
}
